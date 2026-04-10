// BatchManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiUsers, FiFilter,
  FiAlertCircle, FiCheck, FiInfo, FiAlertTriangle,
  FiCalendar, FiGrid, FiRefreshCw, FiLayers
} from 'react-icons/fi';
import Modal   from '../../components/common/Modal';
import Button  from '../../components/common/Button';
import Badge   from '../../components/common/Badge';
import Table   from '../../components/common/Table';
import { adminAPI } from '../../services/api';
import {
  SPECIALIZATIONS, YEARS, SEMESTERS, BATCH_TYPES
} from '../../utils/constants';
import { generateBatchCode } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './BatchManagement.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const RULES = {
  year:           { required: true, validate: v => (!v ? 'Year is required' : null) },
  semester:       { required: true, validate: v => (!v ? 'Semester is required' : null) },
  type:           { required: true, validate: v => (!v ? 'Batch type is required' : null) },
  specialization: { required: true, validate: v => (!v ? 'Specialization is required' : null) },
  mainGroup: {
    required: true,
    validate: v => {
      if (!v)           return 'Main group is required';
      if (!/^\d{2}$/.test(v)) return 'Must be exactly 2 digits (e.g. 01)';
      const n = parseInt(v, 10);
      if (n < 1 || n > 99) return 'Must be between 01 – 99';
      return null;
    }
  },
  subGroup: {
    required: true,
    validate: v => {
      if (!v)           return 'Sub group is required';
      if (!/^\d{2}$/.test(v)) return 'Must be exactly 2 digits (e.g. 01)';
      const n = parseInt(v, 10);
      if (n < 1 || n > 99) return 'Must be between 01 – 99';
      return null;
    }
  },
  studentCount: {
    required: true,
    validate: v => {
      const n = parseInt(v, 10);
      if (!v && v !== 0) return 'Student count is required';
      if (isNaN(n))     return 'Must be a number';
      if (n < 1)        return 'Minimum 1 student';
      if (n > 500)      return 'Maximum 500 students';
      return null;
    }
  }
};

const BLANK_FORM = {
  year: 1, semester: 1, type: 'WD',
  specialization: 'IT', mainGroup: '01', subGroup: '01', studentCount: 30
};

const BLANK_ERRORS  = Object.fromEntries([
  ...Object.keys(RULES).map(k => [k, '']), ['general', ''], ['batchCode', '']
]);
const BLANK_TOUCHED = Object.fromEntries(Object.keys(RULES).map(k => [k, false]));

// ─── Small reusable field components ─────────────────────────────────────────

const FieldWrap = ({ name, label, required, error, touched, success, hint, children }) => {
  const showErr = touched && error;
  const showOk  = touched && !error && success;
  return (
    <div className={`bm-field ${showErr ? 'is-error' : ''} ${showOk ? 'is-success' : ''}`}>
      {label && (
        <label htmlFor={name}>
          {label}{required && <span className="bm-required"> *</span>}
        </label>
      )}
      {children}
      {showErr && (
        <span className="bm-field-error">
          <FiAlertCircle size={11} /> {error}
        </span>
      )}
      {hint && !showErr && (
        <span className="bm-field-hint">
          <FiInfo size={11} /> {hint}
        </span>
      )}
    </div>
  );
};

const BMInput = ({ name, label, type = 'text', value, onChange, onBlur,
                   error, touched, required, hint, min, max, maxLength, placeholder }) => {
  const showErr = touched && error;
  const showOk  = touched && !error && String(value) !== '';
  return (
    <FieldWrap name={name} label={label} required={required}
               error={error} touched={touched} success={showOk} hint={hint}>
      <div className="bm-input-wrap">
        <input
          id={name} name={name} type={type}
          value={value} onChange={onChange} onBlur={onBlur}
          placeholder={placeholder} min={min} max={max} maxLength={maxLength}
          className={`bm-input ${showErr ? 'is-error' : ''} ${showOk ? 'is-success' : ''}`}
        />
        {showErr && <FiAlertCircle className="bm-input-icon bm-input-icon--error" size={15} />}
        {showOk  && <FiCheck       className="bm-input-icon bm-input-icon--success" size={15} />}
      </div>
    </FieldWrap>
  );
};

const BMSelect = ({ name, label, value, onChange, onBlur, options = [],
                    error, touched, required, placeholder }) => {
  const showErr = touched && error;
  const showOk  = touched && !error && String(value) !== '';
  return (
    <FieldWrap name={name} label={label} required={required}
               error={error} touched={touched} success={showOk}>
      <div className="bm-input-wrap">
        <select
          id={name} name={name} value={value}
          onChange={onChange} onBlur={onBlur}
          className={`bm-field-select ${showErr ? 'is-error' : ''} ${showOk ? 'is-success' : ''}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o, i) => (
            <option key={o.value ?? i} value={o.value}>{o.label}</option>
          ))}
        </select>
        {showErr && <FiAlertCircle className="bm-input-icon bm-input-icon--error" size={15} />}
        {showOk  && <FiCheck       className="bm-input-icon bm-input-icon--success" size={15} />}
      </div>
    </FieldWrap>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const FormProgress = ({ formData, errors }) => {
  const fields  = Object.keys(RULES);
  const valid   = fields.filter(f => !errors[f] && String(formData[f]) !== '').length;
  const pct     = Math.round((valid / fields.length) * 100);
  const done    = pct === 100;
  return (
    <div className="bm-progress">
      <div className="bm-progress__head">
        <span>Form Completion</span>
        <span className="bm-progress__pct">{pct}%</span>
      </div>
      <div className="bm-progress__track">
        <div
          className={`bm-progress__fill ${done ? 'bm-progress__fill--done' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="bm-progress__sub">{valid} of {fields.length} fields valid</span>
    </div>
  );
};

// ─── Code Preview ─────────────────────────────────────────────────────────────

const CodePreview = ({ formData, isValid, isDuplicate }) => {
  const code = generateBatchCode(
    formData.year, formData.semester, formData.type,
    formData.specialization, formData.mainGroup, formData.subGroup
  );
  return (
    <div className={`bm-preview ${isDuplicate ? 'bm-preview--duplicate' : isValid ? 'bm-preview--valid' : ''}`}>
      <div className="bm-preview__head">
        <span className="bm-preview__label">Batch Code Preview</span>
        {isValid && !isDuplicate && (
          <span className="bm-preview__badge"><FiCheck size={12} /> Valid</span>
        )}
        {isDuplicate && (
          <span className="bm-preview__badge"><FiAlertTriangle size={12} /> Duplicate</span>
        )}
      </div>
      <span className="bm-preview__code">{code}</span>
      <div className="bm-preview__parts">
        {[
          { v: `Y${formData.year}`,         t: 'Year' },
          { v: `S${formData.semester}`,     t: 'Semester' },
          { v: formData.type,               t: 'Type' },
          { v: formData.specialization,     t: 'Specialization' },
          { v: formData.mainGroup || '??',  t: 'Main Group' },
          { v: formData.subGroup  || '??',  t: 'Sub Group' }
        ].map((p, i, arr) => (
          <React.Fragment key={i}>
            <span className="bm-preview__part" title={p.t}>{p.v}</span>
            {i < arr.length - 1 && <span className="bm-preview__sep">.</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ─── Format Guide ─────────────────────────────────────────────────────────────

const FormatGuide = ({ formData }) => {
  const segs = [
    { seg: `Y${formData.year}`,       label: 'Year'  },
    { seg: `S${formData.semester}`,   label: 'Sem'   },
    { seg: formData.type,             label: 'Type'  },
    { seg: formData.specialization,   label: 'Spec'  },
    { seg: formData.mainGroup||'??',  label: 'Main'  },
    { seg: formData.subGroup ||'??',  label: 'Sub'   }
  ];
  return (
    <div className="bm-format-guide">
      <div className="bm-format-guide__title">
        <FiInfo size={13} /> Batch Code Format
      </div>
      <div className="bm-format-guide__parts">
        {segs.map((s, i, arr) => (
          <React.Fragment key={i}>
            <div className="bm-format-guide__item">
              <span className="bm-format-guide__seg">{s.seg}</span>
              <span className="bm-format-guide__seg-label">{s.label}</span>
            </div>
            {i < arr.length - 1 && <span className="bm-format-guide__dot">.</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BatchManagement = () => {

  // ── state ─────────────────────────────────────────────────────────────────
  const [batches,    setBatches]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filters,    setFilters]    = useState({ year:'', semester:'', type:'', specialization:'' });

  const [showAdd,    setShowAdd]    = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected,   setSelected]   = useState(null);

  const [form,       setForm]       = useState(BLANK_FORM);
  const [errors,     setErrors]     = useState(BLANK_ERRORS);
  const [touched,    setTouched]    = useState(BLANK_TOUCHED);
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [isDup,      setIsDup]      = useState(false);

  // ── stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:         batches.length,
    weekday:       batches.filter(b => b.type === 'WD').length,
    weekend:       batches.filter(b => b.type === 'WE').length,
    totalStudents: batches.reduce((s, b) => s + (b.studentCount || 0), 0)
  }), [batches]);

  // ── computed: is form valid? ──────────────────────────────────────────────
  const formValid = useMemo(() => {
    const hasError = Object.keys(RULES).some(f => {
      const err = RULES[f].validate(form[f]);
      return !!err;
    });
    return !hasError && !isDup;
  }, [form, isDup]);

  // ── fetch batches ─────────────────────────────────────────────────────────
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getBatches(filters);
      setBatches(res.data.data || []);
    } catch {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  // ── duplicate check ───────────────────────────────────────────────────────
  useEffect(() => {
    const code = generateBatchCode(
      form.year, form.semester, form.type,
      form.specialization, form.mainGroup, form.subGroup
    );
    const dup = batches.some(b =>
      b.batchCode === code && (!selected || b._id !== selected._id)
    );
    setIsDup(dup);
    setErrors(prev => ({ ...prev, batchCode: dup ? 'This batch code already exists' : '' }));
  }, [form, batches, selected]);

  // ── field validation ──────────────────────────────────────────────────────
  const validateField = useCallback((name, value) => {
    const rule = RULES[name];
    if (!rule) return '';
    return rule.validate(value) || '';
  }, []);

  const validateAll = useCallback(() => {
    const newErrors = { ...BLANK_ERRORS };
    let ok = true;
    Object.keys(RULES).forEach(f => {
      const err = validateField(f, form[f]);
      newErrors[f] = err;
      if (err) ok = false;
    });
    if (isDup) { newErrors.batchCode = 'This batch code already exists'; ok = false; }
    setErrors(newErrors);
    setTouched(Object.fromEntries(Object.keys(RULES).map(k => [k, true])));
    return ok;
  }, [form, validateField, isDup]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleChange = e => {
    let { name, value } = e.target;

    // strip non-digits for group fields
    if (name === 'mainGroup' || name === 'subGroup') {
      value = value.replace(/\D/g, '').slice(0, 2);
    }
    // coerce numeric selects
    if (['year','semester','studentCount'].includes(name)) {
      value = value === '' ? '' : (parseInt(value, 10) || value);
    }

    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    // auto-pad groups
    if ((name === 'mainGroup' || name === 'subGroup') && /^\d$/.test(value)) {
      setForm(prev => ({ ...prev, [name]: value.padStart(2, '0') }));
    }
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const resetForm = () => {
    setForm(BLANK_FORM);
    setErrors(BLANK_ERRORS);
    setTouched(BLANK_TOUCHED);
    setSelected(null);
    setIsDup(false);
  };

  const closeModal = () => {
    setShowAdd(false);
    setShowEdit(false);
    resetForm();
  };

  const openAdd = () => {
    resetForm();
    setShowAdd(true);
  };

  const openEdit = batch => {
    setSelected(batch);
    setForm({
      year:           batch.year,
      semester:       batch.semester,
      type:           batch.type,
      specialization: batch.specialization,
      mainGroup:      batch.mainGroup,
      subGroup:       batch.subGroup,
      studentCount:   batch.studentCount
    });
    setErrors(BLANK_ERRORS);
    setTouched(BLANK_TOUCHED);
    setShowEdit(true);
  };

  const openDelete = batch => {
    setSelected(batch);
    setShowDelete(true);
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e?.preventDefault();
    if (!validateAll()) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setSubmitting(true);
    const batchCode = generateBatchCode(
      form.year, form.semester, form.type,
      form.specialization, form.mainGroup, form.subGroup
    );
    const payload = { batchCode, ...form };

    try {
      if (selected) {
        await adminAPI.updateBatch(selected._id, payload);
        toast.success('Batch updated successfully! ✓');
        setShowEdit(false);
      } else {
        await adminAPI.createBatch(payload);
        toast.success('Batch created successfully! ✓');
        setShowAdd(false);
      }
      resetForm();
      fetchBatches();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      setErrors(prev => ({ ...prev, general: msg }));
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await adminAPI.deleteBatch(selected._id);
      toast.success('Batch deleted successfully');
      setShowDelete(false);
      setSelected(null);
      fetchBatches();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete batch';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'batchCode',
      title: 'Batch Code',
      render: code => <span className="bm-batch-code">{code}</span>
    },
    {
      key: 'year',
      title: 'Year',
      width: '80px',
      render: y => <Badge variant="primary">Y{y}</Badge>
    },
    {
      key: 'semester',
      title: 'Semester',
      width: '100px',
      render: s => <Badge variant="neutral">S{s}</Badge>
    },
    {
      key: 'type',
      title: 'Type',
      width: '110px',
      render: t => (
        <Badge variant={t === 'WD' ? 'success' : 'warning'}>
          {t === 'WD' ? 'Weekday' : 'Weekend'}
        </Badge>
      )
    },
    {
      key: 'specialization',
      title: 'Specialization',
      width: '130px',
      render: s => <Badge variant="primary">{s}</Badge>
    },
    {
      key: 'mainGroup',
      title: 'Group',
      width: '90px',
      render: (m, row) => `${m}.${row.subGroup}`
    },
    {
      key: 'studentCount',
      title: 'Students',
      width: '110px',
      render: c => (
        <div className="bm-student-count">
          <FiUsers size={13} /> {c}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '100px',
      render: (_, row) => (
        <div className="bm-actions">
          <button
            className="bm-action-btn bm-action-btn--edit"
            onClick={() => openEdit(row)}
            title="Edit batch"
          >
            <FiEdit2 size={15} />
          </button>
          <button
            className="bm-action-btn bm-action-btn--delete"
            onClick={() => openDelete(row)}
            title="Delete batch"
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  // ── Form JSX (shared between Add/Edit) ────────────────────────────────────
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="bm-form" noValidate>

      <FormProgress formData={form} errors={errors} />

      {errors.general && (
        <div className="bm-alert bm-alert--error">
          <FiAlertCircle className="bm-alert-icon" size={16} />
          <span>{errors.general}</span>
        </div>
      )}

      <CodePreview formData={form} isValid={formValid} isDuplicate={isDup} />

      {isDup && (
        <div className="bm-alert bm-alert--warning">
          <FiAlertTriangle className="bm-alert-icon" size={16} />
          <span>
            This batch code already exists. Adjust the values to make it unique.
          </span>
        </div>
      )}

      {/* Year & Semester */}
      <div className="bm-form-grid">
        <BMSelect
          name="year" label="Year" required
          options={YEARS} value={form.year}
          onChange={handleChange} onBlur={handleBlur}
          error={errors.year} touched={touched.year}
          placeholder="Select year"
        />
        <BMSelect
          name="semester" label="Semester" required
          options={SEMESTERS} value={form.semester}
          onChange={handleChange} onBlur={handleBlur}
          error={errors.semester} touched={touched.semester}
          placeholder="Select semester"
        />
      </div>

      {/* Type & Specialization */}
      <div className="bm-form-grid">
        <BMSelect
          name="type" label="Batch Type" required
          options={BATCH_TYPES} value={form.type}
          onChange={handleChange} onBlur={handleBlur}
          error={errors.type} touched={touched.type}
          placeholder="Select type"
        />
        <BMSelect
          name="specialization" label="Specialization" required
          options={SPECIALIZATIONS} value={form.specialization}
          onChange={handleChange} onBlur={handleBlur}
          error={errors.specialization} touched={touched.specialization}
          placeholder="Select specialization"
        />
      </div>

      {/* Main Group & Sub Group */}
      <div className="bm-form-grid">
        <BMInput
          name="mainGroup" label="Main Group" required
          placeholder="e.g. 01" value={form.mainGroup}
          onChange={handleChange} onBlur={handleBlur}
          error={errors.mainGroup} touched={touched.mainGroup}
          maxLength={2} hint="2 digits, 01 – 99"
        />
        <BMInput
          name="subGroup" label="Sub Group" required
          placeholder="e.g. 01" value={form.subGroup}
          onChange={handleChange} onBlur={handleBlur}
          error={errors.subGroup} touched={touched.subGroup}
          maxLength={2} hint="2 digits, 01 – 99"
        />
      </div>

      {/* Student Count */}
      <BMInput
        name="studentCount" label="Number of Students" type="number"
        required min={1} max={500}
        value={form.studentCount}
        onChange={handleChange} onBlur={handleBlur}
        error={errors.studentCount} touched={touched.studentCount}
        hint="Between 1 – 500 students"
      />

      <FormatGuide formData={form} />

      {/* Summary when ready */}
      {formValid && (
        <div className="bm-summary">
          <div className="bm-summary__title">
            <FiCheck size={15} /> Ready to {selected ? 'Update' : 'Create'}
          </div>
          <div className="bm-summary__grid">
            <div className="bm-summary__item">
              <span className="bm-summary__item-label">Batch Code</span>
              <span className="bm-summary__item-value">
                <span className="bm-summary__code">
                  {generateBatchCode(
                    form.year, form.semester, form.type,
                    form.specialization, form.mainGroup, form.subGroup
                  )}
                </span>
              </span>
            </div>
            <div className="bm-summary__item">
              <span className="bm-summary__item-label">Students</span>
              <span className="bm-summary__item-value">{form.studentCount}</span>
            </div>
            <div className="bm-summary__item">
              <span className="bm-summary__item-label">Type</span>
              <span className="bm-summary__item-value">
                {form.type === 'WD' ? 'Weekday' : 'Weekend'}
              </span>
            </div>
            <div className="bm-summary__item">
              <span className="bm-summary__item-label">Specialization</span>
              <span className="bm-summary__item-value">{form.specialization}</span>
            </div>
          </div>
        </div>
      )}
    </form>
  );

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="batch-management">

      {/* Header */}
      <div className="bm-page-header">
        <div className="bm-page-header__text">
          <h2>Batch Management</h2>
          <p>Manage student batches and groups for SLIIT Computing Faculty</p>
        </div>
        <div className="bm-header-actions">
          <Button variant="ghost" icon={<FiRefreshCw />} onClick={fetchBatches}>
            Refresh
          </Button>
          <Button variant="primary" icon={<FiPlus />} onClick={openAdd}>
            Add Batch
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="bm-stats-row">
        {[
          { icon: <FiGrid size={20} />,     cls: 'bm-stat-icon--blue',   val: stats.total,         lbl: 'Total Batches'   },
          { icon: <FiCalendar size={20} />, cls: 'bm-stat-icon--green',  val: stats.weekday,       lbl: 'Weekday Batches' },
          { icon: <FiCalendar size={20} />, cls: 'bm-stat-icon--amber',  val: stats.weekend,       lbl: 'Weekend Batches' },
          { icon: <FiUsers size={20} />,    cls: 'bm-stat-icon--purple', val: stats.totalStudents, lbl: 'Total Students'  }
        ].map((s, i) => (
          <div key={i} className="bm-stat-card">
            <div className={`bm-stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="bm-stat-content">
              <span className="bm-stat-value">{s.val.toLocaleString()}</span>
              <span className="bm-stat-label">{s.lbl}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bm-filters">
        <div className="bm-filters__title">
          <FiFilter size={13} /> Filter Batches
        </div>
        <div className="bm-filters__row">
          {[
            { key: 'year',           opts: YEARS,            ph: 'All Years'           },
            { key: 'semester',       opts: SEMESTERS,        ph: 'All Semesters'       },
            { key: 'type',           opts: BATCH_TYPES,      ph: 'All Types'           },
            { key: 'specialization', opts: SPECIALIZATIONS,  ph: 'All Specializations' }
          ].map(f => (
            <div key={f.key} className="bm-field">
              <label htmlFor={`filter-${f.key}`}>
                {f.key.charAt(0).toUpperCase() + f.key.slice(1)}
              </label>
              <select
                id={`filter-${f.key}`}
                className="bm-select"
                value={filters[f.key]}
                onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
              >
                <option value="">{f.ph}</option>
                {f.opts.map((o, i) => (
                  <option key={o.value ?? i} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}
          <div>
            <Button
              variant="ghost"
              onClick={() => setFilters({ year:'', semester:'', type:'', specialization:'' })}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bm-table-card">
        <div className="bm-table-header">
          <div className="bm-table-header__info">
            <h3>All Batches</h3>
            <span>{batches.length} batch{batches.length !== 1 ? 'es' : ''} found</span>
          </div>
        </div>
        <div className="bm-table-wrap">
          <Table
            columns={columns}
            data={batches}
            loading={loading}
            emptyMessage={
              <div className="bm-empty">
                <div className="bm-empty__icon"><FiLayers size={28} /></div>
                <h3>No batches found</h3>
                <p>No batches match your current filters.</p>
                <Button variant="primary" icon={<FiPlus />} onClick={openAdd}>
                  Add First Batch
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {/* ── Add Modal ───────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showAdd}
        onClose={closeModal}
        title="Add New Batch"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!formValid || submitting}
            >
              {submitting ? 'Creating…' : 'Create Batch'}
            </Button>
          </>
        }
      >
        {renderForm()}
      </Modal>

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showEdit}
        onClose={closeModal}
        title="Edit Batch"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!formValid || submitting}
            >
              {submitting ? 'Updating…' : 'Update Batch'}
            </Button>
          </>
        }
      >
        {renderForm()}
      </Modal>

      {/* ── Delete Modal ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setSelected(null); }}
        title="Delete Batch"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setShowDelete(false); setSelected(null); }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
            >
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </Button>
          </>
        }
      >
        <div className="bm-delete-modal">
          <div className="bm-delete-modal__icon">
            <FiAlertTriangle size={28} />
          </div>
          <h3 className="bm-delete-modal__title">Delete this batch?</h3>
          <p className="bm-delete-modal__sub">
            This will permanently remove the batch from the system.
          </p>
          {selected && (
            <div className="bm-delete-target">
              <span className="bm-delete-target__code">{selected.batchCode}</span>
              <span className="bm-delete-target__meta">
                {selected.studentCount} student{selected.studentCount !== 1 ? 's' : ''} assigned
              </span>
            </div>
          )}
          <p className="bm-delete-modal__warning">⚠ This action cannot be undone.</p>
        </div>
      </Modal>

    </div>
  );
};

export default BatchManagement;