const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Staff name is required'],
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  priority: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 50
  },
  specialization: [{
    type: String,
    enum: ['IT', 'SE', 'DS', 'CYBER', 'CS', 'CSE', 'ISE', 'CSNE', 'IM']
  }],
  location: {
    type: String,
    enum: ['Malabe', 'Metro', 'Matara', 'Kandy', 'Kurunegala', 'Jaffna'],
    default: 'Malabe'
  },
  maxWorkload: {
    type: Number,
    default: 20,
    min: 0,
    max: 40
  },
  currentWorkload: {
    type: Number,
    default: 0
  },
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    slots: [{
      startTime: String,
      endTime: String
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate workload percentage
staffSchema.virtual('workloadPercentage').get(function() {
  if (!this.maxWorkload) return 0;
  return (this.currentWorkload / this.maxWorkload) * 100;
});

// Calculate available hours
staffSchema.virtual('availableHours').get(function() {
  return this.maxWorkload - this.currentWorkload;
});

module.exports = mongoose.model('Staff', staffSchema);