import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBell, FiLock, FiMonitor, FiSave,
  FiArrowRight, FiSun, FiMoon, FiEye,
  FiEyeOff, FiCheck, FiShield, FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Account.css';

const PREF_KEY = 'unislot-account-settings';

const DEFAULT_PREFS = {
  theme:            'light',
  emailAlerts:      true,
  workloadAlerts:   true,
  compactDashboard: false
};

const getErrMsg = (err, fallback) =>
  err?.response?.data?.message ||
  err?.response?.data?.errors?.[0]?.msg ||
  fallback;

/* ─── Password Strength ───────────────────────────── */
const getStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Weak',   color: '#ef4444' };
  if (score <= 3) return { score, label: 'Fair',   color: '#f59e0b' };
  if (score <= 4) return { score, label: 'Good',   color: '#22c55e' };
  return              { score, label: 'Strong', color: '#16a34a' };
};

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
const AccountSettings = () => {
  const { user } = useAuth();

  /* prefs */
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefsSaving, setPrefsSaving] = useState(false);

  /* password */
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwd, setShowPwd] = useState({
    current: false, newPwd: false, confirm: false
  });
  const [pwdErrors, setPwdErrors] = useState({});

  /* ── Load Prefs ──────────────────────────── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREF_KEY);
      if (saved) setPrefs(p => ({ ...p, ...JSON.parse(saved) }));
    } catch {
      localStorage.removeItem(PREF_KEY);
    }
  }, []);

  /* ── Apply Theme ─────────────────────────── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme);
  }, [prefs.theme]);

  /* ── Landing Links ───────────────────────── */
  const landingLinks = useMemo(() => {
    if (user?.role === 'admin') return [
      { label: 'Staff Management',  to: '/admin/staff'    },
      { label: 'Course Management', to: '/admin/courses'  }
    ];
    if (user?.role === 'lic') return [
      { label: 'My Courses',        to: '/lic/courses' },
      { label: 'Assign Instructors',to: '/lic/assign'  }
    ];
    return [
      { label: 'Timetable View',   to: '/coordinator/timetable' },
      { label: 'Publish Timetable',to: '/coordinator/publish'   }
    ];
  }, [user?.role]);

  /* ── Password strength ───────────────────── */
  const strength = getStrength(pwdForm.newPassword);

  /* ── Handlers: Prefs ─────────────────────── */
  const handlePref = (key, value) =>
    setPrefs(p => ({ ...p, [key]: value }));

  const savePrefs = async () => {
    setPrefsSaving(true);
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
      document.documentElement.setAttribute('data-theme', prefs.theme);
      toast.success('Preferences saved ✓');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setPrefsSaving(false);
    }
  };

  /* ── Handlers: Password ──────────────────── */
  const handlePwdInput = e => {
    const { name, value } = e.target;
    setPwdForm(p => ({ ...p, [name]: value }));
    if (pwdErrors[name]) setPwdErrors(p => ({ ...p, [name]: '' }));
  };

  const validatePwd = () => {
    const e = {};
    if (!pwdForm.currentPassword) e.currentPassword = 'Current password is required';
    if (!pwdForm.newPassword)     e.newPassword = 'New password is required';
    else if (pwdForm.newPassword.length < 6)
      e.newPassword = 'Password must be at least 6 characters';
    if (!pwdForm.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (pwdForm.newPassword !== pwdForm.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    setPwdErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitPassword = async e => {
    e.preventDefault();
    if (!validatePwd()) return;

    setPwdSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword:     pwdForm.newPassword
      });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwdErrors({});
      toast.success('Password changed successfully ✓');
    } catch (err) {
      toast.error(getErrMsg(err, 'Unable to change password.'));
    } finally {
      setPwdSaving(false);
    }
  };

  /* ─── RENDER ──────────────────────────────────── */
  return (
    <div className="acc-page">

      {/* ── Hero ───────────────────────────────── */}
      <div className="acc-hero acc-hero--settings">
        <div className="acc-hero__bg" />
        <div className="acc-hero__content">
          <div className="acc-hero__left">
            <div className="acc-avatar acc-avatar--icon">
              <FiMonitor size={26} />
            </div>
            <div className="acc-hero__info">
              <span className="acc-hero__eyebrow">Workspace Settings</span>
              <h2 className="acc-hero__name">Configure Your Experience</h2>
              <p className="acc-hero__sub">
                Update security, notification habits, and dashboard preferences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────── */}
      <div className="acc-grid">

        {/* Interface Preferences */}
        <div className="acc-card">
          <div className="acc-card__header">
            <h3><FiMonitor size={16} /> Interface Preferences</h3>
          </div>
          <div className="acc-card__body">

            {/* Theme Toggle */}
            <div className="acc-setting-group">
              <div className="acc-setting-group__title">Appearance</div>

              <div className="acc-theme-toggle">
                <button
                  className={`acc-theme-btn ${prefs.theme === 'light' ? 'active' : ''}`}
                  onClick={() => handlePref('theme', 'light')}
                  type="button"
                >
                  <FiSun size={16} /> Light
                  {prefs.theme === 'light' && <FiCheck size={12} className="acc-theme-check" />}
                </button>
                <button
                  className={`acc-theme-btn ${prefs.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handlePref('theme', 'dark')}
                  type="button"
                >
                  <FiMoon size={16} /> Dark
                  {prefs.theme === 'dark' && <FiCheck size={12} className="acc-theme-check" />}
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="acc-setting-group">
              <div className="acc-setting-group__title">Notifications & Display</div>

              {[
                {
                  key: 'emailAlerts',
                  label: 'Email Notifications',
                  desc:  'Receive operational reminders and alerts by email.'
                },
                {
                  key: 'workloadAlerts',
                  label: 'Workload Alerts',
                  desc:  'Highlight overload or readiness issues on dashboard.'
                },
                {
                  key: 'compactDashboard',
                  label: 'Compact Dashboard',
                  desc:  'Reduce card spacing for denser information display.'
                }
              ].map(({ key, label, desc }) => (
                <div key={key} className="acc-toggle">
                  <div className="acc-toggle__info">
                    <span className="acc-toggle__label">{label}</span>
                    <span className="acc-toggle__desc">{desc}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prefs[key]}
                    className={`acc-switch ${prefs[key] ? 'acc-switch--on' : ''}`}
                    onClick={() => handlePref(key, !prefs[key])}
                  >
                    <span className="acc-switch__thumb" />
                  </button>
                </div>
              ))}
            </div>

            <div className="acc-card__footer">
              <button
                className="acc-btn acc-btn--primary"
                onClick={savePrefs}
                disabled={prefsSaving}
              >
                {prefsSaving ? (
                  <><span className="acc-spinner" /> Saving…</>
                ) : (
                  <><FiSave size={15} /> Save Preferences</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security / Change Password */}
        <div className="acc-card">
          <div className="acc-card__header">
            <h3><FiShield size={16} /> Security</h3>
          </div>
          <div className="acc-card__body">
            <form onSubmit={submitPassword} noValidate>

              {/* Current Password */}
              <div className={`acc-field ${pwdErrors.currentPassword ? 'acc-field--error' : ''}`}>
                <label htmlFor="currentPassword">
                  Current Password <span className="acc-req">*</span>
                </label>
                <div className="acc-input-wrap">
                  <FiLock className="acc-input-icon" size={15} />
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPwd.current ? 'text' : 'password'}
                    value={pwdForm.currentPassword}
                    onChange={handlePwdInput}
                    placeholder="Enter current password"
                    className={`acc-input acc-input--pwd ${pwdErrors.currentPassword ? 'is-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="acc-pwd-toggle"
                    onClick={() => setShowPwd(p => ({ ...p, current: !p.current }))}
                  >
                    {showPwd.current ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
                {pwdErrors.currentPassword && (
                  <span className="acc-field-error">{pwdErrors.currentPassword}</span>
                )}
              </div>

              <div className="acc-form-grid">
                {/* New Password */}
                <div className={`acc-field ${pwdErrors.newPassword ? 'acc-field--error' : ''}`}>
                  <label htmlFor="newPassword">
                    New Password <span className="acc-req">*</span>
                  </label>
                  <div className="acc-input-wrap">
                    <FiLock className="acc-input-icon" size={15} />
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPwd.newPwd ? 'text' : 'password'}
                      value={pwdForm.newPassword}
                      onChange={handlePwdInput}
                      placeholder="At least 6 characters"
                      className={`acc-input acc-input--pwd ${pwdErrors.newPassword ? 'is-error' : ''}`}
                    />
                    <button
                      type="button"
                      className="acc-pwd-toggle"
                      onClick={() => setShowPwd(p => ({ ...p, newPwd: !p.newPwd }))}
                    >
                      {showPwd.newPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  {pwdErrors.newPassword && (
                    <span className="acc-field-error">{pwdErrors.newPassword}</span>
                  )}
                  {/* Strength Bar */}
                  {pwdForm.newPassword && (
                    <div className="acc-strength">
                      <div className="acc-strength__bar">
                        {[1,2,3,4,5].map(i => (
                          <div
                            key={i}
                            className="acc-strength__seg"
                            style={{
                              background: i <= strength.score
                                ? strength.color
                                : '#e2e8f0'
                            }}
                          />
                        ))}
                      </div>
                      <span className="acc-strength__label" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className={`acc-field ${pwdErrors.confirmPassword ? 'acc-field--error' : ''}`}>
                  <label htmlFor="confirmPassword">
                    Confirm Password <span className="acc-req">*</span>
                  </label>
                  <div className="acc-input-wrap">
                    <FiLock className="acc-input-icon" size={15} />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPwd.confirm ? 'text' : 'password'}
                      value={pwdForm.confirmPassword}
                      onChange={handlePwdInput}
                      placeholder="Re-enter new password"
                      className={`acc-input acc-input--pwd ${pwdErrors.confirmPassword ? 'is-error' : ''}`}
                    />
                    <button
                      type="button"
                      className="acc-pwd-toggle"
                      onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}
                    >
                      {showPwd.confirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  {pwdErrors.confirmPassword && (
                    <span className="acc-field-error">{pwdErrors.confirmPassword}</span>
                  )}
                  {/* Match indicator */}
                  {pwdForm.confirmPassword && pwdForm.newPassword === pwdForm.confirmPassword && (
                    <span className="acc-field-success">
                      <FiCheck size={11} /> Passwords match
                    </span>
                  )}
                </div>
              </div>

              {/* Security Note */}
              <div className="acc-security-note">
                <FiLock size={14} />
                <span>Use a unique password you don't use on other sites.</span>
              </div>

              <div className="acc-card__footer">
                <button
                  type="submit"
                  className="acc-btn acc-btn--primary"
                  disabled={pwdSaving}
                >
                  {pwdSaving ? (
                    <><span className="acc-spinner" /> Updating…</>
                  ) : (
                    <><FiShield size={15} /> Update Password</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Notification Intent */}
        <div className="acc-card">
          <div className="acc-card__header">
            <h3><FiBell size={16} /> Notification Summary</h3>
          </div>
          <div className="acc-card__body">
            <div className="acc-detail-list">
              {[
                {
                  label: 'Account Email',
                  value: user?.email || '—'
                },
                {
                  label: 'Email Notifications',
                  value: prefs.emailAlerts ? 'Enabled' : 'Disabled',
                  accent: prefs.emailAlerts ? 'success' : 'muted'
                },
                {
                  label: 'Workload Alerts',
                  value: prefs.workloadAlerts ? 'Visible on Dashboard' : 'Muted',
                  accent: prefs.workloadAlerts ? 'success' : 'muted'
                },
                {
                  label: 'Dashboard Style',
                  value: prefs.compactDashboard ? 'Compact View' : 'Standard View'
                }
              ].map((item, i) => (
                <div key={i} className="acc-detail-item">
                  <div className="acc-detail-icon">
                    <FiBell size={17} />
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

        {/* Continue Working */}
        <div className="acc-card">
          <div className="acc-card__header">
            <h3>Continue Working</h3>
          </div>
          <div className="acc-card__body">
            <div className="acc-links-list">
              <Link
                to={`/${user?.role || 'admin'}/profile`}
                className="acc-link-row acc-link-row--highlight"
              >
                <span>Return to My Profile</span>
                <FiArrowRight size={15} />
              </Link>
              {landingLinks.map(link => (
                <Link key={link.to} to={link.to} className="acc-link-row">
                  <span>{link.label}</span>
                  <FiArrowRight size={15} />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccountSettings;