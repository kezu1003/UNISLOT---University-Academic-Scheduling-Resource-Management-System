import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiUsers, FiFilter,
  FiAlertCircle, FiCheck, FiInfo, FiAlertTriangle,
  FiCalendar, FiGrid, FiRefreshCw, FiLayers,
  FiHash, FiBookOpen, FiClock
} from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import { adminAPI } from '../../services/api';
import {
  SPECIALIZATIONS, YEARS, SEMESTERS, BATCH_TYPES
} from '../../utils/constants';
import { generateBatchCode } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './BatchManagement.css';

/* ─── Validation Rules ─────────────────────────────── */
const RULES = {
  year: {
    required: true,
    validate: (v) => {
      if (!v && v !== 0) return 'Year is required';
      const n = parseInt(v);
      if (n < 1 || n > 4) return 'Year must be 1–4';
      return null;
    }
  },
  semester: {
    required: true,
    validate: (v) => {
      if (!v && v !== 0) return 'Semester is required';
      const n = parseInt(v);
      if (n < 1 || n > 2) return 'Semester must be 1 or 2';
      return null;
    }
  },
  type: {
    required: true,
    validate: (v) => (!v ? 'Batch type is required' : null)
  },
  specialization: {
    required: true,
    validate: (v) => (!v ? 'Specialization is required' : null)
  },
  mainGroup: {
    required: true,
    validate: (v) => {
      if (!v) return 'Main group is required';
      if (!/^\d{2}$/.test(v)) return 'Must be exactly 2 digits';
      const n = parseInt(v);
      if (n < 1 || n > 99) return 'Must be 01–99';
      return null;
    }
  },
  subGroup: {
    required: true,
    validate: (v) => {
      if (!v) return 'Sub group is required';
      if (!/^\d{2}$/.test(v)) return 'Must be exactly 2 digits';
      const n = parseInt(v);
      if (n < 1 || n > 99) return 'Must be 01–99';
      return null;
    }
  },
  studentCount: {
    required: true,
    validate: (v) => {
      if (!v && v !== 0) return 'Student count is required';
      const n = parseInt(v);
      if (isNaN(n)) return 'Must be a number';
      if (n < 1) return 'Minimum 1 student';
      if (n > 500) return 'Maximum 500 students';
      return null;
    }
  }
};

const BLANK_FORM = {
  year: 1,
  semester: 1,
  type: 'WD',
  specialization: 'IT',
  mainGroup: '01',
  subGroup: '01',
  studentCount: 30
};

const blankErrors = () =>
  Object.fromEntries([
    ...Object.keys(RULES).map((k) => [k, '']),
    ['general', ''],
    ['batchCode', '']
  ]);

const blankTouched = () =>
  Object.fromEntries(Object.keys(RULES).map((k) => [k, false]));

/* ─── Main Component ───────────────────────────────── */
const BatchManagement = () => {
  /* state */
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: '',
    semester: '',
    type: '',
    specialization: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState(blankErrors());
  const [touched, setTouched] = useState(blankTouched());
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDup, setIsDup] = useState(false);

  /* ── stats ─────────────────────────────────── */
  const stats = useMemo(
    () => ({
      total: batches.length,
      weekday: batches.filter((b) => b.type === 'WD').length,
      weekend: batches.filter((b) => b.type === 'WE').length,
      totalStudents: batches.reduce((s, b) => s + (b.studentCount || 0), 0)
    }),
    [batches]
  );

  /* ── formValid ─────────────────────────────── */
  const formValid = useMemo(() => {
    const ok = Object.keys(RULES).every(
      (f) => !RULES[f].validate(form[f])
    );
    return ok && !isDup;
  }, [form, isDup]);

  /* ── progress ──────────────────────────────── */
  const progress = useMemo(() => {
    const fields = Object.keys(RULES);
    const valid = fields.filter(
      (f) => !RULES[f].validate(form[f])
    ).length;
    return Math.round((valid / fields.length) * 100);
  }, [form]);

  /* ── generated code ────────────────────────── */
  const batchCode = useMemo(
    () =>
      generateBatchCode(
        form.year,
        form.semester,
        form.type,
        form.specialization,
        form.mainGroup,
        form.subGroup
      ),
    [form]
  );

  /* ── fetch ─────────────────────────────────── */
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

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  /* ── duplicate check ───────────────────────── */
  useEffect(() => {
    const dup = batches.some(
      (b) => b.batchCode === batchCode && (!selected || b._id !== selected._id)
    );
    setIsDup(dup);
    setErrors((prev) => ({
      ...prev,
      batchCode: dup ? 'This batch code already exists' : ''
    }));
  }, [batchCode, batches, selected]);

  /* ── validate field ────────────────────────── */
  const validateField = useCallback((name, value) => {
    const rule = RULES[name];
    return rule ? rule.validate(value) || '' : '';
  }, []);

  const validateAll = useCallback(() => {
    const newErrors = blankErrors();
    let ok = true;
    Object.keys(RULES).forEach((f) => {
      const err = validateField(f, form[f]);
      newErrors[f] = err;
      if (err) ok = false;
    });
    if (isDup) {
      newErrors.batchCode = 'This batch code already exists';
      ok = false;
    }
    setErrors(newErrors);
    setTouched(
      Object.fromEntries(Object.keys(RULES).map((k) => [k, true]))
    );
    return ok;
  }, [form, validateField, isDup]);

  /* ── handlers ──────────────────────────────── */
  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'mainGroup' || name === 'subGroup') {
      value = value.replace(/\D/g, '').slice(0, 2);
    }
    if (['year', 'semester', 'studentCount'].includes(name)) {
      value = value === '' ? '' : parseInt(value) || value;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (
      (name === 'mainGroup' || name === 'subGroup') &&
      /^\d$/.test(value)
    ) {
      setForm((prev) => ({
        ...prev,
        [name]: value.padStart(2, '0')
      }));
    }
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };

  const resetForm = () => {
    setForm(BLANK_FORM);
    setErrors(blankErrors());
    setTouched(blankTouched());
    setSelected(null);
    setIsDup(false);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (batch) => {
    setSelected(batch);
    setForm({
      year: batch.year,
      semester: batch.semester,
      type: batch.type,
      specialization: batch.specialization,
      mainGroup: batch.mainGroup,
      subGroup: batch.subGroup,
      studentCount: batch.studentCount
    });
    setErrors(blankErrors());
    setTouched(blankTouched());
    setShowModal(true);
  };

  const openDelete = (batch) => {
    setSelected(batch);
    setShowDelete(true);
  };

  /* ── submit ────────────────────────────────── */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateAll()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSubmitting(true);
    const payload = { ...form, batchCode };

    try {
      if (selected) {
        await adminAPI.updateBatch(selected._id, payload);
        toast.success('Batch updated successfully ✓');
      } else {
        await adminAPI.createBatch(payload);
        toast.success('Batch created successfully ✓');
      }
      closeModal();
      fetchBatches();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      setErrors((prev) => ({ ...prev, general: msg }));
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── delete ────────────────────────────────── */
  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await adminAPI.deleteBatch(selected._id);
      toast.success('Batch deleted');
      setShowDelete(false);
      setSelected(null);
      fetchBatches();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  /* ── table columns ─────────────────────────── */
  const columns = [
    {
      key: 'batchCode',
      title: 'Batch Code',
      render: (code) => <span className="bm-code">{code}</span>
    },
    {
      key: 'year',
      title: 'Year',
      width: '80px',
      render: (y) => <Badge variant="primary">Y{y}</Badge>
    },
    {
      key: 'semester',
      title: 'Semester',
      width: '100px',
      render: (s) => <Badge variant="neutral">S{s}</Badge>
    },
    {
      key: 'type',
      title: 'Type',
      width: '110px',
      render: (t) => (
        <Badge variant={t === 'WD' ? 'success' : 'warning'}>
          {t === 'WD' ? 'Weekday' : 'Weekend'}
        </Badge>
      )
    },
    {
      key: 'specialization',
      title: 'Specialization',
      width: '130px',
      render: (s) => <Badge variant="primary">{s}</Badge>
    },
    {
      key: 'mainGroup',
      title: 'Group',
      width: '100px',
      render: (m, row) => (
        <span className="bm-group">
          {m}.{row.subGroup}
        </span>
      )
    },
    {
      key: 'studentCount',
      title: 'Students',
      width: '110px',
      render: (c) => (
        <span className="bm-students">
          <FiUsers size={14} /> {c}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '100px',
      render: (_, row) => (
        <div className="bm-actions">
          <button
            className="bm-act-btn edit"
            onClick={() => openEdit(row)}
            title="Edit"
          >
            <FiEdit2 size={15} />
          </button>
          <button
            className="bm-act-btn delete"
            onClick={() => openDelete(row)}
            title="Delete"
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  /* helper: get field status class */
  const fieldClass = (name) => {
    if (!touched[name]) return '';
    return errors[name] ? 'error' : 'success';
  };

  /* ── code preview parts ────────────────────── */
  const previewParts = [
    { v: `Y${form.year}`, t: 'Year' },
    { v: `S${form.semester}`, t: 'Semester' },
    { v: form.type, t: 'Type' },
    { v: form.specialization, t: 'Spec' },
    { v: form.mainGroup || '??', t: 'Main' },
    { v: form.subGroup || '??', t: 'Sub' }
  ];

  /* ─── RENDER ─────────────────────────────────────── */
  return (
    <div className="batch-management">
      {/* ── Header ─────────────────────────────── */}
      <div className="bm-header">
        <div className="bm-header-left">
          <h2>Batch Management</h2>
          <p>Manage student batches and groups for SLIIT Computing Faculty</p>
        </div>
        <div className="bm-header-right">
          <Button
            variant="ghost"
            icon={<FiRefreshCw />}
            onClick={fetchBatches}
          >
            Refresh
          </Button>
          <Button variant="primary" icon={<FiPlus />} onClick={openAdd}>
            Add Batch
          </Button>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────── */}
      <div className="bm-stats">
        {[
          {
            icon: <FiGrid size={22} />,
            cls: 'blue',
            val: stats.total,
            lbl: 'Total Batches'
          },
          {
            icon: <FiCalendar size={22} />,
            cls: 'green',
            val: stats.weekday,
            lbl: 'Weekday'
          },
          {
            icon: <FiClock size={22} />,
            cls: 'amber',
            val: stats.weekend,
            lbl: 'Weekend'
          },
          {
            icon: <FiUsers size={22} />,
            cls: 'purple',
            val: stats.totalStudents,
            lbl: 'Total Students'
          }
        ].map((s, i) => (
          <div key={i} className="bm-stat-card">
            <div className={`bm-stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="bm-stat-info">
              <span className="bm-stat-value">
                {s.val.toLocaleString()}
              </span>
              <span className="bm-stat-label">{s.lbl}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────── */}
      <div className="bm-filters-card">
        <div className="bm-filters-title">
          <FiFilter size={14} /> Filter Batches
        </div>
        <div className="bm-filters-row">
          {[
            { key: 'year', opts: YEARS, ph: 'All Years' },
            { key: 'semester', opts: SEMESTERS, ph: 'All Semesters' },
            { key: 'type', opts: BATCH_TYPES, ph: 'All Types' },
            {
              key: 'specialization',
              opts: SPECIALIZATIONS,
              ph: 'All Specializations'
            }
          ].map((f) => (
            <div key={f.key} className="bm-filter-group">
              <label>
                {f.key.charAt(0).toUpperCase() + f.key.slice(1)}
              </label>
              <select
                className="bm-filter-select"
                value={filters[f.key]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    [f.key]: e.target.value
                  }))
                }
              >
                <option value="">{f.ph}</option>
                {f.opts.map((o, i) => (
                  <option key={o.value ?? i} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button
            className="bm-filter-clear"
            onClick={() =>
              setFilters({
                year: '',
                semester: '',
                type: '',
                specialization: ''
              })
            }
          >
            Clear All
          </button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────── */}
      <div className="bm-table-card">
        <div className="bm-table-top">
          <h3>All Batches</h3>
          <span>
            {batches.length} batch{batches.length !== 1 ? 'es' : ''}
          </span>
        </div>
        <div className="bm-table-wrap">
          <Table
            columns={columns}
            data={batches}
            loading={loading}
            emptyMessage={
              <div className="bm-empty">
                <div className="bm-empty-icon">
                  <FiLayers size={28} />
                </div>
                <h3>No batches found</h3>
                <p>Get started by creating your first batch</p>
                <Button
                  variant="primary"
                  icon={<FiPlus />}
                  onClick={openAdd}
                >
                  Add First Batch
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ADD / EDIT MODAL
          ══════════════════════════════════════════ */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={selected ? 'Edit Batch' : 'Create New Batch'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeModal}
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
                ? selected
                  ? 'Updating…'
                  : 'Creating…'
                : selected
                ? 'Update Batch'
                : 'Create Batch'}
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleSubmit}
          className="bm-modal-form"
          noValidate
        >
          {/* Progress */}
          <div className="bm-progress">
            <div className="bm-progress-top">
              <span className="label">Form Completion</span>
              <span className="pct">{progress}%</span>
            </div>
            <div className="bm-progress-track">
              <div
                className={`bm-progress-fill ${
                  progress === 100 ? 'done' : ''
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="bm-progress-sub">
              {Object.keys(RULES).filter(
                (f) => !RULES[f].validate(form[f])
              ).length}{' '}
              of {Object.keys(RULES).length} fields valid
            </span>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="bm-alert error">
              <FiAlertCircle size={16} />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Code Preview */}
          <div
            className={`bm-preview ${
              isDup ? 'duplicate' : formValid ? 'valid' : ''
            }`}
          >
            <div className="bm-preview-header">
              <span className="bm-preview-label">
                Batch Code Preview
              </span>
              {formValid && !isDup && (
                <span className="bm-preview-badge">
                  <FiCheck size={12} /> Valid
                </span>
              )}
              {isDup && (
                <span className="bm-preview-badge">
                  <FiAlertTriangle size={12} /> Duplicate
                </span>
              )}
            </div>
            <span className="bm-preview-code">{batchCode}</span>
            <div className="bm-preview-parts">
              {previewParts.map((p, i) => (
                <React.Fragment key={i}>
                  <span className="bm-preview-part" title={p.t}>
                    {p.v}
                  </span>
                  {i < previewParts.length - 1 && (
                    <span className="bm-preview-dot">.</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Duplicate Warning */}
          {isDup && (
            <div className="bm-alert warning">
              <FiAlertTriangle size={16} />
              <span>
                This batch code already exists. Please modify the values
                to create a unique batch.
              </span>
            </div>
          )}

          {/* Year & Semester */}
          <div className="bm-form-grid">
            <div className="bm-field">
              <label className="bm-field-label">
                <FiCalendar className="icon" size={14} />
                Year <span className="req">*</span>
              </label>
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`bm-select ${fieldClass('year')}`}
              >
                <option value="">Select Year</option>
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
              {touched.year && errors.year && (
                <span className="bm-field-error">
                  <FiAlertCircle size={11} /> {errors.year}
                </span>
              )}
              {touched.year && !errors.year && (
                <span className="bm-field-success">
                  <FiCheck size={11} /> Looks good
                </span>
              )}
            </div>

            <div className="bm-field">
              <label className="bm-field-label">
                <FiBookOpen className="icon" size={14} />
                Semester <span className="req">*</span>
              </label>
              <select
                name="semester"
                value={form.semester}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`bm-select ${fieldClass('semester')}`}
              >
                <option value="">Select Semester</option>
                {SEMESTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {touched.semester && errors.semester && (
                <span className="bm-field-error">
                  <FiAlertCircle size={11} /> {errors.semester}
                </span>
              )}
              {touched.semester && !errors.semester && (
                <span className="bm-field-success">
                  <FiCheck size={11} /> Looks good
                </span>
              )}
            </div>
          </div>

          {/* Type & Specialization */}
          <div className="bm-form-grid">
            <div className="bm-field">
              <label className="bm-field-label">
                <FiClock className="icon" size={14} />
                Batch Type <span className="req">*</span>
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`bm-select ${fieldClass('type')}`}
              >
                <option value="">Select Type</option>
                {BATCH_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {touched.type && errors.type && (
                <span className="bm-field-error">
                  <FiAlertCircle size={11} /> {errors.type}
                </span>
              )}
              {touched.type && !errors.type && (
                <span className="bm-field-success">
                  <FiCheck size={11} /> Looks good
                </span>
              )}
            </div>

            <div className="bm-field">
              <label className="bm-field-label">
                <FiLayers className="icon" size={14} />
                Specialization <span className="req">*</span>
              </label>
              <select
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`bm-select ${fieldClass('specialization')}`}
              >
                <option value="">Select Specialization</option>
                {SPECIALIZATIONS.map((sp) => (
                  <option key={sp.value} value={sp.value}>
                    {sp.label}
                  </option>
                ))}
              </select>
              {touched.specialization && errors.specialization && (
                <span className="bm-field-error">
                  <FiAlertCircle size={11} /> {errors.specialization}
                </span>
              )}
              {touched.specialization && !errors.specialization && (
                <span className="bm-field-success">
                  <FiCheck size={11} /> Looks good
                </span>
              )}
            </div>
          </div>

          {/* Main Group & Sub Group */}
          <div className="bm-form-grid">
            <div className="bm-field">
              <label className="bm-field-label">
                <FiHash className="icon" size={14} />
                Main Group <span className="req">*</span>
              </label>
              <div className="bm-input-wrap">
                <input
                  name="mainGroup"
                  value={form.mainGroup}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. 01"
                  maxLength={2}
                  className={`bm-input ${fieldClass('mainGroup')}`}
                />
              </div>
              {touched.mainGroup && errors.mainGroup && (
                <span className="bm-field-error">
                  <FiAlertCircle size={11} /> {errors.mainGroup}
                </span>
              )}
              {touched.mainGroup && !errors.mainGroup && (
                <span className="bm-field-success">
                  <FiCheck size={11} /> Looks good
                </span>
              )}
              {!touched.mainGroup && (
                <span className="bm-field-hint">
                  <FiInfo size={11} /> 2 digits, 01–99
                </span>
              )}
            </div>

            <div className="bm-field">
              <label className="bm-field-label">
                <FiHash className="icon" size={14} />
                Sub Group <span className="req">*</span>
              </label>
              <div className="bm-input-wrap">
                <input
                  name="subGroup"
                  value={form.subGroup}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. 01"
                  maxLength={2}
                  className={`bm-input ${fieldClass('subGroup')}`}
                />
              </div>
              {touched.subGroup && errors.subGroup && (
                <span className="bm-field-error">
                  <FiAlertCircle size={11} /> {errors.subGroup}
                </span>
              )}
              {touched.subGroup && !errors.subGroup && (
                <span className="bm-field-success">
                  <FiCheck size={11} /> Looks good
                </span>
              )}
              {!touched.subGroup && (
                <span className="bm-field-hint">
                  <FiInfo size={11} /> 2 digits, 01–99
                </span>
              )}
            </div>
          </div>

          {/* Student Count */}
          <div className="bm-field full">
            <label className="bm-field-label">
              <FiUsers className="icon" size={14} />
              Number of Students <span className="req">*</span>
            </label>
            <div className="bm-input-wrap">
              <input
                type="number"
                name="studentCount"
                value={form.studentCount}
                onChange={handleChange}
                onBlur={handleBlur}
                min={1}
                max={500}
                placeholder="e.g. 30"
                className={`bm-input ${fieldClass('studentCount')}`}
              />
            </div>
            {touched.studentCount && errors.studentCount && (
              <span className="bm-field-error">
                <FiAlertCircle size={11} /> {errors.studentCount}
              </span>
            )}
            {touched.studentCount && !errors.studentCount && (
              <span className="bm-field-success">
                <FiCheck size={11} /> Looks good
              </span>
            )}
            {!touched.studentCount && (
              <span className="bm-field-hint">
                <FiInfo size={11} /> Between 1 and 500 students
              </span>
            )}
          </div>

          {/* Format Guide */}
          <div className="bm-format">
            <div className="bm-format-title">
              <FiInfo size={13} /> Batch Code Format Guide
            </div>
            <div className="bm-format-parts">
              {previewParts.map((p, i) => (
                <React.Fragment key={i}>
                  <div className="bm-format-item">
                    <span className="bm-format-seg">{p.v}</span>
                    <span className="bm-format-seg-label">{p.t}</span>
                  </div>
                  {i < previewParts.length - 1 && (
                    <span className="bm-format-dot">.</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Summary */}
          {formValid && !isDup && (
            <div className="bm-summary">
              <div className="bm-summary-title">
                <FiCheck size={16} /> Ready to{' '}
                {selected ? 'Update' : 'Create'}
              </div>
              <div className="bm-summary-grid">
                <div className="bm-summary-item">
                  <span className="s-label">Batch Code</span>
                  <span className="s-value">
                    <span className="bm-summary-code">
                      {batchCode}
                    </span>
                  </span>
                </div>
                <div className="bm-summary-item">
                  <span className="s-label">Students</span>
                  <span className="s-value">{form.studentCount}</span>
                </div>
                <div className="bm-summary-item">
                  <span className="s-label">Type</span>
                  <span className="s-value">
                    {form.type === 'WD' ? 'Weekday' : 'Weekend'}
                  </span>
                </div>
                <div className="bm-summary-item">
                  <span className="s-label">Specialization</span>
                  <span className="s-value">{form.specialization}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* ══════════════════════════════════════════
          DELETE MODAL
          ══════════════════════════════════════════ */}
      <Modal
        isOpen={showDelete}
        onClose={() => {
          setShowDelete(false);
          setSelected(null);
        }}
        title="Delete Batch"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDelete(false);
                setSelected(null);
              }}
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
        <div className="bm-delete-content">
          <div className="bm-delete-icon">
            <FiAlertTriangle size={30} />
          </div>
          <h3 className="bm-delete-title">Delete this batch?</h3>
          <p className="bm-delete-sub">
            This will permanently remove the batch from the system.
          </p>
          {selected && (
            <div className="bm-delete-target">
              <span className="bm-delete-target-code">
                {selected.batchCode}
              </span>
              <span className="bm-delete-target-meta">
                {selected.studentCount} student
                {selected.studentCount !== 1 ? 's' : ''} •{' '}
                {selected.type === 'WD' ? 'Weekday' : 'Weekend'} •{' '}
                {selected.specialization}
              </span>
            </div>
          )}
          <p className="bm-delete-warning">
            ⚠ This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default BatchManagement;