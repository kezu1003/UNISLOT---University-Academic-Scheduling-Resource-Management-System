import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiShield, FiUser, FiClock, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Account.css';

const roleConfig = {
  admin: {
    title: 'System Administrator',
    description: 'Manage academic resources, master data, and platform readiness across UniSlot.',
    quickLinks: [
      { label: 'Manage Staff', to: '/admin/staff' },
      { label: 'Manage Courses', to: '/admin/courses' },
      { label: 'Manage Batches', to: '/admin/batches' },
      { label: 'Manage Halls', to: '/admin/halls' }
    ]
  },
  lic: {
    title: 'Lecturer In Charge',
    description: 'Coordinate course ownership, instructor assignment, and workload preparation.',
    quickLinks: [
      { label: 'My Courses', to: '/lic/courses' },
      { label: 'Assign Instructors', to: '/lic/assign' }
    ]
  },
  coordinator: {
    title: 'Timetable Coordinator',
    description: 'Build conflict-aware schedules, balance halls, and publish working timetables.',
    quickLinks: [
      { label: 'Timetable View', to: '/coordinator/timetable' },
      { label: 'Schedule Classes', to: '/coordinator/schedule' },
      { label: 'Publish Timetable', to: '/coordinator/publish' }
    ]
  }
};

const formatDate = (value) => {
  if (!value) return 'Not available';

  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(value));
  } catch (error) {
    return 'Not available';
  }
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

const AccountProfile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
  }, [user]);

  const roleDetails = useMemo(() => {
    return roleConfig[user?.role] || {
      title: 'UniSlot User',
      description: 'Access your account details and keep your profile up to date.',
      quickLinks: []
    };
  }, [user?.role]);

  const hasChanges =
    formData.name.trim() !== (user?.name || '') ||
    formData.email.trim().toLowerCase() !== (user?.email || '').toLowerCase();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasChanges) {
      toast.info('Your profile is already up to date.');
      return;
    }

    try {
      setSaving(true);
      const response = await authAPI.updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim()
      });

      setUser(response.data.data);
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update your profile.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account-page">
      <section className="account-hero">
        <div className="account-identity">
          <div className="account-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="account-eyebrow">Account Overview</p>
            <h2>{user?.name || 'UniSlot User'}</h2>
            <p className="account-subtitle">{roleDetails.description}</p>
          </div>
        </div>
        <div className="account-badges">
          <span className="badge badge-primary">{roleDetails.title}</span>
          <span className="badge badge-success">Active Account</span>
        </div>
      </section>

      <div className="account-grid">
        <Card className="account-card">
          <CardHeader>
            <h3>Profile Details</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div className="account-form-grid">
                <div className="form-group">
                  <label className="form-label required" htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div className="account-actions">
                <Button type="submit" loading={saving}>
                  Save Profile
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="account-card">
          <CardHeader>
            <h3>Account Snapshot</h3>
          </CardHeader>
          <CardBody>
            <div className="detail-list">
              <div className="detail-item">
                <div className="detail-icon">
                  <FiUser size={18} />
                </div>
                <div>
                  <p className="detail-label">Role</p>
                  <p className="detail-value">{roleDetails.title}</p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiMail size={18} />
                </div>
                <div>
                  <p className="detail-label">Primary Email</p>
                  <p className="detail-value">{user?.email || 'Not available'}</p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiShield size={18} />
                </div>
                <div>
                  <p className="detail-label">Account Status</p>
                  <p className="detail-value">{user?.isActive === false ? 'Inactive' : 'Active'}</p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiClock size={18} />
                </div>
                <div>
                  <p className="detail-label">Member Since</p>
                  <p className="detail-value">{formatDate(user?.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="account-card">
          <CardHeader>
            <h3>UniSlot Responsibilities</h3>
          </CardHeader>
          <CardBody>
            <div className="responsibility-panel">
              <div className="responsibility-item">
                <FiCheckCircle size={18} />
                <span>Keep your account details accurate for system communication.</span>
              </div>
              <div className="responsibility-item">
                <FiCheckCircle size={18} />
                <span>Use settings to protect access and tailor your dashboard workflow.</span>
              </div>
              <div className="responsibility-item">
                <FiCheckCircle size={18} />
                <span>Review role-based modules regularly to keep the scheduling cycle moving.</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="account-card">
          <CardHeader>
            <h3>Quick Access</h3>
          </CardHeader>
          <CardBody>
            <div className="quick-links-list">
              {roleDetails.quickLinks.map((link) => (
                <Link key={link.to} to={link.to} className="quick-link-row">
                  <span>{link.label}</span>
                  <FiArrowRight size={16} />
                </Link>
              ))}
              <Link to={`/${user?.role || 'admin'}/settings`} className="quick-link-row">
                <span>Open Account Settings</span>
                <FiArrowRight size={16} />
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AccountProfile;
