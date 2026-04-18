import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiLock, FiMonitor, FiSave, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Account.css';

const preferencesKey = 'unislot-account-settings';

const defaultPreferences = {
  theme: 'light',
  emailAlerts: true,
  workloadAlerts: true,
  compactDashboard: false
};

const getErrorMessage = (error, fallback) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (Array.isArray(error.response?.data?.errors) && error.response.data.errors.length > 0) {
    return error.response.data.errors[0].msg;
  }

  return fallback;
};

const AccountSettings = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const savedPreferences = localStorage.getItem(preferencesKey);
    if (!savedPreferences) {
      return;
    }

    try {
      const parsed = JSON.parse(savedPreferences);
      setPreferences((current) => ({
        ...current,
        ...parsed
      }));
    } catch (error) {
      localStorage.removeItem(preferencesKey);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
  }, [preferences.theme]);

  const landingLinks = useMemo(() => {
    const role = user?.role;

    if (role === 'admin') {
      return [
        { label: 'Go to Staff Management', to: '/admin/staff' },
        { label: 'Go to Course Management', to: '/admin/courses' }
      ];
    }

    if (role === 'lic') {
      return [
        { label: 'Go to My Courses', to: '/lic/courses' },
        { label: 'Go to Assign Instructors', to: '/lic/assign' }
      ];
    }

    return [
      { label: 'Go to Timetable View', to: '/coordinator/timetable' },
      { label: 'Go to Publish Timetable', to: '/coordinator/publish' }
    ];
  }, [user?.role]);

  const handlePreferenceChange = (key, value) => {
    setPreferences((current) => ({
      ...current,
      [key]: value
    }));
  };

  const savePreferences = async () => {
    try {
      setPreferencesSaving(true);
      localStorage.setItem(preferencesKey, JSON.stringify(preferences));
      document.documentElement.setAttribute('data-theme', preferences.theme);
      toast.success('Settings saved for this browser.');
    } catch (error) {
      toast.error('Unable to save your settings.');
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handlePasswordInput = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const submitPasswordChange = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    try {
      setPasswordSaving(true);
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Password changed successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to change password.'));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="account-page">
      <section className="account-hero">
        <div className="account-identity">
          <div className="account-avatar settings-avatar">
            <FiMonitor size={28} />
          </div>
          <div>
            <p className="account-eyebrow">Workspace Settings</p>
            <h2>Configure your UniSlot experience</h2>
            <p className="account-subtitle">
              Update account security, notification habits, and dashboard preferences.
            </p>
          </div>
        </div>
      </section>

      <div className="account-grid">
        <Card className="account-card">
          <CardHeader>
            <h3>Interface Preferences</h3>
          </CardHeader>
          <CardBody>
            <div className="settings-group">
              <div className="form-group">
                <label className="form-label" htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  className="form-input form-select"
                  value={preferences.theme}
                  onChange={(event) => handlePreferenceChange('theme', event.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <label className="settings-toggle">
                <div>
                  <p>Email Notifications</p>
                  <span>Keep operational reminders visible for your account.</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailAlerts}
                  onChange={(event) => handlePreferenceChange('emailAlerts', event.target.checked)}
                />
              </label>

              <label className="settings-toggle">
                <div>
                  <p>Workload Alerts</p>
                  <span>Highlight overload or readiness issues on your dashboard.</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.workloadAlerts}
                  onChange={(event) => handlePreferenceChange('workloadAlerts', event.target.checked)}
                />
              </label>

              <label className="settings-toggle">
                <div>
                  <p>Compact Dashboard Cards</p>
                  <span>Reduce spacing when you want more information on one screen.</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.compactDashboard}
                  onChange={(event) => handlePreferenceChange('compactDashboard', event.target.checked)}
                />
              </label>
            </div>

            <div className="account-actions">
              <Button onClick={savePreferences} loading={preferencesSaving} icon={<FiSave size={16} />}>
                Save Preferences
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="account-card">
          <CardHeader>
            <h3>Security</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={submitPasswordChange}>
              <div className="form-group">
                <label className="form-label required" htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  className="form-input"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInput}
                  placeholder="Enter current password"
                />
              </div>

              <div className="account-form-grid">
                <div className="form-group">
                  <label className="form-label required" htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    className="form-input"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInput}
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required" htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="form-input"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInput}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              <div className="security-note">
                <FiLock size={16} />
                <span>Use a password that is unique to your UniSlot administrative account.</span>
              </div>

              <div className="account-actions">
                <Button type="submit" loading={passwordSaving}>
                  Update Password
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="account-card">
          <CardHeader>
            <h3>Notification Intent</h3>
          </CardHeader>
          <CardBody>
            <div className="detail-list">
              <div className="detail-item">
                <div className="detail-icon">
                  <FiBell size={18} />
                </div>
                <div>
                  <p className="detail-label">Account Email</p>
                  <p className="detail-value">{user?.email || 'Not available'}</p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiBell size={18} />
                </div>
                <div>
                  <p className="detail-label">Notification Mode</p>
                  <p className="detail-value">
                    {preferences.emailAlerts ? 'Email alerts enabled' : 'Email alerts disabled'}
                  </p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiBell size={18} />
                </div>
                <div>
                  <p className="detail-label">Dashboard Readiness</p>
                  <p className="detail-value">
                    {preferences.workloadAlerts ? 'Operational alerts visible' : 'Operational alerts muted'}
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="account-card">
          <CardHeader>
            <h3>Continue Working</h3>
          </CardHeader>
          <CardBody>
            <div className="quick-links-list">
              <Link to={`/${user?.role || 'admin'}/profile`} className="quick-link-row">
                <span>Return to My Profile</span>
                <FiArrowRight size={16} />
              </Link>
              {landingLinks.map((link) => (
                <Link key={link.to} to={link.to} className="quick-link-row">
                  <span>{link.label}</span>
                  <FiArrowRight size={16} />
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;
