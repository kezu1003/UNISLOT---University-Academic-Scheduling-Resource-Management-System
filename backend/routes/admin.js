const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const Staff = require('../models/Staff');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Hall = require('../models/Hall');
const Timetable = require('../models/Timetable');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// All routes are protected and only for admin
router.use(protect);
router.use(authorize('admin', 'coordinator'));

// ==================== STAFF MANAGEMENT ====================

// @route   POST /api/admin/staff/upload
// @desc    Upload staff from TXT file
// @access  Admin only
router.post('/staff/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    const staffData = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Expected format: staffId|name|email|priority|specialization|location
      const parts = line.split('|').map(p => p.trim());
      
      if (parts.length < 6) {
        errors.push(`Line ${i + 1}: Invalid format`);
        continue;
      }

      const [staffId, name, email, priority, specialization, location] = parts;

      // Validate data
      if (!staffId || !name || !email) {
        errors.push(`Line ${i + 1}: Missing required fields`);
        continue;
      }

      staffData.push({
        staffId,
        name,
        email: email.toLowerCase(),
        priority: parseInt(priority) || 50,
        specialization: specialization.split(',').map(s => s.trim().toUpperCase()),
        location: location || 'Malabe'
      });
    }

    if (staffData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid staff data found',
        errors
      });
    }

    // Bulk insert with error handling
    const result = await Staff.insertMany(staffData, { ordered: false })
      .catch(err => {
        // Handle duplicate key errors
        if (err.code === 11000) {
          const duplicates = err.writeErrors?.map(e => 
            staffData[e.err.index].email
          ) || [];
          return { 
            insertedCount: staffData.length - (err.writeErrors?.length || 0),
            duplicates 
          };
        }
        throw err;
      });

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${result.insertedCount || result.length} staff members`,
      data: {
        inserted: result.insertedCount || result.length,
        duplicates: result.duplicates || [],
        errors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading staff',
      error: error.message
    });
  }
});

// @route   GET /api/admin/staff
// @desc    Get all staff
// @access  Admin only
router.get('/staff', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      specialization,
      location,
      sortBy = 'priority',
      order = 'asc'
    } = req.query;

    const query = { isActive: true };

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { staffId: { $regex: search, $options: 'i' } }
      ];
    }

    // Specialization filter
    if (specialization) {
      query.specialization = specialization.toUpperCase();
    }

    // Location filter
    if (location) {
      query.location = location;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const staff = await Staff.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Staff.countDocuments(query);

    res.json({
      success: true,
      data: staff,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff',
      error: error.message
    });
  }
});

// @route   POST /api/admin/staff
// @desc    Add single staff member
// @access  Admin only
router.post('/staff', [
  body('staffId').notEmpty().withMessage('Staff ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('priority').isInt({ min: 1, max: 100 }).withMessage('Priority must be between 1-100'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const staff = await Staff.create(req.body);

    res.status(201).json({
      success: true,
      data: staff
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Staff with this ID or email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating staff',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/staff/:id
// @desc    Update staff member
// @access  Admin only
router.put('/staff/:id', async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating staff',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/staff/:id
// @desc    Delete staff member (soft delete)
// @access  Admin only
router.delete('/staff/:id', async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting staff',
      error: error.message
    });
  }
});

// ==================== BATCH MANAGEMENT ====================

// @route   POST /api/admin/batches
// @desc    Create batch
// @access  Admin only
router.post('/batches', [
  body('batchCode').matches(/^Y\d\.S\d\.(WD|WE)\.(IT|SE|DS|CYBER|CS|CSE|ISE|CSNE|IM)\.\d{2}\.\d{2}$/)
    .withMessage('Invalid batch code format'),
  body('studentCount').isInt({ min: 1 }).withMessage('Student count must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Parse batch code
    const parts = req.body.batchCode.match(/^Y(\d)\.S(\d)\.(WD|WE)\.([A-Z]+)\.(\d{2})\.(\d{2})$/);
    
    const batch = await Batch.create({
      ...req.body,
      year: parseInt(parts[1]),
      semester: parseInt(parts[2]),
      type: parts[3],
      specialization: parts[4],
      mainGroup: parts[5],
      subGroup: parts[6]
    });

    res.status(201).json({
      success: true,
      data: batch
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Batch with this code already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating batch',
      error: error.message
    });
  }
});

// @route   GET /api/admin/batches
// @desc    Get all batches
// @access  Admin only
router.get('/batches', async (req, res) => {
  try {
    const { year, semester, type, specialization } = req.query;
    const query = { isActive: true };

    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);
    if (type) query.type = type;
    if (specialization) query.specialization = specialization;

    const batches = await Batch.find(query).sort('batchCode');

    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching batches',
      error: error.message
    });
  }
});

// ==================== HALL MANAGEMENT ====================

// @route   POST /api/admin/halls
// @desc    Create hall
// @access  Admin only
router.post('/halls', [
  body('hallCode').notEmpty().withMessage('Hall code is required'),
  body('hallName').notEmpty().withMessage('Hall name is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be positive'),
  body('location').notEmpty().withMessage('Location is required'),
  body('type').isIn(['Lecture Hall', 'Lab', 'Tutorial Room']).withMessage('Invalid hall type'),
  body('status').optional().isIn(['Active', 'Maintenance', 'Out of Service']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const hall = await Hall.create(req.body);

    res.status(201).json({
      success: true,
      data: hall
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Hall with this code already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating hall',
      error: error.message
    });
  }
});

// @route   GET /api/admin/halls
// @desc    Get all halls
// @access  Admin only
router.get('/halls', async (req, res) => {
  try {
    const { location, type, minCapacity, status } = req.query;
    const query = { isActive: true };

    if (location) query.location = location;
    if (type) query.type = type;
    if (minCapacity) query.capacity = { $gte: parseInt(minCapacity) };
    if (status) query.status = status;
    else query.status = { $ne: 'Out of Service' }; // By default, don't show out of service halls

    const halls = await Hall.find(query).sort('hallCode');

    res.json({
      success: true,
      data: halls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching halls',
      error: error.message
    });
  }
});

<<<<<<< HEAD
=======
// @route   PUT /api/admin/halls/:id
// @desc    Update hall
// @access  Admin only
router.put('/halls/:id', [
  body('hallCode').optional().notEmpty().withMessage('Hall code is required'),
  body('hallName').optional().notEmpty().withMessage('Hall name is required'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be positive'),
  body('location').optional().notEmpty().withMessage('Location is required'),
  body('type').optional().isIn(['Lecture Hall', 'Lab', 'Tutorial Room']).withMessage('Invalid hall type'),
  body('status').optional().isIn(['Active', 'Maintenance', 'Out of Service']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const hall = await Hall.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    res.json({
      success: true,
      data: hall
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Hall with this code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating hall',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/halls/:id
// @desc    Remove hall for maintenance
// @access  Admin only
router.delete('/halls/:id', async (req, res) => {
  try {
    const maintenanceIssue = req.body?.maintenanceIssue?.trim();

    if (!maintenanceIssue) {
      return res.status(400).json({
        success: false,
        message: 'Maintenance issue is required'
      });
    }

    const hall = await Hall.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Maintenance',
        isActive: false,
        maintenanceIssue,
        maintenanceMarkedAt: new Date()
      },
      { new: true }
    );

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    res.json({
      success: true,
      message: 'Hall removed for maintenance successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing hall for maintenance',
      error: error.message
    });
  }
});

>>>>>>> fec701362d3b1719b076d7b4abef8c2eaf0fca05
// ==================== COURSE MANAGEMENT ====================

function normalizeCoursePayload(body) {
  const payload = { ...body };
  if (payload.lic === '' || payload.lic === undefined) {
    payload.lic = null;
  }
  if (payload.courseCode) {
    payload.courseCode = String(payload.courseCode).toUpperCase().trim();
  }
  if (Array.isArray(payload.batches) && payload.batches.length === 0) {
    payload.batches = [];
  }
  return payload;
}

// @route   POST /api/admin/courses
// @desc    Create course
// @access  Admin only
router.post('/courses', [
  body('courseCode').notEmpty().withMessage('Course code is required'),
  body('courseName').notEmpty().withMessage('Course name is required'),
  body('credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1-6'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const course = await Course.create(normalizeCoursePayload(req.body));

    const populated = await Course.findById(course._id)
      .populate('lic', 'name email')
      .populate('instructors.staff', 'name email priority')
      .populate('batches', 'batchCode studentCount');

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
});

// @route   GET /api/admin/courses
// @desc    Get all courses
// @access  Admin only
router.get('/courses', async (req, res) => {
  try {
    const { year, semester, specialization } = req.query;
    const query = { isActive: true };

    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);
    if (specialization) query.specialization = specialization;

    const courses = await Course.find(query)
      .populate('lic', 'name email')
      .populate('instructors.staff', 'name email priority')
      .populate('batches', 'batchCode studentCount')
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

// @route   GET /api/admin/courses/:id
// @desc    Get single course
// @access  Admin / Coordinator
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('lic', 'name email')
      .populate('instructors.staff', 'name email priority')
      .populate('batches', 'batchCode studentCount');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/courses/:id
// @desc    Update course
// @access  Admin / Coordinator
router.put('/courses/:id', [
  body('courseName').optional().notEmpty().withMessage('Course name cannot be empty'),
  body('credits').optional().isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1-6'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const existing = await Course.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const update = normalizeCoursePayload(req.body);
    delete update.courseCode;

    Object.assign(existing, update);
    await existing.save();

    const course = await Course.findById(existing._id)
      .populate('lic', 'name email')
      .populate('instructors.staff', 'name email priority')
      .populate('batches', 'batchCode studentCount');

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Delete course (blocked if timetable entries exist)
// @access  Admin / Coordinator
router.delete('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const scheduleCount = await Timetable.countDocuments({ course: course._id });
    if (scheduleCount > 0) {
      await Timetable.deleteMany({ course: course._id });
    }

    await Course.deleteOne({ _id: course._id });

    res.json({
      success: true,
      message:
        scheduleCount > 0
          ? `Course deleted (${scheduleCount} timetable slot(s) removed).`
          : 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
});

module.exports = router;