// BatchManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiUsers,
  FiFilter, FiDownload, FiCalendar, FiAlertCircle,
  FiCheck, FiInfo, FiX, FiAlertTriangle
} from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { adminAPI } from '../../services/api';
import { 
  SPECIALIZATIONS, YEARS, SEMESTERS, BATCH_TYPES 
} from '../../utils/constants';
import { generateBatchCode } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './BatchManagement.css';

// Validation Rules
const VALIDATION_RULES = {
  year: {
    required: true,
    message: 'Please select a year',
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 4) {
        return 'Year must be between 1 and 4';
      }
      return null;
    }
  },
  semester: {
    required: true,
    message: 'Please select a semester',
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 2) {
        return 'Semester must be 1 or 2';
      }
      return null;
    }
  },
  type: {
    required: true,
    message: 'Please select a batch type'
  },
  specialization: {
    required: true,
    message: 'Please select a specialization'
  },
  mainGroup: {
    required: true,
    message: 'Main group is required',
    pattern: /^\d{2}$/,
    patternMessage: 'Main group must be exactly 2 digits (e.g., 01)',
    validate: (value) => {
      if (!value) return 'Main group is required';
      if (!/^\d{2}$/.test(value)) return 'Must be exactly 2 digits';
      const num = parseInt(value);
      if (num < 1 || num > 99) return 'Must be between 01 and 99';
      return null;
    }
  },
  subGroup: {
    required: true,
    message: 'Sub group is required',
    pattern: /^\d{2}$/,
    patternMessage: 'Sub group must be exactly 2 digits (e.g., 01)',
    validate: (value) => {
      if (!value) return 'Sub group is required';
      if (!/^\d{2}$/.test(value)) return 'Must be exactly 2 digits';
      const num = parseInt(value);
      if (num < 1 || num > 99) return 'Must be between 01 and 99';
      return null;
    }
  },
  studentCount: {
    required: true,
    message: 'Student count is required',
    min: 1,
    max: 500,
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num)) return 'Student count must be a number';
      if (num < 1) return 'Minimum 1 student required';
      if (num > 500) return 'Maximum 500 students allowed';
      return null;
    }
  }
};

// Initial States
const INITIAL_FORM_DATA = {
  year: 1,
  semester: 1,
  type: 'WD',
  specialization: 'IT',
  mainGroup: '01',
  subGroup: '01',
  studentCount: 30
};

const INITIAL_ERRORS = {
  year: '',
  semester: '',
  type: '',
  specialization: '',
  mainGroup: '',
  subGroup: '',
  studentCount: '',
  batchCode: '',
  general: ''
};

const INITIAL_TOUCHED = {
  year: false,
  semester: false,
  type: false,
  specialization: false,
  mainGroup: false,
  subGroup: false,
  studentCount: false
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
  maxLength
}) => {
  const showError = touched && error;
  const showSuccess = touched && !error && value !== '';

  return (
    <div className={`form-group ${showError ? 'has-error' : ''} ${showSuccess ? 'has-success' : ''}`}>
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

// Form Progress Component
const FormProgress = ({ formData, requiredFields, errors }) => {
  const validFields = requiredFields.filter(field => {
    const value = formData[field];
    const hasError = errors[field];
    const hasValue = value !== '' && value !== null && value !== undefined;
    return hasValue && !hasError;
  }).length;
  
  const percentage = Math.round((validFields / requiredFields.length) * 100);

  return (
    <div className="form-progress">
      <div className="progress-header">
        <span className="progress-label">Form Completion</span>
        <span className="progress-percentage">{percentage}%</span>
      </div>
      <div className="progress-track">
        <div 
          className={`progress-fill ${percentage === 100 ? 'complete' : ''}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="progress-text">{validFields} of {requiredFields.length} fields completed</span>
    </div>
  );
};

// Batch Code Preview Component
const BatchCodePreview = ({ formData, isValid, isDuplicate }) => {
  const batchCode = generateBatchCode(
    formData.year,
    formData.semester,
    formData.type,
    formData.specialization,
    formData.mainGroup,
    formData.subGroup
  );

  return (
    <div className={`batch-preview ${isDuplicate ? 'duplicate' : ''} ${isValid ? 'valid' : ''}`}>
      <div className="preview-header">
        <span className="preview-label">Batch Code Preview</span>
        {isValid && !isDuplicate && (
          <span className="preview-status valid">
            <FiCheck size={14} /> Valid
          </span>
        )}
        {isDuplicate && (
          <span className="preview-status duplicate">
            <FiAlertTriangle size={14} /> Already Exists
          </span>
        )}
      </div>
      <span className="preview-code">{batchCode}</span>
      <div className="preview-breakdown">
        <span className="code-part" title="Year">Y{formData.year}</span>
        <span className="code-separator">.</span>
        <span className="code-part" title="Semester">S{formData.semester}</span>
        <span className="code-separator">.</span>
        <span className="code-part" title="Type">{formData.type}</span>
        <span className="code-separator">.</span>
        <span className="code-part" title="Specialization">{formData.specialization}</span>
        <span className="code-separator">.</span>
        <span className="code-part" title="Main Group">{formData.mainGroup || '??'}</span>
        <span className="code-separator">.</span>
        <span className="code-part" title="Sub Group">{formData.subGroup || '??'}</span>
      </div>
    </div>
  );
};

// Main Component
const BatchManagement = () => {
  // Data State
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: '',
    semester: '',
    type: '',
    specialization: ''
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [submitting, setSubmitting] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const [isDuplicateBatchCode, setIsDuplicateBatchCode] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    weekday: 0,
    weekend: 0,
    totalStudents: 0
  });

  // Fetch batches
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getBatches(filters);
      const batchData = response.data.data || [];
      
      setBatches(batchData);
      
      // Calculate stats
      setStats({
        total: batchData.length,
        weekday: batchData.filter(b => b.type === 'WD').length,
        weekend: batchData.filter(b => b.type === 'WE').length,
        totalStudents: batchData.reduce((sum, b) => sum + (b.studentCount || 0), 0)
      });
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Validate form on data change
  useEffect(() => {
    const isValid = validateFormSilent();
    setFormValid(isValid && !isDuplicateBatchCode);
  }, [formData, isDuplicateBatchCode]);

  // Check for duplicate batch code
  useEffect(() => {
    const currentBatchCode = generateBatchCode(
      formData.year,
      formData.semester,
      formData.type,
      formData.specialization,
      formData.mainGroup,
      formData.subGroup
    );

    const exists = batches.some(batch => 
      batch.batchCode === currentBatchCode && 
      (!selectedBatch || batch._id !== selectedBatch._id)
    );

    setIsDuplicateBatchCode(exists);
    
    if (exists) {
      setErrors(prev => ({ ...prev, batchCode: 'This batch code already exists' }));
    } else {
      setErrors(prev => ({ ...prev, batchCode: '' }));
    }
  }, [formData, batches, selectedBatch]);

  // Validation Functions
  const validateField = useCallback((name, value) => {
    const rule = VALIDATION_RULES[name];
    if (!rule) return '';

    // Required check
    if (rule.required && (value === '' || value === null || value === undefined)) {
      return rule.message;
    }

    // Pattern check
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

    // Check duplicate
    if (isDuplicateBatchCode) {
      newErrors.batchCode = 'This batch code already exists';
      isValid = false;
    }

    setErrors(newErrors);
    setTouched(Object.keys(INITIAL_TOUCHED).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));

    return isValid;
  }, [formData, validateField, isDuplicateBatchCode]);

  // Event Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Auto-format group inputs to 2 digits
    if ((name === 'mainGroup' || name === 'subGroup') && value.length <= 2) {
      processedValue = value.replace(/\D/g, '');
    }

    // Convert numeric fields
    if (name === 'year' || name === 'semester' || name === 'studentCount') {
      processedValue = value === '' ? '' : parseInt(value) || value;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));

    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Auto-pad group numbers
    if ((name === 'mainGroup' || name === 'subGroup') && value.length === 1) {
      setFormData(prev => ({ ...prev, [name]: value.padStart(2, '0') }));
    }

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

    if (isDuplicateBatchCode) {
      toast.error('This batch code already exists');
      return;
    }

    setSubmitting(true);

    try {
      const batchCode = generateBatchCode(
        formData.year,
        formData.semester,
        formData.type,
        formData.specialization,
        formData.mainGroup,
        formData.subGroup
      );

      const payload = {
        batchCode,
        year: formData.year,
        semester: formData.semester,
        type: formData.type,
        specialization: formData.specialization,
        mainGroup: formData.mainGroup,
        subGroup: formData.subGroup,
        studentCount: formData.studentCount
      };

      if (selectedBatch) {
        await adminAPI.updateBatch(selectedBatch._id, payload);
        toast.success('Batch updated successfully');
        setShowEditModal(false);
      } else {
        await adminAPI.createBatch(payload);
        toast.success('Batch created successfully');
        setShowAddModal(false);
      }

      resetForm();
      fetchBatches();
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      setErrors(prev => ({ ...prev, general: message }));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedBatch) return;

    setDeleting(true);

    try {
      await adminAPI.deleteBatch(selectedBatch._id);
      toast.success('Batch deleted successfully');
      setShowDeleteModal(false);
      setSelectedBatch(null);
      fetchBatches();
    } catch (error) {
      toast.error('Failed to delete batch');
    } finally {
      setDeleting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors(INITIAL_ERRORS);
    setTouched(INITIAL_TOUCHED);
    setSelectedBatch(null);
    setIsDuplicateBatchCode(false);
  };

  // Close modal
  const closeFormModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  // Open edit modal
  const openEditModal = (batch) => {
    setSelectedBatch(batch);
    setFormData({
      year: batch.year,
      semester: batch.semester,
      type: batch.type,
      specialization: batch.specialization,
      mainGroup: batch.mainGroup,
      subGroup: batch.subGroup,
      studentCount: batch.studentCount
    });
    setErrors(INITIAL_ERRORS);
    setTouched(INITIAL_TOUCHED);
    setShowEditModal(true);
  };

  // Table columns
  const columns = [
    {
      key: 'batchCode',
      title: 'Batch Code',
      render: (code) => (
        <span className="batch-code">{code}</span>
      )
    },
    {
      key: 'year',
      title: 'Year',
      width: '80px',
      render: (year) => <Badge variant="primary">Y{year}</Badge>
    },
    {
      key: 'semester',
      title: 'Semester',
      width: '100px',
      render: (sem) => <Badge variant="neutral">S{sem}</Badge>
    },
    {
      key: 'type',
      title: 'Type',
      width: '100px',
      render: (type) => (
        <Badge variant={type === 'WD' ? 'success' : 'warning'}>
          {type === 'WD' ? 'Weekday' : 'Weekend'}
        </Badge>
      )
    },
    {
      key: 'specialization',
      title: 'Specialization',
      width: '120px',
      render: (spec) => (
        <Badge variant="primary">{spec}</Badge>
      )
    },
    {
      key: 'mainGroup',
      title: 'Group',
      width: '100px',
      render: (main, row) => `${main}.${row.subGroup}`
    },
    {
      key: 'studentCount',
      title: 'Students',
      width: '100px',
      render: (count) => (
        <div className="student-count">
          <FiUsers size={14} />
          <span>{count}</span>
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
            onClick={() => { setSelectedBatch(row); setShowDeleteModal(true); }}
            title="Delete"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const requiredFields = ['year', 'semester', 'type', 'specialization', 'mainGroup', 'subGroup', 'studentCount'];

  return (
    <div className="batch-management">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Batch Management</h2>
          <p>Manage student batches and groups for SLIIT Computing Faculty</p>
        </div>
        <div className="header-actions">
          <Button 
            variant="primary" 
            icon={<FiPlus />}
            onClick={() => { resetForm(); setShowAddModal(true); }}
          >
            Add Batch
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="mini-stat">
          <div className="mini-stat-icon primary">
            <FiCalendar size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">{stats.total}</span>
            <span className="label">Total Batches</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon success">
            <FiCalendar size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">{stats.weekday}</span>
            <span className="label">Weekday</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon warning">
            <FiCalendar size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">{stats.weekend}</span>
            <span className="label">Weekend</span>
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-icon error">
            <FiUsers size={20} />
          </div>
          <div className="mini-stat-content">
            <span className="value">{stats.totalStudents}</span>
            <span className="label">Total Students</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <CardBody>
          <div className="filters-row">
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
              placeholder="All Types"
              options={BATCH_TYPES}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            />
            <Select
              placeholder="All Specializations"
              options={SPECIALIZATIONS}
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
            />
            <Button 
              variant="ghost" 
              onClick={() => setFilters({ year: '', semester: '', type: '', specialization: '' })}
            >
              Clear Filters
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Batches Table */}
      <Card>
        <Table
          columns={columns}
          data={batches}
          loading={loading}
          emptyMessage="No batches found"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={closeFormModal}
        title={selectedBatch ? 'Edit Batch' : 'Add New Batch'}
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
                ? (selectedBatch ? 'Updating...' : 'Creating...') 
                : (selectedBatch ? 'Update Batch' : 'Create Batch')
              }
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="batch-form" noValidate>
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

          {/* Batch Code Preview */}
          <BatchCodePreview 
            formData={formData}
            isValid={formValid}
            isDuplicate={isDuplicateBatchCode}
          />

          {/* Duplicate Warning */}
          {isDuplicateBatchCode && (
            <div className="alert alert-warning">
              <FiAlertTriangle />
              <span>This batch code already exists. Please modify the values to create a unique batch.</span>
            </div>
          )}

          {/* Year & Semester */}
          <div className="form-grid">
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
              placeholder="Select year"
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
              placeholder="Select semester"
            />
          </div>

          {/* Type & Specialization */}
          <div className="form-grid">
            <ValidatedSelect
              label="Batch Type"
              name="type"
              options={BATCH_TYPES}
              value={formData.type}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.type}
              touched={touched.type}
              required
              placeholder="Select type"
            />
            <ValidatedSelect
              label="Specialization"
              name="specialization"
              options={SPECIALIZATIONS}
              value={formData.specialization}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.specialization}
              touched={touched.specialization}
              required
              placeholder="Select specialization"
            />
          </div>

          {/* Main Group & Sub Group */}
          <div className="form-grid">
            <ValidatedInput
              label="Main Group"
              name="mainGroup"
              placeholder="e.g., 01"
              value={formData.mainGroup}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.mainGroup}
              touched={touched.mainGroup}
              required
              maxLength={2}
              hint="2 digits (01-99)"
            />
            <ValidatedInput
              label="Sub Group"
              name="subGroup"
              placeholder="e.g., 01"
              value={formData.subGroup}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.subGroup}
              touched={touched.subGroup}
              required
              maxLength={2}
              hint="2 digits (01-99)"
            />
          </div>

          {/* Student Count */}
          <ValidatedInput
            label="Number of Students"
            name="studentCount"
            type="number"
            min={1}
            max={500}
            value={formData.studentCount}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.studentCount}
            touched={touched.studentCount}
            required
            hint="Between 1 and 500 students"
          />

          {/* Batch Code Format Info */}
          <div className="format-info">
            <h4>
              <FiInfo size={14} />
              Batch Code Format Guide
            </h4>
            <div className="format-breakdown">
              <div className="format-item">
                <span className="format-label">Year</span>
                <span className="format-value">Y{formData.year}</span>
              </div>
              <span className="format-separator">.</span>
              <div className="format-item">
                <span className="format-label">Semester</span>
                <span className="format-value">S{formData.semester}</span>
              </div>
              <span className="format-separator">.</span>
              <div className="format-item">
                <span className="format-label">Type</span>
                <span className="format-value">{formData.type}</span>
              </div>
              <span className="format-separator">.</span>
              <div className="format-item">
                <span className="format-label">Spec</span>
                <span className="format-value">{formData.specialization}</span>
              </div>
              <span className="format-separator">.</span>
              <div className="format-item">
                <span className="format-label">Main</span>
                <span className="format-value">{formData.mainGroup || '??'}</span>
              </div>
              <span className="format-separator">.</span>
              <div className="format-item">
                <span className="format-label">Sub</span>
                <span className="format-value">{formData.subGroup || '??'}</span>
              </div>
            </div>
          </div>

          {/* Form Summary */}
          {formValid && !isDuplicateBatchCode && (
            <div className="form-summary">
              <h4><FiCheck /> Ready to Submit</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Batch Code</span>
                  <span className="summary-value batch-code-summary">
                    {generateBatchCode(
                      formData.year,
                      formData.semester,
                      formData.type,
                      formData.specialization,
                      formData.mainGroup,
                      formData.subGroup
                    )}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Students</span>
                  <span className="summary-value">{formData.studentCount}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Type</span>
                  <span className="summary-value">
                    {formData.type === 'WD' ? 'Weekday' : 'Weekend'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Specialization</span>
                  <span className="summary-value">{formData.specialization}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedBatch(null); }}
        title="Confirm Delete"
        size="sm"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => { setShowDeleteModal(false); setSelectedBatch(null); }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              loading={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Batch'}
            </Button>
          </>
        }
      >
        <div className="delete-warning">
          <FiAlertTriangle className="warning-icon" />
          <p>Are you sure you want to delete this batch?</p>
          {selectedBatch && (
            <div className="delete-target-info">
              <span className="batch-code-delete">{selectedBatch.batchCode}</span>
              <p>{selectedBatch.studentCount} students assigned</p>
            </div>
          )}
          <p className="warning-text">This action cannot be undone.</p>
        </div>
      </Modal>
    </div>
  );
};

export default BatchManagement;