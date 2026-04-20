const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchCode: {
    type: String,
    required: true,
    unique: true,
    match: [/^Y\d\.S\d\.(WD|WE)\.(IT|SE|DS|CYBER|CS|CSE|ISE|CSNE|IM)\.\d{2}\.\d{2}$/, 'Invalid batch code format']
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
    required: true,
    match: /^\d{2}$/
  },
  subGroup: {
    type: String,
    required: true,
    match: /^\d{2}$/
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full batch name
batchSchema.virtual('fullName').get(function() {
  return `Y${this.year}.S${this.semester}.${this.type}.${this.specialization}.${this.mainGroup}.${this.subGroup}`;
});

module.exports = mongoose.model('Batch', batchSchema);