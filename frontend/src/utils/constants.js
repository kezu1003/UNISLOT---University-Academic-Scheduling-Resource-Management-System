export const SPECIALIZATIONS = [
  { value: 'IT', label: 'Information Technology' },
  { value: 'SE', label: 'Software Engineering' },
  { value: 'DS', label: 'Data Science' },
  { value: 'CYBER', label: 'Cyber Security' },
  { value: 'CS', label: 'Computer Science' },
  { value: 'CSE', label: 'Computer Systems Engineering' },
  { value: 'ISE', label: 'Information Systems Engineering' },
  { value: 'CSNE', label: 'Computer Science & Network Engineering' },
  { value: 'IM', label: 'Interactive Media' }
];

export const LOCATIONS = [
  { value: 'Malabe', label: 'Malabe Campus' },
  { value: 'Metro', label: 'Metro Campus' },
  { value: 'Matara', label: 'Matara Campus' },
  { value: 'Kandy', label: 'Kandy Campus' },
  { value: 'Kurunegala', label: 'Kurunegala Campus' },
  { value: 'Jaffna', label: 'Jaffna Campus' }
];

export const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const WEEKEND = ['Saturday', 'Sunday'];

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

export const SESSION_TYPES = [
  { value: 'lecture', label: 'Lecture', color: '#2196F3' },
  { value: 'tutorial', label: 'Tutorial', color: '#4CAF50' },
  { value: 'lab', label: 'Lab', color: '#FF9800' }
];

export const SESSION_MODES = [
  { value: 'physical', label: 'Physical' },
  { value: 'online', label: 'Online' }
];

export const HALL_TYPES = [
  { value: 'Lecture Hall', label: 'Lecture Hall' },
  { value: 'Lab', label: 'Computer Lab' },
  { value: 'Tutorial Room', label: 'Tutorial Room' }
];

export const HALL_STATUSES = [
  { value: 'Active', label: 'Active' },
  { value: 'Maintenance', label: 'Under Maintenance' },
  { value: 'Out of Service', label: 'Out of Service' }
];

export const YEARS = [
  { value: 1, label: 'Year 1' },
  { value: 2, label: 'Year 2' },
  { value: 3, label: 'Year 3' },
  { value: 4, label: 'Year 4' }
];

export const SEMESTERS = [
  { value: 1, label: 'Semester 1' },
  { value: 2, label: 'Semester 2' }
];

export const BATCH_TYPES = [
  { value: 'WD', label: 'Weekday' },
  { value: 'WE', label: 'Weekend' }
];

export const WORKLOAD_STATUS = {
  available: { label: 'Available', color: '#4CAF50' },
  moderate: { label: 'Moderate', color: '#FF9800' },
  'near-capacity': { label: 'Near Capacity', color: '#F44336' },
  overloaded: { label: 'Overloaded', color: '#B71C1C' }
};