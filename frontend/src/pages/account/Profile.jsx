import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMail, FiShield, FiUser, FiClock,
  FiCheckCircle, FiArrowRight, FiEdit3,
  FiSave, FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Account.css';

/* ── Role Config ─────────────────────────────────────── */
const ROLE_CONFIG = {
  admin: {
    title: 'System Administrator',
    color: 'primary',
    description:
      'Manage academic resources, master data, and platform readiness across UniSlot.',
    quickLinks: [
      { label: 'Manage Staff',    to: '/admin/staff'    },
      { label: 'Manage Courses',  to: '/admin/courses'  },
      { label: 'Manage Batches',  to: '/admin/batches'  },
      { label: 'Manage Halls',    to: '/admin/halls'    }
    ]
  },
  lic: {
    title: 'Lecturer In Charge',
    color: 'success',
    description:
      'Coordinate course ownership, instructor assignment, and workload preparation.',
    quickLinks: [
      { label: 'My Courses',         to: '/lic/courses' },
      { label: 'Assign Instructors', to: '/lic/assign'  }
    ]
  },
  coordinator: {
    title: 'Timetable Coordinator',
    color: 'warning',
    description:
      'Build conflict-aware schedules, balance halls, and publish working timetables.',
    quickLinks: [
      { label: 'Timetable View',   to: '/coordinator/timetable' },
      { label: 'Schedule Classes', to: '/coordinator/schedule'  },
      { label: 'Publish Timetable',to: '/coordinator/publish'   }
    ]
  }
};

const formatDate = (value) => {
  if (!value) return 'Not available';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(new Date(value));
  } catch {
    return 'Not available';
  }
};

const getErrMsg = (err, fallback) =>
  err?.response?.data?.message ||
  err?.response?.data?.errors?.[0]?.msg ||
  fallback;

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
const AccountProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [errors,   setErrors]   = useState({});

  /* sync form with user */
  useEffect(() => {
    setFormData({ name: user?.name || '', email: user?.email || '' });
  }, [user]);

  const role = ROLE_CONFIG[user?.role] || {
    title: 'UniSlot User',
    color: 'primary',
    description: 'Access your account details and keep your profile up to date.',
    quickLinks: []
  };

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const hasChanges =
    formData.name.trim()  !== (user?.name  || '') ||
    formData.email.trim().toLowerCase() !== (user?.email || '').toLowerCase();

  /* ── Validate ──────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!formData.name.trim())  e.name  = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Handlers ──────────────────────────────── */
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleCancel = () => {
    setFormData({ name: user?.name || '', email: user?.email || '' });
    setErrors({});
    setEditing(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    if (!hasChanges) { toast.info('No changes to save.'); return; }

    try {
      setSaving(true);
      const res = await authAPI.updateProfile({
        name:  formData.name.trim(),
        email: formData.email.trim()
      });
      setUser(res.data.data);
      toast.success('Profile updated successfully ✓');
      setEditing(false);
    } catch (err) {
      toast.error(getErrMsg(err, 'Unable to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  /* ─── RENDER ─────────────────────────────────────── */
  return (
    <div className="acc-page">

      {/* ── Hero Banner ────────────────────────────── */}
      <div className={`acc-hero acc-hero--${role.color}`}>
        <div className="acc-hero__bg" />
        <div className="acc-hero__content">
          <div className="acc-hero__left">
            <div className="acc-avatar">
              <span>{initials}</span>
            </div>
            <div className="acc-hero__info">
              <span className="acc-hero__eyebrow">Account Profile</span>
              <h2 className="acc-hero__name">{user?.name || 'UniSlot User'}</h2>
              <p className="acc-hero__sub">{role.description}</p>
              <div className="acc-hero__badges">
                <span className={`acc-badge acc-badge--${role.color}`}>
                  {role.title}
                </span>
                <span className="acc-badge acc-badge--success">
                  Active Account
                </span>
              </div>
            </div>
          </div>
          <button
            className="acc-edit-btn"
            onClick={() => setEditing(true)}
            title="Edit profile"
          >
            <FiEdit3 size={16} /> Edit Profile
          </button>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────── */}
      <div className="acc-grid">

        {/* Profile Form */}
        <div className="acc-card">
          <div className="acc-card__header">
            <h3>Profile Details</h3>
            {editing && (
              <span className="acc-editing-badge">Editing…</span>
            )}
          </div>
          <div className="acc-card__body">
            <form onSubmit={handleSubmit} noValidate>
              <div className="acc-form-grid">

                {/* Name */}
                <div className={`acc-field ${errors.name ? 'acc-field--error' : editing && formData.name ? 'acc-field--success' : ''}`}>
                  <label htmlFor="name">
                    Full Name <span className="acc-req">*</span>
                  </label>
                  <div className="acc-input-wrap">
                    <FiUser className="acc-input-icon" size={15} />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Enter your full name"
                      className={`acc-input ${errors.name ? 'is-error' : ''}`}
                    />
                  </div>
                  {errors.name && (
                    <span className="acc-field-error">{errors.name}</span>
                  )}
                </div>

                {/* Email */}
                <div className={`acc-field ${errors.email ? 'acc-field--error' : editing && formData.email ? 'acc-field--success' : ''}`}>
                  <label htmlFor="email">
                    Email Address <span className="acc-req">*</span>
                  </label>
                  <div className="acc-input-wrap">
                    <FiMail className="acc-input-icon" size={15} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="Enter your email"
                      className={`acc-input ${errors.email ? 'is-error' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <span className="acc-field-error">{errors.email}</span>
                  )}
                </div>
              </div>

              {editing && (
                <div className="acc-form-actions">
                  <button
                    type="button"
                    className="acc-btn acc-btn--ghost"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <FiX size={15} /> Cancel
                  </button>
                  <button
                    type="submit"
                    className="acc-btn acc-btn--primary"
                    disabled={saving || !hasChanges}
                  >
                    {saving ? (
                      <><span className="acc-spinner" /> Saving…</>
                    ) : (
                      <><FiSave size={15} /> Save Changes</>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Account Snapshot */}
        <div className="acc-card">
          <div className="acc-card__header">
            <h3>Account Snapshot</h3>
          </div>
          <div className="acc-card__body">
            <div className="acc-detail-list">
              {[
                { icon: FiUser,   label: 'Role',         value: role.title },
                { icon: FiMail,   label: 'Email',        value: user?.email || '—' },
                {
                  icon: FiShield,
                  label: 'Account Status',
                  value: user?.isActive === false ? 'Inactive' : 'Active',
                  accent: user?.isActive !== false ? 'success' : 'error'
                },
                {
                  icon: FiClock,
                  label: 'Member Since',
                  value: formatDate(user?.createdAt)
                }
              ].map((item, i) => (
                <div key={i} className="acc-detail-item">
                  <div className="acc-detail-icon">
                    <item.icon size={17} />
                  </div>
                  <div className="acc-detail-content">
                    <span className="acc-detail-label">{item.label}</span>
                    <span className={`acc-detail-value ${item.accent ? `acc-detail-value--${item.accent}` : ''}`}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Responsibilities */}
        <div className="acc-card">
          <div className="acc-card__header">
            <h3>UniSlot Responsibilities</h3>
          </div>
          <div className="acc-card__body">
            <div className="acc-resp-list">
              {[
                'Keep your account details accurate for system communication.',
                'Use settings to protect access and tailor your dashboard workflow.',
                'Review role-based modules regularly to keep the scheduling cycle moving.'
              ].map((text, i) => (
                <div key={i} className="acc-resp-item">
                  <FiCheckCircle size={16} className="acc-resp-icon" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="acc-card">
          <div className="acc-card__header">
            <h3>Quick Access</h3>
          </div>
          <div className="acc-card__body">
            <div className="acc-links-list">
              {role.quickLinks.map(link => (
                <Link key={link.to} to={link.to} className="acc-link-row">
                  <span>{link.label}</span>
                  <FiArrowRight size={15} />
                </Link>
              ))}
              <Link
                to={`/${user?.role || 'admin'}/settings`}
                className="acc-link-row acc-link-row--highlight"
              >
                <span>Open Account Settings</span>
                <FiArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccountProfile;