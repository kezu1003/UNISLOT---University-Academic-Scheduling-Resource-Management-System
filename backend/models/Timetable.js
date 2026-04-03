const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  hall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    required: true
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  type: {
    type: String,
    enum: ['lecture', 'tutorial', 'lab'],
    required: true
  },
  mode: {
    type: String,
    enum: ['physical', 'online'],
    default: 'physical'
  },
  status: {
    type: String,
    enum: ['scheduled', 'rescheduled', 'cancelled'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes for conflict checking
timetableSchema.index({ day: 1, startTime: 1, endTime: 1, hall: 1 });
timetableSchema.index({ day: 1, startTime: 1, endTime: 1, instructor: 1 });
timetableSchema.index({ day: 1, startTime: 1, endTime: 1, batch: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);