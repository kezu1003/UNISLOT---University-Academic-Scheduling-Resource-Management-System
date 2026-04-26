import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    const dashboardRoutes = {
      admin: '/admin',
      lic: '/lic',
      coordinator: '/coordinator'
    };
    return <Navigate to={dashboardRoutes[user?.role] || '/'} replace />;
  }

  const validate = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const result = await login(email, password);

    setLoading(false);

    if (result.success) {
      navigate(0);
    } else {
      setErrors({ form: result.message });
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            {/* FIXED LOGO - Better visibility */}
            <div className="logo">
              <div className="logo-icon-wrapper">
                <span className="logo-icon">🎓</span>
              </div>
              <span className="logo-text">UniSlot</span>
            </div>
            
            <h1>SLIIT Timetable Management System</h1>
            <p>
              Efficiently manage academic schedules, allocate resources, 
              and streamline coordination across the Faculty of Computing.
            </p>
            
            <div className="features">
              <div className="feature">
                <span className="feature-icon">📅</span>
                <span>Smart Scheduling</span>
              </div>
              <div className="feature">
                <span className="feature-icon">👥</span>
                <span>Workload Management</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🏫</span>
                <span>Hall Allocation</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📧</span>
                <span>Email Notifications</span>
              </div>
            </div>
          </div>
          
          <div className="branding-footer">
            <p>© 2024 Sri Lanka Institute of Information Technology</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <div className="login-form-wrapper">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Please sign in to continue to your dashboard</p>
            </div>

            {errors.form && (
              <div className="alert alert-error">
                {errors.form}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                icon={<FiMail />}
                required
              />

              <div className="password-field">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  icon={<FiLock />}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="/forgot-password" className="forgot-link">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                className="login-btn"
              >
                Sign In
              </Button>
            </form>

            <div className="login-divider">
              <span>Demo Credentials</span>
            </div>

            <div className="demo-credentials">
              <div className="demo-item">
                <strong>Admin:</strong>
                <span>admin@sliit.lk / admin123</span>
              </div>
              <div className="demo-item">
                <strong>LIC:</strong>
                <span>lic@sliit.lk / lic123</span>
              </div>
              <div className="demo-item">
                <strong>Coordinator:</strong>
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