const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const Staff = require('../models/Staff');
const { licCourseFilter, userOwnsLicCourse } = require('../utils/licStaff');

// All routes are protected and only for LIC
router.use(protect);
router.use(authorize('lic'));

// @route   GET /api/lic/courses
// @desc    Get courses assigned to LIC (Course.lic = Staff; matches User.staff or legacy User id)
// @access  LIC only
router.get('/courses', async (req, res) => {
  try {
    const filter = await licCourseFilter(req.user);
    const courses = await Course.find(filter)
    .populate('batches', 'batchCode studentCount')
    .populate('instructors.staff', 'name email priority currentWorkload maxWorkload')
    .sort('courseCode');

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
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

    const course = await Course.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const allowed = await userOwnsLicCourse(req.user, course);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'You are not the LIC for this course'
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