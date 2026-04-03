// TimetableScheduler.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiPlus, FiCalendar, FiClock, FiMapPin, FiUser,
  FiBook, FiUsers, FiRefreshCw, FiAlertCircle, FiX,
  FiCheck, FiInfo, FiTrash2, FiEdit, FiAlertTriangle
} from 'react-icons/fi';
import { coordinatorAPI, adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import HallAvailabilityPanel from '../../components/common/HallAvailabilityPanel';
import './TimetableScheduler.css';

// Constants
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// Initial States
const INITIAL_FORM_DATA = {
  course: '',
  batch: '',
  instructor: '',
  hall: '',
  day: 'Monday',
  startTime: '08:00',
  endTime: '10:00',
  type: 'lecture',
  mode: 'physical'
};

const INITIAL_ERRORS = {
  course: '',
  batch: '',
  instructor: '',
  hall: '',
  day: '',
  startTime: '',
  endTime: '',
  general: ''
};

const INITIAL_TOUCHED = {
  course: false,
  batch: false,
  instructor: false,
  hall: false,
  day: false,
  startTime: false,
  endTime: false
};

// Validation Rules
const VALIDATION_RULES = {
  course: {
    required: true,
    message: 'Please select a course'
  },
  batch: {
    required: true,
    message: 'Please select a batch'
  },
  instructor: {
    required: true,
    message: 'Please select an instructor'
  },
  hall: {
    required: true,
    message: 'Please select a hall'
  },
  day: {
    required: true,
    message: 'Please select a day'
  },
  startTime: {
    required: true,
    message: 'Start time is required',
    validate: (value) => {
      if (!value) return 'Start time is required';
      const [hours] = value.split(':').map(Number);
      if (hours < 7 || hours > 21) {
        return 'Start time must be between 07:00 and 21:00';
      }
      return null;
    }
  },
  endTime: {
    required: true,
    message: 'End time is required',
    validate: (value, formData) => {
      if (!value) return 'End time is required';
      if (!formData.startTime) return null;
      
      const start = formData.startTime.split(':').map(Number);
      const end = value.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      
      if (endMinutes <= startMinutes) {
        return 'End time must be after start time';
      }
      
      const duration = endMinutes - startMinutes;
      if (duration < 30) {
        return 'Minimum duration is 30 minutes';
      }
      if (duration > 240) {
        return 'Maximum duration is 4 hours';
      }
      
      if (end[0] > 21) {
        return 'End time cannot be after 21:00';
      }
      
      return null;
    }
  }
};

// Reusable Form Components
const FormSelect = ({ 
  label, 
  name, 
  value, 
  onChange, 
  onBlur,
  options = [],
  error, 
  touched,
  required = false,
  placeholder = 'Select...',
  disabled = false,
  renderOption,
  hint
}) => {
  const showError = touched && error;
  const showSuccess = touched && !error && value;

  return (
    <div className={`form-group ${showError ? 'has-error' : ''} ${showSuccess ? 'has-success' : ''}`}>
      <label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      <div className="input-wrapper">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={showError ? 'error' : showSuccess ? 'success' : ''}
        >
          <option value="">{placeholder}</option>
          {options.map((option, index) => (
            <option key={option._id || option.value || index} value={option._id || option.value}>
              {renderOption ? renderOption(option) : option.label || option.name}
            </option>
          ))}
        </select>
        {showError && <FiAlertCircle className="field-icon error" />}
        {showSuccess && <FiCheck className="field-icon success" />}
      </div>
      {showError && (
        <span className="error-message">
          <FiAlertCircle size={12} /> {error}
        </span>
      )}
      {hint && !showError && (
        <span className="hint-message">
          <FiInfo size={12} /> {hint}
        </span>
      )}
    </div>
  );
};

const FormInput = ({ 
  label, 
  name, 
  type = 'text',
  value, 
  onChange, 
  onBlur,
  error, 
  touched,
  required = false,
  hint,
  disabled = false
}) => {
  const showError = touched && error;
  const showSuccess = touched && !error && value;

  return (
    <div className={`form-group ${showError ? 'has-error' : ''} ${showSuccess ? 'has-success' : ''}`}>
      <label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      <div className="input-wrapper">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={showError ? 'error' : showSuccess ? 'success' : ''}
        />
        {showError && <FiAlertCircle className="field-icon error" />}
        {showSuccess && <FiCheck className="field-icon success" />}
      </div>
      {showError && (
        <span className="error-message">
          <FiAlertCircle size={12} /> {error}
        </span>
      )}
      {hint && !showError && (
        <span className="hint-message">
          <FiInfo size={12} /> {hint}
        </span>
      )}
    </div>
  );
};

const ConflictAlert = ({ conflicts, onClose }) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="conflict-alert">
      <div className="conflict-header">
        <FiAlertTriangle />
        <span>Scheduling Conflicts Detected</span>
        <button onClick={onClose} type="button"><FiX /></button>
      </div>
      <ul className="conflict-list">
        {conflicts.map((conflict, index) => (
          <li key={index}>
            <strong>{conflict.type}:</strong> {conflict.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

const getHallCapacityError = (data, batches, halls) => {
  if (!data.batch || !data.hall) return '';

  const selectedBatch = batches.find(batch => batch._id === data.batch);
  const selectedHall = halls.find(hall => hall._id === data.hall);

  if (!selectedBatch || !selectedHall) return '';

  if (selectedBatch.studentCount > selectedHall.capacity) {
    return `${selectedHall.hallCode} only has ${selectedHall.capacity} seats for ${selectedBatch.studentCount} students in ${selectedBatch.batchCode}`;
  }

  return '';
};

// Main Component
const TimetableScheduler = () => {
  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [halls, setHalls] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [formValid, setFormValid] = useState(false);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const selectedBatchData = batches.find(batch => batch._id === formData.batch);
  const selectedHallData = halls.find(hall => hall._id === formData.hall);
  const hallCapacityError = getHallCapacityError(formData, batches, halls);

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, [selectedBatch]);

  // Validate Form on Change
  useEffect(() => {
    const isValid = validateFormSilent();
    setFormValid(isValid);
  }, [formData, batches, halls]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        coordinatorAPI.getTimetable({ batch: selectedBatch || undefined }),
        adminAPI.getCourses(),
        adminAPI.getBatches(),
        adminAPI.getHalls(),
        adminAPI.getStaff({ limit: 100 })
      ]);

      const [timetableRes, coursesRes, batchesRes, hallsRes, staffRes] = results;

      if (timetableRes.status === 'fulfilled') {
        setTimetable(timetableRes.value.data?.data || []);
      }
      if (coursesRes.status === 'fulfilled') {
        setCourses(coursesRes.value.data?.data || []);
      }
      if (batchesRes.status === 'fulfilled') {
        setBatches(batchesRes.value.data?.data || []);
      }
      if (hallsRes.status === 'fulfilled') {
        setHalls(hallsRes.value.data?.data || []);
      }
      if (staffRes.status === 'fulfilled') {
        setStaff(staffRes.value.data?.data || []);
      }

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Validation Functions
  const validateField = useCallback((name, value, allData = formData) => {
    const rule = VALIDATION_RULES[name];
    if (!rule) return '';

    if (rule.required && !value) {
      return rule.message;
    }

    if (rule.validate) {
      const error = rule.validate(value, allData);
      if (error) return error;
    }

    if (name === 'hall') {
      return getHallCapacityError(allData, batches, halls);
    }

    return '';
  }, [formData, batches, halls]);

  const validateFormSilent = useCallback(() => {
    let isValid = true;
    Object.keys(VALIDATION_RULES).forEach(field => {
      const error = validateField(field, formData[field], formData);
      if (error) isValid = false;
    });
    return isValid;
  }, [formData, validateField]);

  const validateForm = useCallback(() => {
    const newErrors = { ...INITIAL_ERRORS };
    let isValid = true;

    Object.keys(VALIDATION_RULES).forEach(field => {
      const error = validateField(field, formData[field], formData);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    // Check conflicts
    const conflictErrors = checkConflicts(formData);
    setConflicts(conflictErrors);

    setErrors(newErrors);
    setTouched(Object.keys(INITIAL_TOUCHED).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));

    return isValid;
  }, [formData, validateField]);

  const checkConflicts = (data) => {
    const conflicts = [];
    if (!data.day || !data.startTime || !data.endTime) return conflicts;

    const newStart = timeToMinutes(data.startTime);
    const newEnd = timeToMinutes(data.endTime);

    timetable.forEach(entry => {
      if (editMode && entry._id === editingId) return;
      if (entry.day !== data.day) return;

      const existingStart = timeToMinutes(entry.startTime);
      const existingEnd = timeToMinutes(entry.endTime);
      const hasOverlap = newStart < existingEnd && newEnd > existingStart;

      if (!hasOverlap) return;

      if (data.hall && entry.hall?._id === data.hall) {
        conflicts.push({
          type: 'Hall Conflict',
          message: `${entry.hall?.hallCode || 'Hall'} is booked for ${entry.course?.courseCode || 'a course'} at ${entry.startTime}-${entry.endTime}`
        });
      }

      if (data.instructor && entry.instructor?._id === data.instructor) {
        conflicts.push({
          type: 'Instructor Conflict',
          message: `${entry.instructor?.name || 'Instructor'} is scheduled for ${entry.course?.courseCode || 'a course'} at ${entry.startTime}-${entry.endTime}`
        });
      }

      if (data.batch && entry.batch?._id === data.batch) {
        conflicts.push({
          type: 'Batch Conflict',
          message: `${entry.batch?.batchCode || 'Batch'} has ${entry.course?.courseCode || 'a class'} at ${entry.startTime}-${entry.endTime}`
        });
      }
    });

    return conflicts;
  };

  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Event Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'startTime' && value) {
        newData.endTime = addHours(value, 2);
      }
      return newData;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSlotClick = (day, time) => {
    setFormData({
      ...INITIAL_FORM_DATA,
      day,
      startTime: time,
      endTime: addHours(time, 2),
      batch: selectedBatch
    });
    setErrors(INITIAL_ERRORS);
    setTouched(INITIAL_TOUCHED);
    setEditMode(false);
    setEditingId(null);
    setConflicts([]);
    setShowModal(true);
  };

  const handleEditClick = (entry, e) => {
    e?.stopPropagation();
    setFormData({
      course: entry.course?._id || '',
      batch: entry.batch?._id || '',
      instructor: entry.instructor?._id || '',
      hall: entry.hall?._id || '',
      day: entry.day,
      startTime: entry.startTime,
      endTime: entry.endTime,
      type: entry.type || 'lecture',
      mode: entry.mode || 'physical'
    });
    setErrors(INITIAL_ERRORS);
    setTouched(INITIAL_TOUCHED);
    setEditMode(true);
    setEditingId(entry._id);
    setConflicts([]);
    setShowModal(true);
  };

  const handleDeleteClick = (entry, e) => {
    e?.stopPropagation();
    setDeleteTarget(entry);
    setShowDeleteModal(true);
  };

  const handleAvailabilitySelect = (hall) => {
    setFormData((prev) => ({ ...prev, hall: hall._id }));
    setTouched((prev) => ({ ...prev, hall: true }));
    setErrors((prev) => ({ ...prev, hall: '' }));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await coordinatorAPI.deleteTimetable(deleteTarget._id);
      toast.success('Schedule deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete schedule');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (conflicts.length > 0) {
      const proceed = window.confirm(
        `There are ${conflicts.length} potential conflict(s). Do you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    setSubmitting(true);

    try {
      if (editMode) {
        await coordinatorAPI.updateTimetable(editingId, formData);
        toast.success('Schedule updated successfully!');
      } else {
        await coordinatorAPI.createTimetable(formData);
        toast.success('Schedule created successfully!');
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save schedule';
      setErrors(prev => ({ ...prev, general: errorMessage }));
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(INITIAL_FORM_DATA);
    setErrors(INITIAL_ERRORS);
    setTouched(INITIAL_TOUCHED);
    setConflicts([]);
    setEditMode(false);
    setEditingId(null);
  };

  const addHours = (time, hours) => {
    const [h, m] = time.split(':').map(Number);
    const newHour = Math.min(h + hours, 21);
    return `${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'lecture': return '#2196F3';
      case 'tutorial': return '#4CAF50';
      case 'lab': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getScheduleForSlot = (day, time) => {
    return timetable.filter(entry => entry.day === day && entry.startTime === time);
  };

  const calculateDuration = (start, end) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);

    if (diff <= 0) return 'Invalid';
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}hr`;
    return `${hours}hr ${mins}min`;
  };

  const getFormProgress = () => {
    const fields = ['course', 'batch', 'instructor', 'hall', 'day', 'startTime', 'endTime'];
    const filled = fields.filter(f => formData[f]).length;
    return Math.round((filled / fields.length) * 100);
  };

  // Loading State
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading timetable...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="error-container">
        <FiAlertCircle size={48} />
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button onClick={fetchData} className="retry-btn">
          <FiRefreshCw /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="timetable-scheduler">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Timetable Scheduler</h2>
          <p>Create and manage class schedules</p>
        </div>
        <button className="btn-primary" onClick={() => {
          setFormData({ ...INITIAL_FORM_DATA, batch: selectedBatch });
          setErrors(INITIAL_ERRORS);
          setTouched(INITIAL_TOUCHED);
          setEditMode(false);
          setShowModal(true);
        }}>
          <FiPlus /> Add Schedule
        </button>
      </div>

      {/* Controls */}
      <div className="controls-card">
        <div className="controls-row">
          <div className="batch-filter">
            <label>Filter by Batch:</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="">All Batches</option>
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.batchCode}</option>
              ))}
            </select>
          </div>

          <button className="btn-refresh" onClick={fetchData}>
            <FiRefreshCw /> Refresh
          </button>

          <div className="legend">
            <span className="legend-item">
              <span className="legend-color" style={{ background: '#2196F3' }}></span>
              Lecture
            </span>
            <span className="legend-item">
              <span className="legend-color" style={{ background: '#4CAF50' }}></span>
              Tutorial
            </span>
            <span className="legend-item">
              <span className="legend-color" style={{ background: '#FF9800' }}></span>
              Lab
            </span>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="timetable-card">
        <div className="timetable-grid">
          {/* Header Row */}
          <div className="grid-header time-header">
            <FiClock />
          </div>
          {DAYS.map(day => (
            <div key={day} className="grid-header day-header">{day}</div>
          ))}

          {/* Time Slots */}
          {TIME_SLOTS.map((time) => (
            <React.Fragment key={time}>
              <div className="time-slot">{time}</div>
              {DAYS.map(day => {
                const entries = getScheduleForSlot(day, time);

                return (
                  <div
                    key={`${day}-${time}`}
                    className={`grid-cell ${entries.length === 0 ? 'empty' : ''}`}
                    onClick={() => entries.length === 0 && handleSlotClick(day, time)}
                    title={entries.length === 0 ? 'Click to add schedule' : ''}
                  >
                    {entries.map(entry => (
                      <div
                        key={entry._id}
                        className="schedule-entry"
                        style={{ backgroundColor: getTypeColor(entry.type) }}
                      >
                        <div className="entry-content">
                          <span className="entry-code">{entry.course?.courseCode || 'N/A'}</span>
                          <span className="entry-hall">{entry.hall?.hallCode || 'N/A'}</span>
                          <span className="entry-time">{entry.startTime}-{entry.endTime}</span>
                        </div>
                        <div className="entry-actions">
                          <button
                            className="entry-btn"
                            onClick={(e) => handleEditClick(entry, e)}
                            title="Edit"
                          >
                            <FiEdit size={12} />
                          </button>
                          <button
                            className="entry-btn delete"
                            onClick={(e) => handleDeleteClick(entry, e)}
                            title="Delete"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-item">
          <FiCalendar />
          <span>{timetable.length} Total Schedules</span>
        </div>
        <div className="stat-item">
          <FiUsers />
          <span>{batches.length} Batches</span>
        </div>
        <div className="stat-item">
          <FiBook />
          <span>{courses.length} Courses</span>
        </div>
        <div className="stat-item">
          <FiMapPin />
          <span>{halls.length} Halls</span>
        </div>
      </div>

      {/* Add/Edit Schedule Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h3>{editMode ? 'Edit Schedule' : 'Add New Schedule'}</h3>
                <div className="form-progress">
                  <div className="progress-track">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${getFormProgress()}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{getFormProgress()}% Complete</span>
                </div>
              </div>
              <button className="close-btn" onClick={closeModal}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body" noValidate>
              {/* General Error */}
              {errors.general && (
                <div className="alert alert-error">
                  <FiAlertCircle />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* Conflict Warnings */}
              <ConflictAlert
                conflicts={conflicts}
                onClose={() => setConflicts([])}
              />

              {/* Course & Batch */}
              <div className="form-row">
                <FormSelect
                  label="Course"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.course}
                  touched={touched.course}
                  required
                  placeholder="Select Course"
                  options={courses}
                  renderOption={(c) => `${c.courseCode} - ${c.courseName}`}
                />

                <FormSelect
                  label="Batch"
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.batch}
                  touched={touched.batch}
                  required
                  placeholder="Select Batch"
                  options={batches}
                  renderOption={(b) => `${b.batchCode} (${b.studentCount} students)`}
                />
              </div>

              {/* Instructor & Hall */}
              <div className="form-row">
                <FormSelect
                  label="Instructor"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.instructor}
                  touched={touched.instructor}
                  required
                  placeholder="Select Instructor"
                  options={staff}
                  renderOption={(s) => `${s.name} (${s.location || 'N/A'})`}
                />

                <FormSelect
                  label="Hall"
                  name="hall"
                  value={formData.hall}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.hall}
                  touched={touched.hall}
                  required
                  placeholder="Select Hall"
                  options={halls}
                  renderOption={(h) => {
                    const isTooSmall = selectedBatchData && h.capacity < selectedBatchData.studentCount;
                    return `${h.hallCode} - ${h.hallName} (${h.capacity} seats${isTooSmall ? ' - too small' : ''})`;
                  }}
                  hint={
                    selectedBatchData
                      ? `Batch size: ${selectedBatchData.studentCount} students${selectedHallData ? ` | Selected hall seats: ${selectedHallData.capacity}` : ''}`
                      : 'Select a batch to compare hall capacity'
                  }
                />
              </div>

              {/* Day & Time */}
              <div className="form-row three-col">
                <FormSelect
                  label="Day"
                  name="day"
                  value={formData.day}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.day}
                  touched={touched.day}
                  required
                  options={ALL_DAYS.map(d => ({ value: d, label: d }))}
                />

                <FormInput
                  label="Start Time"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.startTime}
                  touched={touched.startTime}
                  required
                  hint="07:00 - 21:00"
                />

                <FormInput
                  label="End Time"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.endTime}
                  touched={touched.endTime}
                  required
                  hint="Max 4 hours"
                />
              </div>

              {/* Duration Display */}
              {formData.startTime && formData.endTime && !errors.endTime && (
                <div className="duration-display">
                  <FiClock />
                  <span>Duration: {calculateDuration(formData.startTime, formData.endTime)}</span>
                </div>
              )}

              <HallAvailabilityPanel
                compact
                title="Hall / Lab Availability"
                description="Check live hall availability for the selected schedule slot and choose a free space directly."
                fetchAvailability={(params) => coordinatorAPI.getHallAvailability({
                  ...params,
                  excludeEntryId: editMode ? editingId : undefined
                })}
                initialFilters={{
                  day: formData.day,
                  startTime: formData.startTime,
                  endTime: formData.endTime
                }}
                batchId={formData.batch || undefined}
                batchSize={selectedBatchData?.studentCount}
                selectedHallId={formData.hall}
                onSelectHall={handleAvailabilitySelect}
              />

              {selectedBatchData && selectedHallData && !hallCapacityError && (
                <div className="duration-display">
                  <FiUsers />
                  <span>
                    Capacity check passed: {selectedHallData.hallCode} has {selectedHallData.capacity} seats for {selectedBatchData.studentCount} students
                  </span>
                </div>
              )}

              {/* Type & Mode */}
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <div className="type-buttons">
                    {['lecture', 'tutorial', 'lab'].map(type => (
                      <button
                        key={type}
                        type="button"
                        className={`type-btn ${formData.type === type ? 'active' : ''}`}
                        style={formData.type === type ? { backgroundColor: getTypeColor(type) } : undefined}
                        onClick={() => setFormData(prev => ({ ...prev, type }))}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Mode</label>
                  <div className="mode-buttons">
                    {['physical', 'online'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        className={`mode-btn ${formData.mode === mode ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, mode }))}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Summary */}
              {formValid && (
                <div className="form-summary">
                  <h4><FiCheck /> Ready to Submit</h4>
                  <p>
                    <strong>{courses.find(c => c._id === formData.course)?.courseCode}</strong>
                    {' on '}<strong>{formData.day}</strong>
                    {' from '}<strong>{formData.startTime}</strong> to <strong>{formData.endTime}</strong>
                  </p>
                  <p>
                    Instructor: <strong>{staff.find(s => s._id === formData.instructor)?.name}</strong>
                    {' | Hall: '}<strong>{selectedHallData?.hallCode}</strong>
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || !formValid}
                >
                  {submitting ? (
                    <>
                      <span className="btn-spinner"></span>
                      {editMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      {editMode ? 'Update Schedule' : 'Create Schedule'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-danger">
              <h3>Confirm Delete</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <FiAlertTriangle className="warning-icon" />
                <p>Are you sure you want to delete this schedule?</p>
                {deleteTarget && (
                  <div className="delete-target-info">
                    <p><strong>{deleteTarget.course?.courseCode}</strong></p>
                    <p>{deleteTarget.day} | {deleteTarget.startTime} - {deleteTarget.endTime}</p>
                  </div>
                )}
                <p className="warning-text">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableScheduler;
