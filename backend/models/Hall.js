const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
  hallCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  hallName: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  location: {
    type: String,
    enum: ['Malabe', 'Metro', 'Matara', 'Kandy', 'Kurunegala', 'Jaffna'],
    required: true
  },
  type: {
    type: String,
    enum: ['Lecture Hall', 'Lab', 'Tutorial Room'],
    required: true
  },
  facilities: [{
    type: String,
    enum: ['Projector', 'AC', 'Computers', 'Whiteboard', 'Sound System']
  }],
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Out of Service'],
    default: 'Active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maintenanceIssue: {
    type: String,
    trim: true,
    default: ''
  },
  maintenanceMarkedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Hall', hallSchema);
