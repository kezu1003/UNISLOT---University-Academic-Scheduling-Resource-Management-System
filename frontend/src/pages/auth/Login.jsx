import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './Login.css';

const Login = () => {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  /* ── Already logged in ───────────────────────────────── */
  if (isAuthenticated && user) {
    const routes = {
      admin:       '/admin',
      lic:         '/lic',
      coordinator: '/coordinator'
    };
    return (
      <Navigate
        to={routes[user?.role?.toLowerCase()] || '/admin'}
        replace
      />
    );
  }

  /* ── Validation ──────────────────────────────────────── */
  const validate = () => {
    const errs = {};

    if (!email)
      errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))
      errs.email = 'Please enter a valid email';

    if (!password)
      errs.password = 'Password is required';
    else if (password.length < 6)
      errs.password = 'Password must be at least 6 characters';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit ──────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      /* ✅ FIX: Role-based redirect — NOT navigate(0) */
      const routes = {
        admin:       '/admin',
        lic:         '/lic',
        coordinator: '/coordinator'
      };
      const dest = routes[result.user?.role?.toLowerCase()] || '/admin';
      navigate(dest, { replace: true });
    } else {
      setErrors({ form: result.message });
    }
  };

  /* ── Fill demo credentials ───────────────────────────── */
  const fillDemo = (role) => {
    const map = {
      admin:       { email: 'admin@sliit.lk',  password: 'admin123' },
      lic:         { email: 'lic@sliit.lk',    password: 'lic123'   },
      coordinator: { email: 'coord@sliit.lk',  password: 'coord123' }
    };
    setEmail(map[role].email);
    setPassword(map[role].password);
    setErrors({});
  };

  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="login-page">
      <div className="login-container">

        {/* ════════════════════════════════════════
            LEFT — BRANDING
            ════════════════════════════════════════ */}
        <div className="login-branding">
          <div className="branding-content">

            {/* Logo */}
            <div className="logo">
              <div className="logo-icon-wrapper">
                <span className="logo-icon">🎓</span>
              </div>
              <span className="logo-text">UniSlot</span>
            </div>

            {/* Heading */}
            <h1>SLIIT Timetable<br />Management System</h1>
            <p>
              Efficiently manage academic schedules, allocate resources,
              and streamline coordination across the Faculty of Computing.
            </p>

            {/* Features */}
            <div className="features">
              {[
                { icon: '📅', label: 'Smart Scheduling'   },
                { icon: '👥', label: 'Workload Management' },
                { icon: '🏫', label: 'Hall Allocation'     },
                { icon: '⚡', label: 'Conflict Detection'  }
              ].map((f, i) => (
                <div key={i} className="feature">
                  <span className="feature-icon">{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="branding-stats">
              {[
                { val: '3',    label: 'User Roles'    },
                { val: '100+', label: 'Staff Members' },
                { val: '50+',  label: 'Courses'       }
              ].map((s, i) => (
                <div key={i} className="branding-stat">
                  <span className="branding-stat-value">{s.val}</span>
                  <span className="branding-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="branding-footer">
            <p>© 2024 Sri Lanka Institute of Information Technology</p>
          </div>
        </div>

        {/* ════════════════════════════════════════
            RIGHT — FORM
            ════════════════════════════════════════ */}
        <div className="login-form-container">
          <div className="login-form-wrapper">

            {/* Header */}
            <div className="login-header">
              <div className="login-header-icon">
                <FiLock size={22} />
              </div>
              <h2>Welcome Back</h2>
              <p>Please sign in to continue to your dashboard</p>
            </div>

            {/* Form Error Alert */}
            {errors.form && (
              <div className="alert alert-error">
                <FiAlertCircle size={16} />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form" noValidate>

              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                placeholder="you@sliit.lk"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(p => ({ ...p, email: '' }));
                }}
                error={errors.email}
                icon={<FiMail />}
                required
                disabled={loading}
                autoComplete="email"
              />

              {/* Password */}
              <div className="password-field">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(p => ({ ...p, password: '' }));
                  }}
                  error={errors.password}
                  icon={<FiLock />}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              {/* Options */}
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="/forgot-password" className="forgot-link">
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                className="login-btn"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="login-divider">
              <span>Demo Credentials</span>
            </div>

            {/* Demo Credentials */}
            <div className="demo-credentials">
              {/* Quick Fill Buttons */}
              <div className="demo-quick-btns">
                <button
                  type="button"
                  className="demo-quick-btn demo-quick-btn--admin"
                  onClick={() => fillDemo('admin')}
                  disabled={loading}
                >
                  Admin
                </button>
                <button
                  type="button"
                  className="demo-quick-btn demo-quick-btn--lic"
                  onClick={() => fillDemo('lic')}
                  disabled={loading}
                >
                  LIC
                </button>
                <button
                  type="button"
                  className="demo-quick-btn demo-quick-btn--coord"
                  onClick={() => fillDemo('coordinator')}
                  disabled={loading}
                >
                  Coordinator
                </button>
              </div>

              {/* Credential List */}
              <div className="demo-item">
                <strong>Admin</strong>
                <span>admin@sliit.lk / admin123</span>
              </div>
              <div className="demo-item">
                <strong>LIC</strong>
                <span>lic@sliit.lk / lic123</span>
              </div>
              <div className="demo-item">
                <strong>Coord</strong>
                <span>coord@sliit.lk / coord123</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;