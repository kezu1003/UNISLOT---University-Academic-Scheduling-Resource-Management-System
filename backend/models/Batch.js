const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
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
  type: {
    type: String,
    enum: ['WD', 'WE'],
    required: true
  },
  specialization: {
    type: String,
    enum: ['IT', 'SE', 'DS', 'CYBER', 'CS', 'CSE', 'ISE', 'CSNE', 'IM'],
    required: true
  },
  mainGroup: {
    type: String,
    required: true
  },
  subGroup: {
    type: String,
    required: true
  },
  studentCount: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Batch', batchSchema);
