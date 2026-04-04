// StaffManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiPlus, FiUpload, FiSearch, FiFilter, FiEdit2, 
  FiTrash2, FiMoreVertical, FiDownload, FiEye,
  FiAlertCircle, FiCheck, FiInfo, FiX, FiAlertTriangle
} from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import FileUpload from '../../components/common/FileUpload';
import Loading from '../../components/common/Loading';
import { adminAPI } from '../../services/api';
import { SPECIALIZATIONS, LOCATIONS } from '../../utils/constants';
import { debounce, getWorkloadStatus, getWorkloadColor } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './StaffManagement.css';

// Validation Rules
const VALIDATION_RULES = {
  staffId: {
    required: true,
    message: 'Staff ID is required',
    minLength: 2,
    maxLength: 20,
    pattern: /^[A-Za-z0-9-_]+$/,
    patternMessage: 'Staff ID can only contain letters, numbers, hyphens, and underscores'
  },
  name: {
    required: true,
    message: 'Full name is required',
    minLength: 2,
    maxLength: 100,
    pattern: /^[A-Za-z\s.'-]+$/,
    patternMessage: 'Name can only contain letters, spaces, dots, apostrophes, and hyphens'
  },
  email: {
    required: true,
    message: 'Email is required',
    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    patternMessage: 'Please enter a valid email address'
  },
  priority: {
    required: true,
    message: 'Priority is required',
    min: 1,
    max: 100,
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num)) return 'Priority must be a number';
      if (num < 1 || num > 100) return 'Priority must be between 1 and 100';
      return null;
    }
  },
  maxWorkload: {
    required: true,
    message: 'Max workload is required',
    min: 1,
    max: 40,
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num)) return 'Workload must be a number';
      if (num < 1) return 'Workload must be at least 1 hour';
      if (num > 40) return 'Workload cannot exceed 40 hours';
      return null;
    }
  },
  location: {
    required: true,
    message: 'Please select a location'
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
  }
};

// Initial States
const INITIAL_FORM_DATA = {
  staffId: '',
  name: '',
  email: '',
  priority: 50,
  specialization: [],
  location: 'Malabe',
  maxWorkload: 20
};

const INITIAL_ERRORS = {
  staffId: '',
  name: '',
  email: '',
  priority: '',
  specialization: '',
  location: '',
  maxWorkload: '',
  general: ''
};

const INITIAL_TOUCHED = {
  staffId: false,
  name: false,
  email: false,
  priority: false,
  specialization: false,
  location: false,
  maxWorkload: false
};

// Reusable Form Components
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
  icon,
  min,
  max
}) => {
  const showError = touched && error;
  const showSuccess = touched && !error && value;

  return (
    <div className={`form-group ${showError ? 'has-error' : ''} ${showSuccess ? 'has-success' : ''}`}>
      <label htmlFor={name} className={`form-label ${required ? 'required' : ''}`}>
        {label}
      </label>
      <div className="input-wrapper">
        {icon && <span className="input-icon-left">{icon}</span>}
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
          className={`form-input ${showError ? 'error' : ''} ${showSuccess ? 'success' : ''} ${icon ? 'has-icon' : ''}`}
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
  const showSuccess = touched && !error && value;

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
          <option value="">{placeholder}</option>
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
        {showSuccess && <FiCheck className="label-icon success" />}
      </label>
      <div 
        className="checkbox-group" 
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
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">{opt.label}</span>
          </label>
        ))}
      </div>
      {showError && (
        <span className="form-error">
          <FiAlertCircle size={12} /> {error}
        </span>
      )}
      {value.length > 0 && (
        <span className="form-hint success">
          <FiCheck size={12} /> {value.length} specialization(s) selected
        </span>
      )}
    </div>
  );
};

const PrioritySlider = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  min = 1,
  max = 100
}) => {
  const showError = touched && error;
  
  const getPriorityLabel = (val) => {
    if (val <= 20) return { text: 'High Priority', color: 'var(--success-main)' };
    if (val <= 50) return { text: 'Medium Priority', color: 'var(--warning-main)' };
    return { text: 'Low Priority', color: 'var(--error-main)' };
  };

  const priorityInfo = getPriorityLabel(value);

  return (
    <div className={`form-group ${showError ? 'has-error' : ''}`}>
      <label className={`form-label ${required ? 'required' : ''}`}>
        {label}
      </label>
      <div className="priority-slider-wrapper">
        <input
          type="range"
          name={name}
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="priority-slider"
          style={{
            background: `linear-gradient(to right, var(--success-main) 0%, var(--warning-main) 50%, var(--error-main) 100%)`
          }}
        />
        <div className="priority-labels">
          <span>High (1)</span>
          <span>Low (100)</span>
        </div>
      </div>
      <div className="priority-value" style={{ color: priorityInfo.color }}>
        <span className="priority-number">{value}</span>
        <span className="priority-text">{priorityInfo.text}</span>
      </div>
      {showError && (
        <span className="form-error">
          <FiAlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  );
};

const FormProgress = ({ formData, requiredFields }) => {
  const filled = requiredFields.filter(field => {
    const value = formData[field];
    if (Array.isArray(value)) return value.length > 0;
    return value !== '' && value !== null && value !== undefined;
  }).length;
  
  const percentage = Math.round((filled / requiredFields.length) * 100);

  return (
    <div className="form-progress">
      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="progress-text">{percentage}% Complete ({filled}/{requiredFields.length} fields)</span>
    </div>
  );
};

// Main Component
const StaffManagement = () => {
  // State
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    specialization: '',
    location: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'priority',
    order: 'asc'
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState(INITIAL_ERRORS);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);
  const [formValid, setFormValid] = useState(false);

  // File upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  // Fetch staff data
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        sortBy: sortConfig.field,
        order: sortConfig.order,
        ...filters
      };

      const response = await adminAPI.getStaff(params);
      
      setStaff(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.totalPages
      }));
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to fetch staff data');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, filters, sortConfig]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Validate form on data change
  useEffect(() => {
    const isValid = validateFormSilent();
    setFormValid(isValid);
  }, [formData]);

  // Validation Functions
  const validateField = useCallback((name, value) => {
    const rule = VALIDATION_RULES[name];
    if (!rule) return '';

    // Required check
    if (rule.required) {
      if (Array.isArray(value)) {
        if (value.length === 0) return rule.message;
      } else if (!value || (typeof value === 'string' && !value.trim())) {
        return rule.message;
      }
    }

    // Skip other validations if empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) return '';

    // Min length
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      return `Minimum ${rule.minLength} characters required`;
    }

    // Max length
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      return `Maximum ${rule.maxLength} characters allowed`;
    }

    // Pattern
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return rule.patternMessage || 'Invalid format';
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
    Object.keys(VALIDATION_RULES).forEach(field => {
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

    setFormErrors(newErrors);
    setTouched(Object.keys(INITIAL_TOUCHED).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));

    return isValid;
  }, [formData, validateField]);

  // Check for duplicate staff ID
  const checkDuplicateStaffId = async (staffId) => {
    if (!staffId || selectedStaff) return null;
    
    try {
      const existing = staff.find(s => s.staffId.toLowerCase() === staffId.toLowerCase());
      if (existing) {
        return 'This Staff ID already exists';
      }
    } catch (error) {
      console.error('Error checking duplicate:', error);
    }
    return null;
  };

  // Check for duplicate email
  const checkDuplicateEmail = async (email) => {
    if (!email) return null;
    
    try {
      const existing = staff.find(s => 
        s.email.toLowerCase() === email.toLowerCase() && 
        (!selectedStaff || s._id !== selectedStaff._id)
      );
      if (existing) {
        return 'This email is already registered';
      }
    } catch (error) {
      console.error('Error checking duplicate:', error);
    }
    return null;
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300),
    []
  );

  // Handle sort
  const handleSort = (field, order) => {
    setSortConfig({ field, order });
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error on change
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle input blur
  const handleBlur = async (e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({ ...prev, [name]: true }));

    let error = validateField(name, value);

    // Additional async validations
    if (!error && name === 'staffId' && !selectedStaff) {
      error = await checkDuplicateStaffId(value);
    }
    if (!error && name === 'email') {
      error = await checkDuplicateEmail(value);
    }

    setFormErrors(prev => ({ ...prev, [name]: error || '' }));
  };

  // Handle form submit (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Final duplicate checks
    if (!selectedStaff) {
      const duplicateId = await checkDuplicateStaffId(formData.staffId);
      if (duplicateId) {
        setFormErrors(prev => ({ ...prev, staffId: duplicateId }));
        toast.error(duplicateId);
        return;
      }
    }

    const duplicateEmail = await checkDuplicateEmail(formData.email);
    if (duplicateEmail) {
      setFormErrors(prev => ({ ...prev, email: duplicateEmail }));
      toast.error(duplicateEmail);
      return;
    }

    setSubmitting(true);

    try {
      if (selectedStaff) {
        // Update
        await adminAPI.updateStaff(selectedStaff._id, formData);
        toast.success('Staff updated successfully');
        setShowEditModal(false);
      } else {
        // Create
        await adminAPI.createStaff(formData);
        toast.success('Staff added successfully');
        setShowAddModal(false);
      }

      resetForm();
      fetchStaff();
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      setFormErrors(prev => ({ ...prev, general: message }));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Validate file upload
  const validateUploadFile = (file) => {
    if (!file) {
      return 'Please select a file';
    }

    const validTypes = ['.txt', '.csv', 'text/plain', 'text/csv', 'application/vnd.ms-excel'];
    const fileType = file.type || '';
    const fileName = file.name || '';
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(fileType) && !validTypes.includes(extension)) {
      return 'Invalid file type. Please upload a .txt or .csv file';
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'File size exceeds 5MB limit';
    }

    return '';
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    const error = validateUploadFile(file);
    setUploadError(error);
    setUploadFile(error ? null : file);
  };

  // Handle file upload
  const handleUpload = async () => {
    const error = validateUploadFile(uploadFile);
    if (error) {
      setUploadError(error);
      toast.error(error);
      return;
    }

    setUploading(true);

    try {
      const response = await adminAPI.uploadStaff(uploadFile);
      toast.success(response.data.message || 'Staff uploaded successfully');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadError('');
      fetchStaff();
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed';
      setUploadError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedStaff) return;

    setDeleting(true);

    try {
      await adminAPI.deleteStaff(selectedStaff._id);
      toast.success('Staff deactivated successfully');
      setShowDeleteModal(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (error) {
      toast.error('Failed to delete staff');
    } finally {
      setDeleting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setFormErrors(INITIAL_ERRORS);
    setTouched(INITIAL_TOUCHED);
    setSelectedStaff(null);
  };

  // Open edit modal
  const openEditModal = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      staffId: staff.staffId,
      name: staff.name,
      email: staff.email,
      priority: staff.priority,
      specialization: staff.specialization,
      location: staff.location,
      maxWorkload: staff.maxWorkload
    });
    setFormErrors(INITIAL_ERRORS);
    setTouched(INITIAL_TOUCHED);
    setShowEditModal(true);
  };

  // Close modal
  const closeFormModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  // Close upload modal
  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadError('');
  };

  // Table columns
  const columns = [
    {
      key: 'staffId',
      title: 'Staff ID',
      sortable: true,
      width: '100px'
    },
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (name, row) => (
        <div className="staff-name-cell">
          <div className="staff-avatar">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="name">{name}</p>
            <p className="email">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'priority',
      title: 'Priority',
      sortable: true,
      width: '100px',
      render: (priority) => (
        <Badge variant={priority <= 20 ? 'success' : priority <= 50 ? 'warning' : 'neutral'}>
          {priority}
        </Badge>
      )
    },
    {
      key: 'specialization',
      title: 'Specialization',
      render: (specs) => (
        <div className="spec-badges">
          {specs.slice(0, 2).map((spec, i) => (
            <Badge key={i} variant="primary">{spec}</Badge>
          ))}
          {specs.length > 2 && (
            <Badge variant="neutral">+{specs.length - 2}</Badge>
          )}
        </div>
      )
    },
    {
      key: 'location',
      title: 'Location',
      sortable: true,
      width: '120px'
    },
    {
      key: 'currentWorkload',
      title: 'Workload',
      width: '150px',
      render: (workload, row) => {
        const percentage = (workload / row.maxWorkload) * 100;
        const color = getWorkloadColor(workload, row.maxWorkload);
        
        return (
          <div className="workload-cell">
            <div className="workload-bar">
              <div 
                className="workload-fill"
                style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
              />
            </div>
            <span className="workload-text">{workload}/{row.maxWorkload} hrs</span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '120px',
      render: (_, row) => (
        <div className="action-buttons">
          <button 
            className="action-btn" 
            onClick={() => { setSelectedStaff(row); setShowViewModal(true); }}
            title="View"
          >
            <FiEye size={16} />
          </button>
          <button 
            className="action-btn" 
            onClick={() => openEditModal(row)}
            title="Edit"
          >
            <FiEdit2 size={16} />
          </button>
          <button 
            className="action-btn danger" 
            onClick={() => { setSelectedStaff(row); setShowDeleteModal(true); }}
            title="Delete"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const requiredFields = ['staffId', 'name', 'email', 'priority', 'specialization', 'location', 'maxWorkload'];

  return (
    <div className="staff-management">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Staff Management</h2>
          <p>Manage teaching staff, set priorities, and track workload</p>
        </div>
        <div className="header-actions">
          <Button 
            variant="secondary" 
            icon={<FiUpload />}
            onClick={() => setShowUploadModal(true)}
          >
            Upload Staff
          </Button>
          <Button 
            variant="primary" 
            icon={<FiPlus />}
            onClick={() => { resetForm(); setShowAddModal(true); }}
          >
            Add Staff
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <CardBody>
          <div className="filters-row">
            <div className="search-box">
              <Input
                placeholder="Search by name, email, or ID..."
                icon={<FiSearch />}
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            <Select
              placeholder="All Specializations"
              options={SPECIALIZATIONS}
              value={filters.specialization}
              onChange={(e) => handleFilterChange('specialization', e.target.value)}
            />
            <Select
              placeholder="All Locations"
              options={LOCATIONS}
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
            <Button 
              variant="ghost" 
              icon={<FiDownload />}
              onClick={() => {/* Export logic */}}
            >
              Export
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Staff Table */}
      <Card>
        <Table
          columns={columns}
          data={staff}
          loading={loading}
          sortField={sortConfig.field}
          sortOrder={sortConfig.order}
          onSort={handleSort}
          emptyMessage="No staff members found"
        />
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            
            <div className="page-numbers">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .slice(
                  Math.max(0, pagination.page - 3),
                  Math.min(pagination.totalPages, pagination.page + 2)
                )
                .map(page => (
                  <button
                    key={page}
                    className={`page-btn ${pagination.page === page ? 'active' : ''}`}
                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                  >
                    {page}
                  </button>
                ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={closeFormModal}
        title={selectedStaff ? 'Edit Staff' : 'Add New Staff'}
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
              {submitting ? (selectedStaff ? 'Updating...' : 'Adding...') : (selectedStaff ? 'Update Staff' : 'Add Staff')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="staff-form" noValidate>
          {/* Form Progress */}
          <FormProgress formData={formData} requiredFields={requiredFields} />

          {/* General Error */}
          {formErrors.general && (
            <div className="alert alert-error">
              <FiAlertCircle />
              <span>{formErrors.general}</span>
            </div>
          )}

          <div className="form-row">
            <ValidatedInput
              label="Staff ID"
              name="staffId"
              placeholder="e.g., ST001"
              value={formData.staffId}
              onChange={handleChange}
              onBlur={handleBlur}
              error={formErrors.staffId}
              touched={touched.staffId}
              required
              disabled={!!selectedStaff}
              hint={selectedStaff ? 'Staff ID cannot be changed' : 'Unique identifier for the staff member'}
            />
            <ValidatedInput
              label="Full Name"
              name="name"
              placeholder="e.g., Dr. John Smith"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={formErrors.name}
              touched={touched.name}
              required
            />
          </div>

          <ValidatedInput
            label="Email Address"
            name="email"
            type="email"
            placeholder="e.g., john.smith@sliit.lk"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={formErrors.email}
            touched={touched.email}
            required
            hint="Must be a valid email address"
          />

          <div className="form-row">
            <PrioritySlider
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              onBlur={handleBlur}
              error={formErrors.priority}
              touched={touched.priority}
              required
            />

            <ValidatedInput
              label="Max Workload (hours/week)"
              name="maxWorkload"
              type="number"
              min={1}
              max={40}
              value={formData.maxWorkload}
              onChange={handleChange}
              onBlur={handleBlur}
              error={formErrors.maxWorkload}
              touched={touched.maxWorkload}
              required
              hint="Between 1 and 40 hours"
            />
          </div>

          <ValidatedSelect
            label="Location"
            name="location"
            options={LOCATIONS}
            value={formData.location}
            onChange={handleChange}
            onBlur={handleBlur}
            error={formErrors.location}
            touched={touched.location}
            required
            placeholder="Select location"
          />

          <ValidatedCheckboxGroup
            label="Specializations"
            name="specialization"
            options={SPECIALIZATIONS}
            value={formData.specialization}
            onChange={handleChange}
            onBlur={() => setTouched(prev => ({ ...prev, specialization: true }))}
            error={formErrors.specialization}
            touched={touched.specialization}
            required
            columns={3}
          />

          {/* Form Summary */}
          {formValid && (
            <div className="form-summary">
              <h4><FiCheck /> Ready to Submit</h4>
              <div className="summary-content">
                <p><strong>{formData.name}</strong> ({formData.staffId})</p>
                <p>Email: {formData.email}</p>
                <p>Location: {formData.location} | Priority: {formData.priority} | Max Workload: {formData.maxWorkload}hrs</p>
                <p>Specializations: {formData.specialization.join(', ')}</p>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={closeUploadModal}
        title="Upload Staff from File"
        size="md"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={closeUploadModal}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUpload}
              loading={uploading}
              disabled={!uploadFile || !!uploadError || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </>
        }
      >
        <div className="upload-content">
          <div className={`file-upload-wrapper ${uploadError ? 'has-error' : ''} ${uploadFile && !uploadError ? 'has-file' : ''}`}>
            <FileUpload
              label="Staff Data File"
              accept=".txt,.csv"
              onChange={handleFileSelect}
              hint="Upload a TXT or CSV file with staff data (max 5MB)"
            />
            {uploadFile && !uploadError && (
              <div className="file-info success">
                <FiCheck />
                <span>{uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
            {uploadError && (
              <div className="file-info error">
                <FiAlertCircle />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          <div className="format-info">
            <h4>Expected Format:</h4>
            <code>staffId|name|email|priority|specialization|location</code>
            <p>Example:</p>
            <code>ST001|Dr. John Smith|john@sliit.lk|10|IT,SE|Malabe</code>
            
            <div className="format-rules">
              <h5>Validation Rules:</h5>
              <ul>
                <li><FiCheck className="rule-icon" /> Staff ID: Required, alphanumeric with hyphens</li>
                <li><FiCheck className="rule-icon" /> Name: Required, 2-100 characters</li>
                <li><FiCheck className="rule-icon" /> Email: Required, valid email format</li>
                <li><FiCheck className="rule-icon" /> Priority: 1-100 (1 = highest)</li>
                <li><FiCheck className="rule-icon" /> Specialization: Comma-separated values</li>
                <li><FiCheck className="rule-icon" /> Location: Valid location name</li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedStaff(null); }}
        title="Confirm Delete"
        size="sm"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => { setShowDeleteModal(false); setSelectedStaff(null); }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              loading={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        <div className="delete-warning">
          <FiAlertTriangle className="warning-icon" />
          <p>Are you sure you want to deactivate <strong>{selectedStaff?.name}</strong>?</p>
          {selectedStaff && (
            <div className="delete-target-info">
              <p><strong>{selectedStaff.staffId}</strong></p>
              <p>{selectedStaff.email}</p>
              <p>{selectedStaff.location}</p>
            </div>
          )}
          <p className="text-secondary">This action can be undone by an administrator.</p>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedStaff(null); }}
        title="Staff Details"
        size="md"
      >
        {selectedStaff && (
          <div className="staff-details">
            <div className="staff-header">
              <div className="staff-avatar large">
                {selectedStaff.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3>{selectedStaff.name}</h3>
                <p>{selectedStaff.email}</p>
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Staff ID</span>
                <span className="value">{selectedStaff.staffId}</span>
              </div>
              <div className="detail-item">
                <span className="label">Priority</span>
                <Badge variant={selectedStaff.priority <= 20 ? 'success' : selectedStaff.priority <= 50 ? 'warning' : 'neutral'}>
                  {selectedStaff.priority}
                </Badge>
              </div>
              <div className="detail-item">
                <span className="label">Location</span>
                <span className="value">{selectedStaff.location}</span>
              </div>
              <div className="detail-item">
                <span className="label">Workload</span>
                <span className="value">
                  {selectedStaff.currentWorkload}/{selectedStaff.maxWorkload} hours
                </span>
              </div>
            </div>

            <div className="detail-section">
              <span className="label">Specializations</span>
              <div className="spec-badges">
                {selectedStaff.specialization.map((spec, i) => (
                  <Badge key={i} variant="primary">{spec}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StaffManagement;