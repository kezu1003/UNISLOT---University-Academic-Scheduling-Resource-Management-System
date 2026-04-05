const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  lectureHours: {
    type: Number,
    required: true,
    min: 1
  },
  tutorialHours: {
    type: Number,
    default: 0
  },
  labHours: {
    type: Number,
    default: 0
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 2
  },
  specialization: [{
    type: String,
    enum: ['IT', 'SE', 'DS', 'CYBER', 'CS', 'CSE', 'ISE', 'CSNE', 'IM']
  }],
  lic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  instructors: [{
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    priority: {
      type: Number,
      min: 1,
      max: 3
    },
    type: {
      type: String,
      enum: ['lecture', 'tutorial', 'lab']
    }
  }],
  batches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Validation: Maximum 3 instructors (using validate instead of pre-save)
courseSchema.path('instructors').validate(function(value) {
  return value.length <= 3;
}, 'Maximum 3 instructors allowed per course');

module.exports = mongoose.model('Course', courseSchema);