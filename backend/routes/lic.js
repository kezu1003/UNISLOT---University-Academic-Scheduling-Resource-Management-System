const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const Staff = require('../models/Staff');
const { getHallAvailability } = require('../utils/hallAvailability');

// All routes are protected and only for LIC
router.use(protect);
router.use(authorize('lic'));

// @route   GET /api/lic/courses
// @desc    Get courses assigned to LIC
// @access  LIC only
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ 
      lic: req.user._id,
      isActive: true 
    })
    .select('courseCode courseName credits lectureHours tutorialHours labHours year semester specialization instructors batches lic')
    .populate('batches', 'batchCode studentCount')
    .populate('instructors.staff', 'name email priority currentWorkload maxWorkload')
    .sort('courseCode');

    console.log(`📚 LIC Courses - Found ${courses.length} courses for LIC ${req.user._id}`);

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('❌ LIC courses fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// @route   GET /api/lic/staff
// @desc    Get available staff with priority and workload
// @access  LIC only
router.get('/staff', async (req, res) => {
  try {
    const { specialization, maxWorkload } = req.query;
    const query = { isActive: true };

    if (specialization) {
      query.specialization = specialization.toUpperCase();
    }

    const staff = await Staff.find(query)
      .select('name email priority specialization currentWorkload maxWorkload location')
      .sort({ priority: 1, currentWorkload: 1 });

    // Filter by workload if specified
    let filteredStaff = staff;
    if (maxWorkload) {
      filteredStaff = staff.filter(s => s.currentWorkload < parseInt(maxWorkload));
    }

    // Calculate availability percentage
    const staffWithStats = filteredStaff.map(s => ({
      ...s.toObject(),
      workloadPercentage: (s.currentWorkload / s.maxWorkload) * 100,
      availableHours: s.maxWorkload - s.currentWorkload
    }));

    res.json({
      success: true,
      data: staffWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff',
      error: error.message
    });
  }
});

// @route   GET /api/lic/hall-availability
// @desc    Get hall or lab availability for a selected time slot
// @access  LIC only
router.get('/hall-availability', async (req, res) => {
  try {
    const availability = await getHallAvailability({
      day: req.query.day,
      startTime: req.query.startTime,
      endTime: req.query.endTime,
      type: req.query.type,
      location: req.query.location,
      batchId: req.query.batchId
    });

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error fetching hall availability'
    });
  }
});

// @route   PUT /api/lic/courses/:id/instructors
// @desc    Assign instructors to course (max 3, priority based)
// @access  LIC only
router.put('/courses/:id/instructors', [
  body('instructors').isArray({ min: 1, max: 3 }).withMessage('Select 1-3 instructors'),
  body('instructors.*.staff').notEmpty().withMessage('Staff ID is required'),
  body('instructors.*.priority').isInt({ min: 1, max: 3 }).withMessage('Priority must be 1-3'),
  body('instructors.*.type').isIn(['lecture', 'tutorial', 'lab']).withMessage('Invalid type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { instructors } = req.body;

    // Verify course belongs to this LIC
    const course = await Course.findOne({
      _id: req.params.id,
      lic: req.user._id,
      isActive: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or you are not authorized'
      });
    }

    // Check for duplicate priorities
    const priorities = instructors.map(i => i.priority);
    if (new Set(priorities).size !== priorities.length) {
      return res.status(400).json({
        success: false,
        message: 'Each instructor must have a unique priority (1, 2, or 3)'
      });
    }

    // Verify all staff exist and check workload
    for (let instructor of instructors) {
      const staff = await Staff.findById(instructor.staff);
      
      if (!staff || !staff.isActive) {
        return res.status(400).json({
          success: false,
          message: `Staff member ${instructor.staff} not found or inactive`
        });
      }

      // Calculate hours for this assignment
      let hoursToAdd = 0;
      if (instructor.type === 'lecture') hoursToAdd = course.lectureHours;
      else if (instructor.type === 'tutorial') hoursToAdd = course.tutorialHours;
      else if (instructor.type === 'lab') hoursToAdd = course.labHours;

      if (staff.currentWorkload + hoursToAdd > staff.maxWorkload) {
        return res.status(400).json({
          success: false,
          message: `${staff.name} will exceed maximum workload (${staff.currentWorkload}/${staff.maxWorkload} hours)`
        });
      }
    }

    // Update course
    course.instructors = instructors;
    await course.save();

    // Update staff workload
    for (let instructor of instructors) {
      let hoursToAdd = 0;
      if (instructor.type === 'lecture') hoursToAdd = course.lectureHours;
      else if (instructor.type === 'tutorial') hoursToAdd = course.tutorialHours;
      else if (instructor.type === 'lab') hoursToAdd = course.labHours;

      await Staff.findByIdAndUpdate(instructor.staff, {
        $inc: { currentWorkload: hoursToAdd }
      });
    }

    const updatedCourse = await Course.findById(req.params.id)
      .populate('instructors.staff', 'name email priority currentWorkload maxWorkload');

    res.json({
      success: true,
      message: 'Instructors assigned successfully',
      data: updatedCourse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning instructors',
      error: error.message
    });
  }
});

// @route   GET /api/lic/staff/:id/workload
// @desc    Get detailed workload for a staff member
// @access  LIC only
router.get('/staff/:id/workload', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Find all courses assigned to this staff
    const courses = await Course.find({
      'instructors.staff': staff._id,
      isActive: true
    }).populate('batches', 'batchCode');

    const assignments = courses.map(course => {
      const instructor = course.instructors.find(
        i => i.staff.toString() === staff._id.toString()
      );
      
      let hours = 0;
      if (instructor.type === 'lecture') hours = course.lectureHours;
      else if (instructor.type === 'tutorial') hours = course.tutorialHours;
      else if (instructor.type === 'lab') hours = course.labHours;

      return {
        courseCode: course.courseCode,
        courseName: course.courseName,
        type: instructor.type,
        priority: instructor.priority,
        hours,
        batches: course.batches
      };
    });

    res.json({
      success: true,
      data: {
        staff: {
          name: staff.name,
          email: staff.email,
          currentWorkload: staff.currentWorkload,
          maxWorkload: staff.maxWorkload,
          workloadPercentage: (staff.currentWorkload / staff.maxWorkload) * 100,
          availableHours: staff.maxWorkload - staff.currentWorkload
        },
        assignments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching workload',
      error: error.message
    });
  }
});

module.exports = router;
