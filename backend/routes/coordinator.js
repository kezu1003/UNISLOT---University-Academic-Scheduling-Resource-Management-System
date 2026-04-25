const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getHallAvailability } = require('../utils/hallAvailability');

// Models
let Timetable, Staff, Course, Batch, Hall;

try {
  Timetable = require('../models/Timetable');
  Staff = require('../models/Staff');
  Course = require('../models/Course');
  Batch = require('../models/Batch');
  Hall = require('../models/Hall');
  console.log('✅ Coordinator models loaded');
} catch (error) {
  console.error('❌ Error loading models:', error.message);
}

// ==================== PUBLIC TEST ROUTE ====================
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Coordinator routes working!',
    timestamp: new Date()
  });
});

// ==================== PROTECTED ROUTES ====================
// Apply auth middleware to all routes below
router.use(protect);
router.use(authorize('coordinator', 'admin'));

// ==================== TIMETABLE ROUTES ====================

const validateHallCapacityForBatch = async (batchId, hallId) => {
  const [batch, hall] = await Promise.all([
    Batch.findOne({ _id: batchId, isActive: true }).lean(),
    Hall.findOne({ _id: hallId, isActive: true }).lean()
  ]);

  if (!batch) {
    return {
      success: false,
      status: 404,
      message: 'Selected batch not found or inactive'
    };
  }

  if (!hall) {
    return {
      success: false,
      status: 404,
      message: 'Selected hall not found or inactive'
    };
  }

  if (batch.studentCount > hall.capacity) {
    return {
      success: false,
      status: 400,
      message: `Hall ${hall.hallCode} capacity (${hall.capacity}) is too small for batch ${batch.batchCode} (${batch.studentCount} students)`
    };
  }

  return { success: true, batch, hall };
};

// @route   GET /api/coordinator/timetable
// @desc    Get all timetable entries
router.get('/timetable', async (req, res) => {
  try {
    console.log('📅 Fetching timetable...');
    
    const { batch, instructor, hall, day, status } = req.query;
    const query = {};

    if (batch) query.batch = batch;
    if (instructor) query.instructor = instructor;
    if (hall) query.hall = hall;
    if (day) query.day = day;
    if (status) query.status = status;

    const timetable = await Timetable.find(query)
      .populate('course', 'courseCode courseName credits')
      .populate('batch', 'batchCode studentCount type specialization')
      .populate('instructor', 'name email location priority')
      .populate('hall', 'hallCode hallName capacity location type')
      .populate('approvedBy', 'name')
      .sort({ day: 1, startTime: 1 })
      .lean();

    console.log(`✅ Found ${timetable.length} timetable entries`);

    res.json({
      success: true,
      data: timetable || [],
      total: timetable?.length || 0
    });
  } catch (error) {
    console.error('❌ Timetable fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetable',
      error: error.message
    });
  }
});

// @route   GET /api/coordinator/hall-availability
// @desc    Get hall or lab availability for a selected time slot
router.get('/hall-availability', async (req, res) => {
  try {
    const availability = await getHallAvailability({
      day: req.query.day,
      startTime: req.query.startTime,
      endTime: req.query.endTime,
      type: req.query.type,
      location: req.query.location,
      batchId: req.query.batchId,
      excludeEntryId: req.query.excludeEntryId
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

// @route   POST /api/coordinator/timetable
// @desc    Create new timetable entry
router.post('/timetable', async (req, res) => {
  try {
    console.log('📝 Creating timetable entry:', req.body);

    const { course, batch, instructor, hall, day, startTime, endTime, type, mode, notes } = req.body;

    // Validate required fields
    if (!course || !batch || !instructor || !hall || !day || !startTime || !endTime || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['course', 'batch', 'instructor', 'hall', 'day', 'startTime', 'endTime', 'type']
      });
    }

    const capacityCheck = await validateHallCapacityForBatch(batch, hall);
    if (!capacityCheck.success) {
      return res.status(capacityCheck.status).json({
        success: false,
        message: capacityCheck.message
      });
    }

    // Create timetable entry
    const timetable = await Timetable.create({
      course,
      batch,
      instructor,
      hall,
      day,
      startTime,
      endTime,
      type,
      mode: mode || 'physical',
      notes,
      approvedBy: req.user._id,
      status: 'scheduled',
      isPublished: false
    });

    // Populate and return
    const populated = await Timetable.findById(timetable._id)
      .populate('course', 'courseCode courseName')
      .populate('batch', 'batchCode studentCount')
      .populate('instructor', 'name email')
      .populate('hall', 'hallCode hallName');

    console.log('✅ Timetable entry created:', timetable._id);

    res.status(201).json({
      success: true,
      message: 'Timetable entry created successfully',
      data: populated
    });
  } catch (error) {
    console.error('❌ Timetable create error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating timetable entry',
      error: error.message
    });
  }
});

// @route   PUT /api/coordinator/timetable/:id
// @desc    Update timetable entry with hall capacity validation
router.put('/timetable/:id', async (req, res) => {
  try {
    const existingTimetable = await Timetable.findById(req.params.id).lean();

    if (!existingTimetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    const batchId = req.body.batch || existingTimetable.batch;
    const hallId = req.body.hall || existingTimetable.hall;
    const capacityCheck = await validateHallCapacityForBatch(batchId, hallId);

    if (!capacityCheck.success) {
      return res.status(capacityCheck.status).json({
        success: false,
        message: capacityCheck.message
      });
    }

    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { ...req.body, approvedBy: req.user._id },
      { new: true, runValidators: true }
    )
      .populate('course', 'courseCode courseName')
      .populate('batch', 'batchCode studentCount')
      .populate('instructor', 'name email')
      .populate('hall', 'hallCode hallName');

    res.json({
      success: true,
      message: 'Timetable entry updated',
      data: timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating timetable',
      error: error.message
    });
  }
});

// @route   PUT /api/coordinator/timetable/:id
// @desc    Update timetable entry
router.put('/timetable/:id', async (req, res) => {
  try {
    console.log('✏️ Updating timetable:', req.params.id);

    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { ...req.body, approvedBy: req.user._id },
      { new: true, runValidators: true }
    )
      .populate('course', 'courseCode courseName')
      .populate('batch', 'batchCode studentCount')
      .populate('instructor', 'name email')
      .populate('hall', 'hallCode hallName');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    console.log('✅ Timetable updated');

    res.json({
      success: true,
      message: 'Timetable entry updated',
      data: timetable
    });
  } catch (error) {
    console.error('❌ Timetable update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating timetable',
      error: error.message
    });
  }
});

// @route   DELETE /api/coordinator/timetable/:id
// @desc    Cancel timetable entry
router.delete('/timetable/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Timetable entry cancelled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling timetable',
      error: error.message
    });
  }
});

// @route   GET /api/coordinator/timetable/conflicts
// @desc    Check for scheduling conflicts
router.get('/timetable/conflicts', async (req, res) => {
  try {
    console.log('🔍 Checking conflicts...');
    
    const conflicts = [];
    
    const entries = await Timetable.find({ status: { $ne: 'cancelled' } })
      .populate('course', 'courseCode')
      .populate('batch', 'batchCode')
      .populate('instructor', 'name')
      .populate('hall', 'hallCode')
      .lean();

    // Check for conflicts between entries
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const e1 = entries[i];
        const e2 = entries[j];

        // Skip if different days
        if (e1.day !== e2.day) continue;

        // Check time overlap
        const overlap = e1.startTime < e2.endTime && e1.endTime > e2.startTime;

        if (overlap) {
          // Same hall conflict
          if (e1.hall?._id?.toString() === e2.hall?._id?.toString()) {
            conflicts.push({
              type: 'HALL_CONFLICT',
              severity: 'high',
              message: `Hall ${e1.hall?.hallCode} is double-booked`,
              entry1: { 
                id: e1._id, 
                course: e1.course?.courseCode, 
                time: `${e1.startTime}-${e1.endTime}` 
              },
              entry2: { 
                id: e2._id, 
                course: e2.course?.courseCode, 
                time: `${e2.startTime}-${e2.endTime}` 
              }
            });
          }

          // Same instructor conflict
          if (e1.instructor?._id?.toString() === e2.instructor?._id?.toString()) {
            conflicts.push({
              type: 'INSTRUCTOR_CONFLICT',
              severity: 'high',
              message: `${e1.instructor?.name} is double-booked`,
              entry1: { 
                id: e1._id, 
                course: e1.course?.courseCode,
                instructor: e1.instructor?.name 
              },
              entry2: { 
                id: e2._id, 
                course: e2.course?.courseCode,
                instructor: e2.instructor?.name 
              }
            });
          }

          // Same batch conflict
          if (e1.batch?._id?.toString() === e2.batch?._id?.toString()) {
            conflicts.push({
              type: 'BATCH_CONFLICT',
              severity: 'high',
              message: `Batch ${e1.batch?.batchCode} has overlapping classes`,
              entry1: { 
                id: e1._id, 
                course: e1.course?.courseCode,
                batch: e1.batch?.batchCode 
              },
              entry2: { 
                id: e2._id, 
                course: e2.course?.courseCode,
                batch: e2.batch?.batchCode 
              }
            });
          }
        }
      }
    }

    console.log(`✅ Found ${conflicts.length} conflicts`);

    res.json({
      success: true,
      data: conflicts,
      total: conflicts.length,
      summary: {
        hallConflicts: conflicts.filter(c => c.type === 'HALL_CONFLICT').length,
        instructorConflicts: conflicts.filter(c => c.type === 'INSTRUCTOR_CONFLICT').length,
        batchConflicts: conflicts.filter(c => c.type === 'BATCH_CONFLICT').length
      }
    });
  } catch (error) {
    console.error('❌ Conflicts check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking conflicts',
      error: error.message
    });
  }
});

// @route   POST /api/coordinator/timetable/publish
// @desc    Publish timetable for selected batches
router.post('/timetable/publish', async (req, res) => {
  try {
    const { batches, message } = req.body;

    if (!batches || batches.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Select at least one batch to publish'
      });
    }

    const result = await Timetable.updateMany(
      { 
        batch: { $in: batches }, 
        isPublished: false,
        status: { $ne: 'cancelled' }
      },
      { isPublished: true }
    );

    console.log(`✅ Published ${result.modifiedCount} entries`);

    res.json({
      success: true,
      message: `Published ${result.modifiedCount} timetable entries`,
      data: { 
        published: result.modifiedCount,
        batches: batches.length
      }
    });
  } catch (error) {
    console.error('❌ Publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing timetable',
      error: error.message
    });
  }
});

// ==================== WORKLOAD ROUTES ====================

// @route   GET /api/coordinator/workload
// @desc    Get all staff workload
router.get('/workload', async (req, res) => {
  try {
    console.log('📊 Fetching workload...');
    
    const { location, specialization } = req.query;
    const query = { isActive: true };

    if (location) query.location = location;
    if (specialization) query.specialization = specialization;

    const staff = await Staff.find(query)
      .select('name email priority specialization location currentWorkload maxWorkload')
      .sort({ currentWorkload: -1 })
      .lean();

    const workloadData = staff.map(s => {
      const percentage = s.maxWorkload > 0 ? (s.currentWorkload / s.maxWorkload) * 100 : 0;
      let status = 'available';
      if (percentage > 100) status = 'overloaded';
      else if (percentage >= 90) status = 'near-capacity';
      else if (percentage >= 70) status = 'moderate';

      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        priority: s.priority,
        specialization: s.specialization || [],
        location: s.location,
        currentWorkload: s.currentWorkload || 0,
        maxWorkload: s.maxWorkload || 20,
        workloadPercentage: Math.round(percentage),
        availableHours: (s.maxWorkload || 20) - (s.currentWorkload || 0),
        status
      };
    });

    const stats = {
      total: workloadData.length,
      overloaded: workloadData.filter(s => s.status === 'overloaded').length,
      nearCapacity: workloadData.filter(s => s.status === 'near-capacity').length,
      moderate: workloadData.filter(s => s.status === 'moderate').length,
      available: workloadData.filter(s => s.status === 'available').length,
      averageWorkload: workloadData.length > 0 
        ? Math.round(workloadData.reduce((sum, s) => sum + s.currentWorkload, 0) / workloadData.length)
        : 0
    };

    console.log(`✅ Found ${workloadData.length} staff members`);

    res.json({
      success: true,
      data: workloadData,
      stats
    });
  } catch (error) {
    console.error('❌ Workload fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workload',
      error: error.message
    });
  }
});

// @route   GET /api/coordinator/workload/export
// @desc    Export workload report as PDF
router.get('/workload/export', async (req, res) => {
  try {
    console.log('📊 Exporting workload report...');

    const { location, status } = req.query;
    const query = { isActive: true };

    if (location) query.location = location;

    const staff = await Staff.find(query)
      .select('name email priority specialization location currentWorkload maxWorkload')
      .sort({ currentWorkload: -1 })
      .lean();

    const workloadData = staff.map(s => {
      const percentage = s.maxWorkload > 0 ? (s.currentWorkload / s.maxWorkload) * 100 : 0;
      let calculatedStatus = 'available';
      if (percentage > 100) calculatedStatus = 'overloaded';
      else if (percentage >= 90) calculatedStatus = 'near-capacity';
      else if (percentage >= 70) calculatedStatus = 'moderate';

      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        priority: s.priority,
        specialization: s.specialization || [],
        location: s.location,
        currentWorkload: s.currentWorkload || 0,
        maxWorkload: s.maxWorkload || 20,
        workloadPercentage: Math.round(percentage),
        availableHours: (s.maxWorkload || 20) - (s.currentWorkload || 0),
        status: calculatedStatus
      };
    }).filter(s => {
      if (status) {
        return s.status === status;
      }
      return true;
    });

    const stats = {
      total: workloadData.length,
      overloaded: workloadData.filter(s => s.status === 'overloaded').length,
      nearCapacity: workloadData.filter(s => s.status === 'near-capacity').length,
      moderate: workloadData.filter(s => s.status === 'moderate').length,
      available: workloadData.filter(s => s.status === 'available').length,
      averageWorkload: workloadData.length > 0 
        ? Math.round(workloadData.reduce((sum, s) => sum + s.currentWorkload, 0) / workloadData.length)
        : 0
    };

    const { generateWorkloadPDF } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateWorkloadPDF(workloadData, stats);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=workload-report-${new Date().toISOString().split('T')[0]}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Workload export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting workload report',
      error: error.message
    });
  }
});

// @route   GET /api/coordinator/workload/:staffId
// @desc    Get detailed workload for specific staff
router.get('/workload/:staffId', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.staffId).lean();

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    const schedules = await Timetable.find({
      instructor: staff._id,
      status: { $ne: 'cancelled' }
    })
      .populate('course', 'courseCode courseName')
      .populate('batch', 'batchCode')
      .populate('hall', 'hallCode')
      .sort({ day: 1, startTime: 1 })
      .lean();

    // Group by day
    const weekSchedule = {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [],
      Friday: [], Saturday: [], Sunday: []
    };

    schedules.forEach(s => {
      if (weekSchedule[s.day]) {
        weekSchedule[s.day].push(s);
      }
    });

    // Calculate hours per day
    const hoursPerDay = {};
    for (let day in weekSchedule) {
      hoursPerDay[day] = weekSchedule[day].reduce((total, schedule) => {
        const start = schedule.startTime.split(':').map(Number);
        const end = schedule.endTime.split(':').map(Number);
        const hours = (end[0] * 60 + end[1] - start[0] * 60 - start[1]) / 60;
        return total + hours;
      }, 0);
    }

    res.json({
      success: true,
      data: {
        staff: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          priority: staff.priority,
          specialization: staff.specialization,
          location: staff.location,
          currentWorkload: staff.currentWorkload || 0,
          maxWorkload: staff.maxWorkload || 20,
          workloadPercentage: staff.maxWorkload > 0 
            ? Math.round((staff.currentWorkload / staff.maxWorkload) * 100) 
            : 0,
          availableHours: (staff.maxWorkload || 20) - (staff.currentWorkload || 0)
        },
        weekSchedule,
        hoursPerDay,
        totalSchedules: schedules.length
      }
    });
  } catch (error) {
    console.error('❌ Staff workload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff workload',
      error: error.message
    });
  }
});

// @route   GET /api/coordinator/workload/export
// @desc    Export workload report as PDF
router.get('/workload/export', async (req, res) => {
  try {
    console.log('📊 Exporting workload report...');
    
    const { location, specialization } = req.query;
    const query = { isActive: true };

    if (location) query.location = location;
    if (specialization) query.specialization = specialization;

    const staff = await Staff.find(query)
      .select('name email priority specialization location currentWorkload maxWorkload')
      .sort({ currentWorkload: -1 })
      .lean();

    const workloadData = staff.map(s => {
      const percentage = s.maxWorkload > 0 ? (s.currentWorkload / s.maxWorkload) * 100 : 0;
      let status = 'available';
      if (percentage > 100) status = 'overloaded';
      else if (percentage >= 90) status = 'near-capacity';
      else if (percentage >= 70) status = 'moderate';

      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        priority: s.priority,
        specialization: s.specialization || [],
        location: s.location,
        currentWorkload: s.currentWorkload || 0,
        maxWorkload: s.maxWorkload || 20,
        workloadPercentage: Math.round(percentage),
        availableHours: (s.maxWorkload || 20) - (s.currentWorkload || 0),
        status
      };
    });

    const stats = {
      total: workloadData.length,
      overloaded: workloadData.filter(s => s.status === 'overloaded').length,
      nearCapacity: workloadData.filter(s => s.status === 'near-capacity').length,
      moderate: workloadData.filter(s => s.status === 'moderate').length,
      available: workloadData.filter(s => s.status === 'available').length,
      averageWorkload: workloadData.length > 0 
        ? Math.round(workloadData.reduce((sum, s) => sum + s.currentWorkload, 0) / workloadData.length)
        : 0
    };

    // Generate PDF
    const { generateWorkloadPDF } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateWorkloadPDF(workloadData, stats);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=workload-report-${new Date().toISOString().split('T')[0]}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Workload export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting workload report',
      error: error.message
    });
  }
});

module.exports = router;



