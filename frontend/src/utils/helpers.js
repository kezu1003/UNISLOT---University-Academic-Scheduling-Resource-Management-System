import { format, parseISO } from 'date-fns';

// Format date
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
};

// Format time
export const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

// Calculate duration in hours
export const calculateDuration = (startTime, endTime) => {
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  return (end - start) / (1000 * 60 * 60);
};

// Generate batch code
export const generateBatchCode = (year, semester, type, specialization, mainGroup, subGroup) => {
  return `Y${year}.S${semester}.${type}.${specialization}.${mainGroup.padStart(2, '0')}.${subGroup.padStart(2, '0')}`;
};

// Parse batch code
export const parseBatchCode = (batchCode) => {
  const match = batchCode.match(/^Y(\d)\.S(\d)\.(WD|WE)\.([A-Z]+)\.(\d{2})\.(\d{2})$/);
  if (!match) return null;
  
  return {
    year: parseInt(match[1]),
    semester: parseInt(match[2]),
    type: match[3],
    specialization: match[4],
    mainGroup: match[5],
    subGroup: match[6]
  };
};

// Get workload status
export const getWorkloadStatus = (current, max) => {
  const percentage = (current / max) * 100;
  if (percentage > 100) return 'overloaded';
  if (percentage >= 90) return 'near-capacity';
  if (percentage >= 70) return 'moderate';
  return 'available';
};

// Get workload color
export const getWorkloadColor = (current, max) => {
  const status = getWorkloadStatus(current, max);
  const colors = {
    available: '#4CAF50',
    moderate: '#FF9800',
    'near-capacity': '#F44336',
    overloaded: '#B71C1C'
  };
  return colors[status];
};

// Get session type color
export const getSessionTypeColor = (type) => {
  const colors = {
    lecture: '#2196F3',
    tutorial: '#4CAF50',
    lab: '#FF9800'
  };
  return colors[type] || '#9E9E9E';
};

// Truncate text
export const truncate = (text, length = 30) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

// Download file
export const downloadFile = (data, filename, type = 'application/pdf') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Sort by priority
export const sortByPriority = (a, b) => a.priority - b.priority;

// Filter empty values
export const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null && v !== '')
  );
};