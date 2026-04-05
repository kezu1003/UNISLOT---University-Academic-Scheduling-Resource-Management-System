// CourseManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiBook,
  FiClock, FiUsers, FiLayers, FiAlertCircle,
  FiCheck, FiInfo, FiX, FiAlertTriangle, FiMinus
} from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { adminAPI } from '../../services/api';
import { SPECIALIZATIONS, YEARS, SEMESTERS } from '../../utils/constants';
import { toast } from 'react-toastify';
import './CourseManagement.css';

// Validation Rules
const VALIDATION_RULES = {
  courseCode: {
    required: true,
    message: 'Course code is required',
    pattern: /^[A-Z]{2,4}\d{4}$/,
    patternMessage: 'Format: 2-4 letters followed by 4 digits (e.g., IT2030)',
    validate: (value) => {
      if (!value) return 'Course code is required';
      if (value.length < 6 || value.length > 8) {
        return 'Course code must be 6-8 characters';
      }
      if (!/^[A-Z]{2,4}\d{4}$/.test(value.toUpperCase())) {
        return 'Format: 2-4 letters + 4 digits (e.g., IT2030, CSE1001)';
      }
      return null;
    }
  },
  courseName: {
    required: true,
    message: 'Course name is required',
    minLength: 3,
    maxLength: 100,
    validate: (value) => {
      if (!value || !value.trim()) return 'Course name is required';
      if (value.trim().length < 3) return 'Course name must be at least 3 characters';
      if (value.trim().length > 100) return 'Course name cannot exceed 100 characters';
      return null;
    }
  },
  credits: {
    required: true,
    message: 'Credits are required',
    min: 1,
    max: 6,
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num)) return 'Credits must be a number';
      if (num < 1) return 'Minimum 1 credit required';
      if (num > 6) return 'Maximum 6 credits allowed';
      return null;
    }
  },
  year: {
    required: true,
    message: 'Please select a year'
  },
  semester: {
    required: true,
    message: 'Please select a semester'
  },
  specialization: {
    required: true,
    message: 'Select at least one specialization',
    validate: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Select at least one specialization';
      }
      return null;
    }
  },
  lectureHours: {
    min: 0,
    max: 10,
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 0) return 'Must be 0 or more';
      if (num > 10) return 'Maximum 10 hours allowed';
      return null;
    }
  },
  tutorialHours: {
    min: 0,
    max: 10,
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 0) return 'Must be 0 or more';
      if (num > 10) return 'Maximum 10 hours allowed';
      return null;
    }
  },
  labHours: {
    min: 0,
    max: 10,
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 0) return 'Must be 0 or more';
      if (num > 10) return 'Maximum 10 hours allowed';
      return null;
    }
  }
};

// Initial States
const INITIAL_FORM_DATA = {
  courseCode: '',
  courseName: '',
  credits: 3,
  lectureHours: 2,
  tutorialHours: 1,
  labHours: 0,
  year: 1,
  semester: 1,
  specialization: [],
  lic: '',
  batches: []
};

const INITIAL_ERRORS = {
  courseCode: '',
  courseName: '',
  credits: '',
  lectureHours: '',
  tutorialHours: '',
  labHours: '',
  year: '',
  semester: '',
  specialization: '',
  lic: '',
  batches: '',
  general: ''
};

const INITIAL_TOUCHED = {
  courseCode: false,
  courseName: false,
  credits: false,
  lectureHours: false,
  tutorialHours: false,
  labHours: false,
  year: false,
  semester: false,
  specialization: false,
  lic: false,
  batches: false
};

// Validated Input Component
const ValidatedInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  placeholder,
  hint,
  min,
  max,
  maxLength,
  className = ''
}) => {
  const showError = touched && error;
  const showSuccess = touched && !error && value !== '';

  return (
    <div className={`form-group ${showError ? 'has-error' : ''} ${showSuccess ? 'has-success' : ''} ${className}`}>
      <label htmlFor={name} className={`form-label ${required ? 'required' : ''}`}>
        {label}
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
          placeholder={placeholder}
          min={min}
          max={max}
          maxLength={maxLength}
          className={`form-input ${showError ? 'error' : ''} ${showSuccess ? 'success' : ''}`}
        />
        {showError && <FiAlertCircle className="input-icon-right error" />}
        {showSuccess && <FiCheck className="input-icon-right success" />}
      </div>
      {showError && (
        <span className="form-error">
          <FiAlertCircle size={12} /> {error}
        </span>
      )}
      {hint && !showError && (
        <span className="form-hint">
          <FiInfo size={12} /> {hint}
        </span>
      )}
    </div>
  );
};

// Validated Select Component
const ValidatedSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  error,
  touched,
  required = false,
  disabled = false,
  placeholder = 'Select...'
}) => {
  const showError = touched && error;
  const showSuccess = touched && !error && value !== '';

  return (
    <div className={`form-group ${showError ? 'has-error' : ''} ${showSuccess ? 'has-success' : ''}`}>
      <label htmlFor={name} className={`form-label ${required ? 'required' : ''}`}>
        {label}
      </label>
      <div className="input-wrapper">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`form-select ${showError ? 'error' : ''} ${showSuccess ? 'success' : ''}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt, idx) => (
            <option key={opt.value || idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {showError && <FiAlertCircle className="input-icon-right error" />}
        {showSuccess && <FiCheck className="input-icon-right success" />}
      </div>
      {showError && (
        <span className="form-error">
          <FiAlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  );
};

// Validated Checkbox Group Component
const ValidatedCheckboxGroup = ({
  label,
  name,
  options = [],
  value = [],
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  columns = 3
}) => {
  const showError = touched && error;
  const showSuccess = touched && !error && value.length > 0;

  const handleChange = (optValue, checked) => {
    const updated = checked
      ? [...value, optValue]
      : value.filter(v => v !== optValue);
    onChange({ target: { name, value: updated } });
  };

  return (
    <div className={`form-group ${showError ? 'has-error' : ''} ${showSuccess ? 'has-success' : ''}`}>
      <label className={`form-label ${required ? 'required' : ''}`}>
        {label}
        {showSuccess && <FiCheck className="label-icon success" size={14} />}
      </label>
      <div 
        className="checkbox-grid" 
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        onBlur={onBlur}
      >
        {options.map((opt) => (
          <label 
            key={opt.value} 
            className={`checkbox-label ${value.includes(opt.value) ? 'checked' : ''}`}
          >
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={(e) => handleChange(opt.value, e.target.checked)}
            />
            <span className="checkbox-text">{opt.label}</span>
          </label>
        ))}
      </div>
      {showError && (
        <span className="form-error">
          <FiAlertCircle size={12} /> {error}
        </span>
      )}
      {showSuccess && (
        <span className="form-hint success">
          <FiCheck size={12} /> {value.length} specialization(s) selected
        </span>
      )}
    </div>
  );
};

// Hours Control Component with Validation
const ValidatedHoursControl = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  min = 0,
  max = 10,
  colorClass = ''
}) => {
  const showError = touched && error;

  const handleIncrement = () => {
    if (value < max) {
      onChange({ target: { name, value: value + 1 } });
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange({ target: { name, value: value - 1 } });
    }
  };

  return (
    <div className={`hours-input ${showError ? 'has-error' : ''}`}>
      <label>{label}</label>
      <div className={`hours-control ${colorClass}`}>
        <button 
          type="button" 
          onClick={handleDecrement}
          disabled={value <= min}
          className="hours-btn decrement"
        >
          <FiMinus size={14} />
        </button>
        <span className="hours-value">{value}</span>
        <button 
          type="button" 
          onClick={handleIncrement}
          disabled={value >= max}
          className="hours-btn increment"
        >
          <FiPlus size={14} />
        </button>
      </div>
      {showError && (
        <span className="hours-error">{error}</span>
      )}
    </div>
  );
};

// Form Progress Component
const FormProgress = ({ formData, requiredFields, errors }) => {
  const validFields = requiredFields.filter(field => {
    const value = formData[field];
    const hasError = errors[field];
    if (Array.isArray(value)) {
      return value.length > 0 && !hasError;
    }
    return value !== '' && value !== null && value !== undefined && !hasError;
  }).length;
  
  const percentage = Math.round((validFields / requiredFields.length) * 100);

  return (
    <div className="form-progress">
      <div className="progress-header">
        <span className="progress-label">Form Completion</span>
        <span className={`progress-percentage ${percentage === 100 ? 'complete' : ''}`}>
          {percentage}%
        </span>
      </div>
      <div className="progress-track">
        <div 
          className={`progress-fill ${percentage === 100 ? 'complete' : ''}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="progress-text">
        {validFields} of {requiredFields.length} required fields completed
      </span>
    </div>
  );
};

// Course Code Preview Component
const CourseCodePreview = ({ courseCode, isValid, isDuplicate, courseName }) => {
  return (
    <div className={`course-preview ${isDuplicate ? 'duplicate' : ''} ${isValid && !isDuplicate ? 'valid' : ''}`}>
      <div className="preview-content">
        <div className="preview-code-section">
          <span className="preview-label">Course Code</span>
          <span className="preview-code">{courseCode || '??????'}</span>
        </div>
        {courseName && (
          <div className="preview-name-section">
            <span className="preview-label">Course Name</span>
            <span className="preview-name">{courseName}</span>
          </div>
        )}
      </div>
      <div className="preview-status-section">
        {isValid && !isDuplicate && (
          <span className="preview-status valid">
            <FiCheck size={14} /> Valid
          </span>
        )}
        {isDuplicate && (
          <span className="preview-status duplicate">
            <FiAlertTriangle size={14} /> Duplicate
          </span>
        )}
        {!isValid && !isDuplicate && courseCode && (
          <span className="preview-status invalid">
            <FiAlertCircle size={14} /> Invalid Format
          </span>
        )}
      </div>
    </div>
  );
};

// Hours Summary Component
const HoursSummary = ({ lectureHours, tutorialHours, labHours, credits }) => {
  const totalHours = lectureHours + tutorialHours + labHours;
  const isBalanced = totalHours >= credits && totalHours <= credits * 2;

  return (
    <div className={`hours-summary ${isBalanced ? 'balanced' : 'warning'}`}>
      <div className="hours-breakdown">
        <div className="hours-item lecture">
          <span className="hours-icon">L</span>
          <span className="hours-value">{lectureHours}</span>
        </div>
        <span className="hours-plus">+</span>
        <div className="hours-item tutorial">
          <span className="hours-icon">T</span>
          <span className="hours-value">{tutorialHours}</span>
        </div>
        <span className="hours-plus">+</span>
        <div className="hours-item lab">
          <span className="hours-icon">P</span>
          <span className="hours-value">{labHours}</span>
        </div>
        <span className="hours-equals">=</span>
        <div className="hours-total">
          <span className="total-value">{totalHours}</span>
          <span className="total-label">hrs/week</span>
        </div>
      </div>
      {!isBalanced && totalHours > 0 && (
        <span className="hours-warning">
          <FiInfo size={12} /> 
          {totalHours < credits 
            ? 'Total hours less than credits' 
            : 'Total hours may be too high for credits'}
        </span>
      )}
    </div>
  );
};

// Main Component
const CourseManagement = () => {
  // Data State
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: '',
    semester: '',
    specialization: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const [isDuplicateCourseCode, setIsDuplicateCourseCode] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [coursesRes, staffRes, batchesRes] = await Promise.all([
        adminAPI.getCourses(filters),
        adminAPI.getStaff({ limit: 100 }),
        adminAPI.getBatches()
      ]);
      
      setCourses(coursesRes.data.data || []);
      setStaff(staffRes.data.data || []);
      setBatches(batchesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Validate form on data change
  useEffect(() => {
    const isValid = validateFormSilent();
    setFormValid(isValid && !isDuplicateCourseCode);
  }, [formData, isDuplicateCourseCode]);

  // Check for duplicate course code
  useEffect(() => {
    if (!formData.courseCode) {
      setIsDuplicateCourseCode(false);
      return;
    }

    const exists = courses.some(course => 
      course.courseCode.toUpperCase() === formData.courseCode.toUpperCase() && 
      (!selectedCourse || course._id !== selectedCourse._id)
    );

    setIsDuplicateCourseCode(exists);
    
    if (exists) {
      setErrors(prev => ({ ...prev, courseCode: 'This course code already exists' }));
    } else if (touched.courseCode) {
      const error = validateField('courseCode', formData.courseCode);
      setErrors(prev => ({ ...prev, courseCode: error }));
    }
  }, [formData.courseCode, courses, selectedCourse, touched.courseCode]);

  // Staff options for LIC select
  const staffOptions = staff.map(s => ({
    value: s._id,
    label: `${s.name} (${s.specialization?.join(', ') || 'No specialization'})`
  }));

  // Batch options
  const batchOptions = batches.map(b => ({
    value: b._id,
    label: b.batchCode
  }));

  // Validation Functions
  const validateField = useCallback((name, value) => {
    const rule = VALIDATION_RULES[name];
    if (!rule) return '';

    // Required check
    if (rule.required) {
      if (Array.isArray(value)) {
        if (value.length === 0) return rule.message;
      } else if (value === '' || value === null || value === undefined) {
        return rule.message;
      }
    }

    // Skip other validations if empty and not required
    if (!rule.required && (value === '' || value === null || value === undefined)) {
      return '';
    }

    // Pattern check
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value.toUpperCase())) {
      return rule.patternMessage || 'Invalid format';
    }

    // Min length
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      return `Minimum ${rule.minLength} characters required`;
    }

    // Max length
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      return `Maximum ${rule.maxLength} characters allowed`;
    }

    // Min/Max for numbers
    if (rule.min !== undefined && Number(value) < rule.min) {
      return `Minimum value is ${rule.min}`;
    }
    if (rule.max !== undefined && Number(value) > rule.max) {
      return `Maximum value is ${rule.max}`;
    }

    // Custom validation
    if (rule.validate) {
      const error = rule.validate(value);
      if (error) return error;
    }

    return '';
  }, []);

  const validateFormSilent = useCallback(() => {
    let isValid = true;
    const requiredFields = ['courseCode', 'courseName', 'credits', 'year', 'semester', 'specialization'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) isValid = false;
    });
    
    return isValid;
  }, [formData, validateField]);

  const validateForm = useCallback(() => {
    const newErrors = { ...INITIAL_ERRORS };
    let isValid = true;

    Object.keys(VALIDATION_RULES).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    // Check duplicate
    if (isDuplicateCourseCode) {
      newErrors.courseCode = 'This course code already exists';
      isValid = false;
    }

    // Validate total hours
    const totalHours = formData.lectureHours + formData.tutorialHours + formData.labHours;
    if (totalHours === 0) {
      newErrors.lectureHours = 'At least one hour type must be greater than 0';
      isValid = false;
    }

    setErrors(newErrors);
    setTouched(Object.keys(INITIAL_TOUCHED).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));

    return isValid;
  }, [formData, validateField, isDuplicateCourseCode]);

  // Event Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Auto-uppercase course code
    if (name === 'courseCode') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    // Convert numeric fields
    if (['credits', 'year', 'semester', 'lectureHours', 'tutorialHours', 'labHours'].includes(name)) {
      processedValue = value === '' ? '' : parseInt(value) || 0;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));

    // Clear error on change
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

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (isDuplicateCourseCode) {
      toast.error('This course code already exists');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        courseCode: formData.courseCode.toUpperCase()
      };

      if (selectedCourse) {
        await adminAPI.updateCourse(selectedCourse._id, payload);
        toast.success('Course updated successfully');
        setShowEditModal(false);
      } else {
        await adminAPI.createCourse(payload);
        toast.success('Course created successfully');
        setShowAddModal(false);
      }

      resetForm();
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      setErrors(prev => ({ ...prev, general: message }));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getCourseId = (course) =>
    course && (course._id ?? course.id);

  // Handle delete
  const handleDelete = async () => {
    const id = getCourseId(selectedCourse);
    if (!id) {
      toast.error('Invalid course');
      return;
    }

    setDeleting(true);

    try {
      const res = await adminAPI.deleteCourse(id);
      const msg = res.data?.message || 'Course deleted successfully';
      toast.success(msg);
      setShowDeleteModal(false);
      setSelectedCourse(null);
      fetchData();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to delete course';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (row, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedCourse(row);
    setShowDeleteModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors(INITIAL_ERRORS);
    setTouched(INITIAL_TOUCHED);
    setSelectedCourse(null);
    setIsDuplicateCourseCode(false);
  };

  // Close modal
  const closeFormModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  // Open edit modal
  const openEditModal = (course) => {
    setSelectedCourse(course);
    setFormData({
      courseCode: course.courseCode,
      courseName: course.courseName,
      credits: course.credits,
      lectureHours: course.lectureHours || 0,
      tutorialHours: course.tutorialHours || 0,
      labHours: course.labHours || 0,
      year: course.year,
      semester: course.semester,
      specialization: course.specialization || [],
      lic: course.lic?._id || '',
      batches: course.batches?.map(b => b._id) || []
    });
    setErrors(INITIAL_ERRORS);
    setTouched(INITIAL_TOUCHED);
    setShowEditModal(true);
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!course.courseCode.toLowerCase().includes(search) && 
          !course.courseName.toLowerCase().includes(search)) {
        return false;
      }
    }
    return true;
  });

  // Calculate total hours
  const totalHours = formData.lectureHours + formData.tutorialHours + formData.labHours;

  // Check if course code format is valid
  const isCourseCodeValid = /^[A-Z]{2,4}\d{4}$/.test(formData.courseCode);

  // Required fields for progress
  const requiredFields = ['courseCode', 'courseName', 'credits', 'year', 'semester', 'specialization'];

  // Table columns
  const columns = [
    {
      key: 'courseCode',
      title: 'Code',
      width: '100px',
      render: (code) => (
        <span className="course-code">{code}</span>
      )
    },
    {
      key: 'courseName',
      title: 'Course Name',
      render: (name, row) => (
        <div className="course-name-cell">
          <p className="name">{name}</p>
          <p className="meta">Year {row.year} • Semester {row.semester}</p>
        </div>
      )
    },
    {
      key: 'credits',
      title: 'Credits',
      width: '80px',
      render: (credits) => (
        <Badge variant="primary">{credits}</Badge>
      )
    },
    {
      key: 'hours',
      title: 'Hours (L/T/P)',
      width: '120px',
      render: (_, row) => (
        <div className="hours-cell">
          <span className="lec">{row.lectureHours || 0}</span>
          <span className="sep">/</span>
          <span className="tut">{row.tutorialHours || 0}</span>
          <span className="sep">/</span>
          <span className="lab">{row.labHours || 0}</span>
        </div>
      )
    },
    {
      key: 'specialization',
      title: 'Specializations',
      render: (specs) => (
        <div className="spec-badges">
          {(specs || []).slice(0, 2).map((spec, i) => (
            <Badge key={i} variant="neutral">{spec}</Badge>
          ))}
          {(specs || []).length > 2 && (
            <Badge variant="neutral">+{specs.length - 2}</Badge>
          )}
        </div>
      )
    },
    {
      key: 'lic',
      title: 'LIC',
      width: '150px',
      render: (lic) => lic?.name || <span className="no-lic">Not Assigned</span>
    },
    {
      key: 'batches',
      title: 'Batches',
      width: '100px',
      render: (batches) => (
        <div className="batch-count">
          <FiLayers size={14} />
          <span>{batches?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '100px',
      render: (_, row) => (
        <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
            title="Edit"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            type="button"
            className="action-btn danger"
            onClick={(e) => openDeleteModal(row, e)}
            title="Delete course"
            aria-label={`Delete ${row.courseCode}`}
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="course-management">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Course Management</h2>
          <p>Manage academic courses, assign LICs, and link batches</p>
        </div>
        <div className="header-actions">
          <Button 
            variant="primary" 
            icon={<FiPlus />}
            onClick={() => { resetForm(); setShowAddModal(true); }}
          >
            Add Course
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="mini-stat">
          <div className="mini-stat-icon primary">
            <FiBook size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">{courses.length}</span>
            <span className="label">Total Courses</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon success">
            <FiUsers size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">{courses.filter(c => c.lic).length}</span>
            <span className="label">With LIC</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon warning">
            <FiClock size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">
              {courses.reduce((sum, c) => sum + (c.lectureHours || 0) + (c.tutorialHours || 0) + (c.labHours || 0), 0)}
            </span>
            <span className="label">Total Hours</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon error">
            <FiLayers size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">
              {courses.reduce((sum, c) => sum + c.credits, 0)}
            </span>
            <span className="label">Total Credits</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <CardBody>
          <div className="filters-row">
            <div className="search-box">
              <Input
                placeholder="Search by code or name..."
                icon={<FiSearch />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              placeholder="All Years"
              options={YEARS}
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            />
            <Select
              placeholder="All Semesters"
              options={SEMESTERS}
              value={filters.semester}
              onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
            />
            <Select
              placeholder="All Specializations"
              options={SPECIALIZATIONS}
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
            />
            <Button 
              variant="ghost" 
              onClick={() => {
                setFilters({ year: '', semester: '', specialization: '' });
                setSearchTerm('');
              }}
            >
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Courses Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredCourses}
          loading={loading}
          emptyMessage="No courses found"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={closeFormModal}
        title={selectedCourse ? 'Edit Course' : 'Add New Course'}
        size="lg"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={closeFormModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              loading={submitting}
              disabled={!formValid || submitting}
            >
              {submitting 
                ? (selectedCourse ? 'Updating...' : 'Creating...') 
                : (selectedCourse ? 'Update Course' : 'Create Course')
              }
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="course-form" noValidate>
          {/* Form Progress */}
          <FormProgress 
            formData={formData} 
            requiredFields={requiredFields}
            errors={errors}
          />

          {/* General Error */}
          {errors.general && (
            <div className="alert alert-error">
              <FiAlertCircle />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Course Code Preview */}
          <CourseCodePreview 
            courseCode={formData.courseCode}
            courseName={formData.courseName}
            isValid={isCourseCodeValid}
            isDuplicate={isDuplicateCourseCode}
          />

          {/* Basic Information Section */}
          <div className="form-section">
            <h4>
              <FiBook size={16} />
              Basic Information
            </h4>
            <div className="form-grid-3">
              <ValidatedInput
                label="Course Code"
                name="courseCode"
                placeholder="e.g., IT2030"
                value={formData.courseCode}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.courseCode}
                touched={touched.courseCode}
                required
                disabled={!!selectedCourse}
                maxLength={8}
                hint="2-4 letters + 4 digits"
              />
              <ValidatedInput
                label="Course Name"
                name="courseName"
                placeholder="Enter course name"
                value={formData.courseName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.courseName}
                touched={touched.courseName}
                required
                maxLength={100}
                className="span-2"
              />
            </div>
          </div>

          {/* Course Details Section */}
          <div className="form-section">
            <h4>
              <FiInfo size={16} />
              Course Details
            </h4>
            <div className="form-grid-3">
              <ValidatedSelect
                label="Year"
                name="year"
                options={YEARS}
                value={formData.year}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.year}
                touched={touched.year}
                required
              />
              <ValidatedSelect
                label="Semester"
                name="semester"
                options={SEMESTERS}
                value={formData.semester}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.semester}
                touched={touched.semester}
                required
              />
              <ValidatedInput
                label="Credits"
                name="credits"
                type="number"
                min={1}
                max={6}
                value={formData.credits}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.credits}
                touched={touched.credits}
                required
                hint="1-6 credits"
              />
            </div>
          </div>

          {/* Hours Allocation Section */}
          <div className="form-section">
            <h4>
              <FiClock size={16} />
              Hours Allocation
            </h4>
            <div className="hours-allocation">
              <ValidatedHoursControl
                label="Lecture Hours"
                name="lectureHours"
                value={formData.lectureHours}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.lectureHours}
                touched={touched.lectureHours}
                min={0}
                max={10}
                colorClass="lecture"
              />
              <ValidatedHoursControl
                label="Tutorial Hours"
                name="tutorialHours"
                value={formData.tutorialHours}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.tutorialHours}
                touched={touched.tutorialHours}
                min={0}
                max={10}
                colorClass="tutorial"
              />
              <ValidatedHoursControl
                label="Lab/Practical Hours"
                name="labHours"
                value={formData.labHours}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.labHours}
                touched={touched.labHours}
                min={0}
                max={10}
                colorClass="lab"
              />
            </div>
            
            {/* Hours Summary */}
            <HoursSummary 
              lectureHours={formData.lectureHours}
              tutorialHours={formData.tutorialHours}
              labHours={formData.labHours}
              credits={formData.credits}
            />

            {/* Hours Error */}
            {touched.lectureHours && totalHours === 0 && (
              <div className="alert alert-warning">
                <FiAlertTriangle />
                <span>At least one hour type must be greater than 0</span>
              </div>
            )}
          </div>

          {/* Specializations Section */}
          <div className="form-section">
            <h4>
              <FiLayers size={16} />
              Specializations
            </h4>
            <ValidatedCheckboxGroup
              label="Select Specializations"
              name="specialization"
              options={SPECIALIZATIONS}
              value={formData.specialization}
              onChange={handleChange}
              onBlur={() => setTouched(prev => ({ ...prev, specialization: true }))}
              error={errors.specialization}
              touched={touched.specialization}
              required
              columns={3}
            />
          </div>

          {/* Assignment Section */}
          <div className="form-section">
            <h4>
              <FiUsers size={16} />
              Assignment
            </h4>
            <div className="form-grid-2">
              <ValidatedSelect
                label="Lecturer In Charge (LIC)"
                name="lic"
                options={staffOptions}
                value={formData.lic}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.lic}
                touched={touched.lic}
                placeholder="Select LIC (Optional)"
              />
              
              <div className="form-group">
                <label className="form-label">
                  Assigned Batches
                  {formData.batches.length > 0 && (
                    <span className="batch-count-label">
                      ({formData.batches.length} selected)
                    </span>
                  )}
                </label>
                <div className="batch-select-grid">
                  {batchOptions.length === 0 ? (
                    <p className="no-batches">No batches available</p>
                  ) : (
                    batchOptions.slice(0, 12).map((batch) => (
                      <label 
                        key={batch.value} 
                        className={`checkbox-label small ${formData.batches.includes(batch.value) ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.batches.includes(batch.value)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...formData.batches, batch.value]
                              : formData.batches.filter(b => b !== batch.value);
                            setFormData({ ...formData, batches: updated });
                          }}
                        />
                        <span>{batch.label}</span>
                      </label>
                    ))
                  )}
                </div>
                {batchOptions.length > 12 && (
                  <span className="form-hint">
                    <FiInfo size={12} /> Showing first 12 batches
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form Summary */}
          {formValid && !isDuplicateCourseCode && (
            <div className="form-summary">
              <h4><FiCheck /> Ready to Submit</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Course</span>
                  <span className="summary-value">
                    <span className="course-code-summary">{formData.courseCode}</span>
                    {' '}{formData.courseName}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Credits</span>
                  <span className="summary-value">{formData.credits}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Year/Semester</span>
                  <span className="summary-value">Year {formData.year}, Semester {formData.semester}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Hours (L/T/P)</span>
                  <span className="summary-value">
                    {formData.lectureHours}/{formData.tutorialHours}/{formData.labHours} = {totalHours} hrs/week
                  </span>
                </div>
                <div className="summary-item full-width">
                  <span className="summary-label">Specializations</span>
                  <span className="summary-value">{formData.specialization.join(', ')}</span>
                </div>
                {formData.lic && (
                  <div className="summary-item full-width">
                    <span className="summary-label">LIC</span>
                    <span className="summary-value">
                      {staffOptions.find(s => s.value === formData.lic)?.label || 'Selected'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedCourse(null); }}
        title="Confirm Delete"
        size="sm"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => { setShowDeleteModal(false); setSelectedCourse(null); }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              loading={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Course'}
            </Button>
          </>
        }
      >
        <div className="delete-warning">
          <FiAlertTriangle className="warning-icon" />
          <p>Are you sure you want to delete this course?</p>
          {selectedCourse && (
            <div className="delete-target-info">
              <span className="course-code-delete">{selectedCourse.courseCode}</span>
              <p className="course-name-delete">{selectedCourse.courseName}</p>
              <p className="course-meta-delete">
                Year {selectedCourse.year} • Semester {selectedCourse.semester} • {selectedCourse.credits} Credits
              </p>
            </div>
          )}
          <p className="warning-text">
            This permanently removes the course. Any timetable slots for this course are deleted as well.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CourseManagement;