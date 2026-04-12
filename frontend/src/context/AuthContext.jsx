import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  /* ── Safely extract user from any response shape ─────── */
  const extractUser = (responseData) => {
    // Shape 1: { token, data: { _id, name, role... } }
    if (responseData?.data && responseData.data._id) {
      return responseData.data;
    }
    // Shape 2: { token, user: { _id, name, role... } }
    if (responseData?.user && responseData.user._id) {
      return responseData.user;
    }
    // Shape 3: { _id, name, role... } (user object directly)
    if (responseData?._id) {
      return responseData;
    }
    return null;
  };

  /* ── Check auth on mount ─────────────────────────────── */
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res  = await api.get('/auth/me');
      const userData = extractUser(res.data);

      if (userData) {
        setUser(userData);
      } else {
        // Response came back but no user data → clear token
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /* ── Login ───────────────────────────────────────────── */
  const login = async (email, password) => {
    try {
      setError(null);

      const res = await api.post('/auth/login', { email, password });

      // ✅ Extract token - handle multiple shapes
      const token =
        res.data?.token ||
        res.data?.data?.token ||
        res.data?.accessToken;

      // ✅ Extract user - handle multiple shapes
      const userData = extractUser(res.data);

      if (!token) {
        return { success: false, message: 'No token received from server' };
      }

      if (!userData) {
        return { success: false, message: 'No user data received from server' };
      }

      localStorage.setItem('token', token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error  ||
        'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  };

  /* ── Register ────────────────────────────────────────── */
  const register = async (name, email, password, role) => {
    try {
      setError(null);
      const res = await api.post('/auth/register', { name, email, password, role });

      const token    = res.data?.token || res.data?.data?.token;
      const userData = extractUser(res.data);

      if (token) localStorage.setItem('token', token);
      if (userData) setUser(userData);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  /* ── Logout ──────────────────────────────────────────── */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    window.location.href = '/login';
  };

  /* ── Update user (after profile edit) ───────────────── */
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  /* ── Role-based dashboard route ──────────────────────── */
  const getDashboardRoute = (role) => {
    const routes = {
      admin:       '/admin',
      lic:         '/lic',
      coordinator: '/coordinator'
    };
    return routes[role?.toLowerCase()] || '/admin';
  };

  const value = {
    user,
    setUser,       // ✅ exposed for Profile page
    updateUser,    // ✅ named helper
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated:  !!user,
    isAdmin:          user?.role?.toLowerCase() === 'admin',
    isLIC:            user?.role?.toLowerCase() === 'lic',
    isCoordinator:    user?.role?.toLowerCase() === 'coordinator',
    getDashboardRoute
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;