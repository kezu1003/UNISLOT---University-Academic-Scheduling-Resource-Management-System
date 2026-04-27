// HallManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiMapPin,
  FiUsers, FiMonitor, FiWifi, FiAlertCircle,
  FiCheck, FiInfo, FiX, FiAlertTriangle, FiHome,
  FiCpu, FiSpeaker, FiGrid
} from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { adminAPI } from '../../services/api';
import { LOCATIONS, HALL_TYPES } from '../../utils/constants';
import { toast } from 'react-toastify';
import './HallManagement.css';

// Facilities Configuration
const FACILITIES = [
  { value: 'Projector', label: 'Projector', icon: FiMonitor },
  { value: 'AC', label: 'Air Conditioning', icon: FiWifi },
  { value: 'Computers', label: 'Computers', icon: FiCpu },
  { value: 'Whiteboard', label: 'Whiteboard', icon: FiGrid },
  { value: 'Sound System', label: 'Sound System', icon: FiSpeaker },
  { value: 'Smart Board', label: 'Smart Board', icon: FiMonitor },
  { value: 'Video Conferencing', label: 'Video Conferencing', icon: FiMonitor },
  { value: 'WiFi', label: 'High-Speed WiFi', icon: FiWifi }
];

// Validation Rules
const VALIDATION_RULES = {
  hallCode: {
    required: true,
    message: 'Hall code is required',
    minLength: 2,
    maxLength: 10,
    pattern: /^[A-Z0-9]+$/,
    patternMessage: 'Hall code must contain only letters and numbers',
    validate: (value) => {
      if (!value || !value.trim()) return 'Hall code is required';
      if (value.length < 2) return 'Hall code must be at least 2 characters';
      if (value.length > 10) return 'Hall code cannot exceed 10 characters';
      if (!/^[A-Z0-9]+$/.test(value.toUpperCase())) {
        return 'Only letters and numbers allowed';
      }
      return null;
    }
  },
  hallName: {
    required: true,
    message: 'Hall name is required',
    minLength: 3,
    maxLength: 100,
    validate: (value) => {
      if (!value || !value.trim()) return 'Hall name is required';
      if (value.trim().length < 3) return 'Hall name must be at least 3 characters';
      if (value.trim().length > 100) return 'Hall name cannot exceed 100 characters';
      return null;
    }
  },
  capacity: {
    required: true,
    message: 'Capacity is required',
    min: 1,
    max: 1000,
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num)) return 'Capacity must be a number';
      if (num < 1) return 'Capacity must be at least 1';
      if (num > 1000) return 'Capacity cannot exceed 1000';
      return null;
    }
  },
  location: {
    required: true,
    message: 'Please select a location'
  },
  type: {
    required: true,
    message: 'Please select a hall type'
  },
  facilities: {
    validate: (value) => {
      // Facilities are optional, so no error if empty
      return null;
    }
  }
};

// Initial States
const INITIAL_FORM_DATA = {
  hallCode: '',
  hallName: '',
  capacity: 50,
  location: 'Malabe',
  type: 'Lecture Hall',
  facilities: []
};

const INITIAL_ERRORS = {
  hallCode: '',
  hallName: '',
  capacity: '',
  location: '',
  type: '',
  facilities: '',
  general: ''
};

const INITIAL_TOUCHED = {
  hallCode: false,
  hallName: false,
  capacity: false,
  location: false,
  type: false,
  facilities: false
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

// Facilities Checkbox Group Component
const FacilitiesCheckboxGroup = ({
  label,
  value = [],
  onChange,
  error,
  touched
}) => {
  const showError = touched && error;

  const handleChange = (facilityValue, checked) => {
    const updated = checked
      ? [...value, facilityValue]
      : value.filter(v => v !== facilityValue);
    onChange({ target: { name: 'facilities', value: updated } });
  };

  return (
    <div className={`form-group ${showError ? 'has-error' : ''}`}>
      <label className="form-label">
        {label}
        {value.length > 0 && (
          <span className="selected-count">({value.length} selected)</span>
        )}
      </label>
      <div className="facilities-grid">
        {FACILITIES.map((facility) => {
          const Icon = facility.icon;
          const isChecked = value.includes(facility.value);
          
          return (
            <label 
              key={facility.value} 
              className={`facility-checkbox ${isChecked ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleChange(facility.value, e.target.checked)}
              />
              <div className="facility-content">
                <Icon size={16} />
                <span>{facility.label}</span>
                {isChecked && <FiCheck className="check-icon" size={14} />}
              </div>
            </label>
          );
        })}
      </div>
      {showError && (
        <span className="form-error">
          <FiAlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  );
};

// Capacity Slider Component
const CapacitySlider = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  min = 1,
  max = 500
}) => {
  const showError = touched && error;
  const showSuccess = touched && !error;

  const getCapacityCategory = (cap) => {
    if (cap <= 30) return { label: 'Small', color: 'var(--success-main)' };
    if (cap <= 100) return { label: 'Medium', color: 'var(--warning-main)' };
    if (cap <= 200) return { label: 'Large', color: 'var(--primary-500)' };
    return { label: 'Extra Large', color: 'var(--error-main)' };
  };

  const category = getCapacityCategory(value);
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`form-group ${showError ? 'has-error' : ''} ${showSuccess ? 'has-success' : ''}`}>
      <label htmlFor={name} className={`form-label ${required ? 'required' : ''}`}>
        {label}
      </label>
      <div className="capacity-slider-wrapper">
        <div className="capacity-display">
          <span className="capacity-value" style={{ color: category.color }}>{value}</span>
          <span className="capacity-label">{category.label}</span>
        </div>
        <input
          type="range"
          id={name}
          name={name}
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="capacity-slider"
          style={{
            background: `linear-gradient(to right, ${category.color} 0%, ${category.color} ${percentage}%, var(--neutral-200) ${percentage}%, var(--neutral-200) 100%)`
          }}
        />
        <div className="capacity-labels">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
      <div className="capacity-input-row">
        <input
          type="number"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          min={min}
          max={max}
          className={`capacity-number-input ${showError ? 'error' : ''}`}
        />
        <span className="capacity-unit">seats</span>
      </div>
      {showError && (
        <span className="form-error">
          <FiAlertCircle size={12} /> {error}
        </span>
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

// Hall Preview Component
const HallPreview = ({ formData, isValid, isDuplicate }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'Lecture Hall': return 'primary';
      case 'Lab': return 'warning';
      case 'Tutorial Room': return 'success';
      default: return 'neutral';
    }
  };

  const getCapacityIcon = (capacity) => {
    if (capacity <= 30) return '🏠';
    if (capacity <= 100) return '🏢';
    if (capacity <= 200) return '🏛️';
    return '🏟️';
  };

  return (
    <div className={`hall-preview ${isDuplicate ? 'duplicate' : ''} ${isValid && !isDuplicate ? 'valid' : ''}`}>
      <div className="preview-status">
        {isValid && !isDuplicate && (
          <span className="status-badge valid">
            <FiCheck size={12} /> Valid
          </span>
        )}
        {isDuplicate && (
          <span className="status-badge duplicate">
            <FiAlertTriangle size={12} /> Duplicate Code
          </span>
        )}
      </div>
      
      <div className="preview-header">
        <span className="preview-code">{formData.hallCode || '???'}</span>
        <Badge variant={getTypeColor(formData.type)}>{formData.type}</Badge>
      </div>
      
      <p className="preview-name">{formData.hallName || 'Hall Name'}</p>
      
      <div className="preview-meta">
        <span className="meta-item">
          <span className="meta-icon">{getCapacityIcon(formData.capacity)}</span>
          <span>{formData.capacity} seats</span>
        </span>
        <span className="meta-item">
          <FiMapPin size={14} />
          <span>{formData.location}</span>
        </span>
      </div>
      
      {formData.facilities.length > 0 && (
        <div className="preview-facilities">
          <span className="facilities-label">Facilities:</span>
          <div className="facilities-tags">
            {formData.facilities.slice(0, 4).map((f, i) => (
              <span key={i} className="facility-tag">{f}</span>
            ))}
            {formData.facilities.length > 4 && (
              <span className="facility-more">+{formData.facilities.length - 4}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
const HallManagement = () => {
  // Data State
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    type: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHall, setSelectedHall] = useState(null);

  // Maintenance state
  const [maintenanceIssue, setMaintenanceIssue] = useState('');
  const [maintenanceError, setMaintenanceError] = useState('');

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const [isDuplicateHallCode, setIsDuplicateHallCode] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  // Fetch halls
  const fetchHalls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getHalls(filters);
      setHalls(response.data.data || []);
    } catch (error) {
      console.error('Error fetching halls:', error);
      toast.error('Failed to fetch halls');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHalls();
  }, [fetchHalls]);

  // Validate form on data change
  useEffect(() => {
    const isValid = validateFormSilent();
    setFormValid(isValid && !isDuplicateHallCode);
  }, [formData, isDuplicateHallCode]);

  // Check for duplicate hall code
  useEffect(() => {
    if (!formData.hallCode) {
      setIsDuplicateHallCode(false);
      return;
    }

    const exists = halls.some(hall => 
      hall.hallCode.toUpperCase() === formData.hallCode.toUpperCase() && 
      (!selectedHall || hall._id !== selectedHall._id)
    );

    setIsDuplicateHallCode(exists);
    
    if (exists) {
      setErrors(prev => ({ ...prev, hallCode: 'This hall code already exists' }));
    } else if (touched.hallCode) {
      const error = validateField('hallCode', formData.hallCode);
      setErrors(prev => ({ ...prev, hallCode: error }));
    }
  }, [formData.hallCode, halls, selectedHall, touched.hallCode]);

  // Group halls by location
  const hallsByLocation = halls.reduce((acc, hall) => {
    if (!acc[hall.location]) {
      acc[hall.location] = [];
    }
    acc[hall.location].push(hall);
    return acc;
  }, {});

  // Filter halls
  const filteredHalls = halls.filter(hall => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!hall.hallCode.toLowerCase().includes(search) && 
          !hall.hallName.toLowerCase().includes(search)) {
        return false;
      }
    }
    return true;
  });

  // Validation Functions
  const validateField = useCallback((name, value) => {
    const rule = VALIDATION_RULES[name];
    if (!rule) return '';

    // Required check
    if (rule.required && (value === '' || value === null || value === undefined)) {
      return rule.message;
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
    const requiredFields = ['hallCode', 'hallName', 'capacity', 'location', 'type'];
    
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
        if (VALIDATION_RULES[field].required) {
          isValid = false;
        }
      }
    });

    // Check duplicate
    if (isDuplicateHallCode) {
      newErrors.hallCode = 'This hall code already exists';
      isValid = false;
    }

    setErrors(newErrors);
    setTouched(Object.keys(INITIAL_TOUCHED).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));

    return isValid;
  }, [formData, validateField, isDuplicateHallCode]);

  // Event Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Auto-uppercase hall code
    if (name === 'hallCode') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    // Convert numeric fields
    if (name === 'capacity') {
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

    if (isDuplicateHallCode) {
      toast.error('This hall code already exists');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        hallCode: formData.hallCode.toUpperCase()
      };

      if (selectedHall) {
        await adminAPI.updateHall(selectedHall._id, payload);
        toast.success('Hall updated successfully');
        setShowEditModal(false);
      } else {
        await adminAPI.createHall(payload);
        toast.success('Hall created successfully');
        setShowAddModal(false);
      }

      resetForm();
      fetchHalls();
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      setErrors(prev => ({ ...prev, general: message }));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle remove for maintenance
  const handleDelete = async () => {
    if (!selectedHall) return;

    const issueText = maintenanceIssue.trim();
    if (!issueText) {
      setMaintenanceError('Please describe the maintenance issue');
      return;
    }

    setMaintenanceError('');
    setDeleting(true);

    try {
      await adminAPI.deleteHall(selectedHall._id, { maintenanceIssue: issueText });
      toast.success('Hall removed for maintenance');
      setShowDeleteModal(false);
      setSelectedHall(null);
      setMaintenanceIssue('');
      fetchHalls();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove hall for maintenance';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors(INITIAL_ERRORS);
    setTouched(INITIAL_TOUCHED);
    setSelectedHall(null);
    setIsDuplicateHallCode(false);
  };

  // Close modal
  const closeFormModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  // Open edit modal
  const openEditModal = (hall) => {
    setSelectedHall(hall);
    setFormData({
      hallCode: hall.hallCode,
      hallName: hall.hallName,
      capacity: hall.capacity,
      location: hall.location,
      type: hall.type,
      facilities: hall.facilities || []
    });
    setErrors(INITIAL_ERRORS);
    setTouched(INITIAL_TOUCHED);
    setShowEditModal(true);
  };

  // Get hall type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'Lecture Hall': return 'primary';
      case 'Lab': return 'warning';
      case 'Tutorial Room': return 'success';
      default: return 'neutral';
    }
  };

  // Required fields for progress
  const requiredFields = ['hallCode', 'hallName', 'capacity', 'location', 'type'];

  // Table columns
  const columns = [
    {
      key: 'hallCode',
      title: 'Code',
      width: '100px',
      render: (code) => (
        <span className="hall-code">{code}</span>
      )
    },
    {
      key: 'hallName',
      title: 'Hall Name',
      render: (name) => (
        <span className="hall-name">{name}</span>
      )
    },
    {
      key: 'type',
      title: 'Type',
      width: '130px',
      render: (type) => (
        <Badge variant={getTypeColor(type)}>{type}</Badge>
      )
    },
    {
      key: 'capacity',
      title: 'Capacity',
      width: '100px',
      render: (capacity) => (
        <div className="capacity-cell">
          <FiUsers size={14} />
          <span>{capacity}</span>
        </div>
      )
    },
    {
      key: 'location',
      title: 'Location',
      width: '120px',
      render: (location) => (
        <div className="location-cell">
          <FiMapPin size={14} />
          <span>{location}</span>
        </div>
      )
    },
    {
      key: 'facilities',
      title: 'Facilities',
      render: (facilities) => (
        <div className="facilities-cell">
          {(facilities || []).slice(0, 3).map((f, i) => (
            <span key={i} className="facility-tag">{f}</span>
          ))}
          {(facilities || []).length > 3 && (
            <span className="facility-more">+{facilities.length - 3}</span>
          )}
          {(!facilities || facilities.length === 0) && (
            <span className="no-facilities">None</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '100px',
      render: (_, row) => (
        <div className="action-buttons">
          <button 
            className="action-btn" 
            onClick={() => openEditModal(row)}
            title="Edit"
          >
            <FiEdit2 size={16} />
          </button>
          <button 
            className="action-btn danger" 
            onClick={() => { setSelectedHall(row); setMaintenanceIssue(''); setMaintenanceError(''); setShowDeleteModal(true); }}
            title="Remove for Maintenance"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  // Calculate stats
  const totalCapacity = halls.reduce((sum, h) => sum + (h.capacity || 0), 0);
  const lectureHalls = halls.filter(h => h.type === 'Lecture Hall').length;
  const labs = halls.filter(h => h.type === 'Lab').length;

  return (
    <div className="hall-management">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Hall Management</h2>
          <p>Manage lecture halls, labs, and tutorial rooms across all campuses</p>
        </div>
        <div className="header-actions">
          <Button 
            variant="primary" 
            icon={<FiPlus />}
            onClick={() => { resetForm(); setShowAddModal(true); }}
          >
            Add Hall
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="mini-stat">
          <div className="mini-stat-icon primary">
            <FiHome size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">{halls.length}</span>
            <span className="label">Total Halls</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon success">
            <FiUsers size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">{totalCapacity}</span>
            <span className="label">Total Capacity</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon warning">
            <FiMonitor size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">{lectureHalls}</span>
            <span className="label">Lecture Halls</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon error">
            <FiCpu size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">{labs}</span>
            <span className="label">Labs</span>
          </div>
        </div>
      </div>

      {/* Location Summary Cards */}
      <div className="location-summary">
        {Object.entries(hallsByLocation).map(([location, locationHalls]) => (
          <div key={location} className="location-card">
            <div className="location-icon">
              <FiMapPin size={20} />
            </div>
            <div className="location-info">
              <span className="location-name">{location}</span>
              <span className="location-count">{locationHalls.length} halls</span>
            </div>
            <div className="location-capacity">
              <FiUsers size={14} />
              <span>{locationHalls.reduce((sum, h) => sum + h.capacity, 0)}</span>
            </div>
          </div>
        ))}
        {Object.keys(hallsByLocation).length === 0 && (
          <div className="location-card empty">
            <FiInfo size={20} />
            <span>No halls added yet</span>
          </div>
        )}
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
              placeholder="All Locations"
              options={LOCATIONS}
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
            <Select
              placeholder="All Types"
              options={HALL_TYPES}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            />
            <Button 
              variant="ghost" 
              onClick={() => {
                setFilters({ location: '', type: '' });
                setSearchTerm('');
              }}
            >
              Clear
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Halls Table */}
      <Card>
        <Table
          columns={columns}
          data={filteredHalls}
          loading={loading}
          emptyMessage="No halls found"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={closeFormModal}
        title={selectedHall ? 'Edit Hall' : 'Add New Hall'}
        size="md"
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
                ? (selectedHall ? 'Updating...' : 'Creating...') 
                : (selectedHall ? 'Update Hall' : 'Create Hall')
              }
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="hall-form" noValidate>
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

          {/* Duplicate Warning */}
          {isDuplicateHallCode && (
            <div className="alert alert-warning">
              <FiAlertTriangle />
              <span>This hall code already exists. Please use a different code.</span>
            </div>
          )}

          {/* Hall Code & Name */}
          <div className="form-row">
            <ValidatedInput
              label="Hall Code"
              name="hallCode"
              placeholder="e.g., A501"
              value={formData.hallCode}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.hallCode}
              touched={touched.hallCode}
              required
              disabled={!!selectedHall}
              maxLength={10}
              hint="Letters and numbers only"
            />
            <ValidatedInput
              label="Hall Name"
              name="hallName"
              placeholder="e.g., Main Lecture Hall"
              value={formData.hallName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.hallName}
              touched={touched.hallName}
              required
              maxLength={100}
            />
          </div>

          {/* Type & Location */}
          <div className="form-row">
            <ValidatedSelect
              label="Hall Type"
              name="type"
              options={HALL_TYPES}
              value={formData.type}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.type}
              touched={touched.type}
              required
            />
            <ValidatedSelect
              label="Location/Campus"
              name="location"
              options={LOCATIONS}
              value={formData.location}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.location}
              touched={touched.location}
              required
            />
          </div>

          {/* Capacity */}
          <CapacitySlider
            label="Seating Capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.capacity}
            touched={touched.capacity}
            required
            min={1}
            max={500}
          />

          {/* Facilities */}
          <FacilitiesCheckboxGroup
            label="Facilities (Optional)"
            value={formData.facilities}
            onChange={handleChange}
            error={errors.facilities}
            touched={touched.facilities}
          />

          {/* Hall Preview */}
          <HallPreview 
            formData={formData}
            isValid={formValid}
            isDuplicate={isDuplicateHallCode}
          />

          {/* Form Summary */}
          {formValid && !isDuplicateHallCode && (
            <div className="form-summary">
              <h4><FiCheck /> Ready to Submit</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Hall Code</span>
                  <span className="summary-value hall-code-summary">{formData.hallCode}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Hall Name</span>
                  <span className="summary-value">{formData.hallName}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Type</span>
                  <span className="summary-value">{formData.type}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Capacity</span>
                  <span className="summary-value">{formData.capacity} seats</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Location</span>
                  <span className="summary-value">{formData.location}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Facilities</span>
                  <span className="summary-value">
                    {formData.facilities.length > 0 
                      ? formData.facilities.join(', ') 
                      : 'None selected'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedHall(null); setMaintenanceIssue(''); setMaintenanceError(''); }}
        title="Remove Hall for Maintenance"
        size="sm"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => { setShowDeleteModal(false); setSelectedHall(null); setMaintenanceIssue(''); setMaintenanceError(''); }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              loading={deleting}
            >
              {deleting ? 'Removing...' : 'Remove for Maintenance'}
            </Button>
          </>
        }
      >
        <div className="delete-warning maintenance-modal">
          <FiAlertTriangle className="warning-icon" />
          <p>Remove this hall from active scheduling and record the maintenance issue.</p>
          {selectedHall && (
            <div className="delete-target-info">
              <span className="hall-code-delete">{selectedHall.hallCode}</span>
              <p className="hall-name-delete">{selectedHall.hallName}</p>
              <p className="hall-meta-delete">
                {selectedHall.type} • {selectedHall.capacity} seats • {selectedHall.location}
              </p>
            </div>
          )}
          <div className="form-group maintenance-issue-group">
            <label htmlFor="maintenanceIssue" className="form-label required">
              Maintenance issue
            </label>
            <textarea
              id="maintenanceIssue"
              name="maintenanceIssue"
              value={maintenanceIssue}
              onChange={(e) => {
                setMaintenanceIssue(e.target.value);
                if (maintenanceError) setMaintenanceError('');
              }}
              rows={4}
              placeholder="Describe the reason for maintenance (e.g. projector failure, broken seating)..."
              className={`form-textarea ${maintenanceError ? 'error' : ''}`}
            />
            {maintenanceError && (
              <span className="form-error">
                <FiAlertCircle size={12} /> {maintenanceError}
              </span>
            )}
          </div>
          <p className="warning-text">This will temporarily remove the hall from active listings until maintenance is complete.</p>
        </div>
      </Modal>
    </div>
  );
};

export default HallManagement;