// context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Extract user from ANY response shape
  const extractUserAndToken = (responseData) => {
    let token = null;
    let userData = null;

    // Shape 1: { success, data: { _id, name, role, token } }
    // (YOUR BACKEND FORMAT)
    if (responseData?.data?.token) {
      token = responseData.data.token;
      const { token: _, ...rest } = responseData.data;
      userData = rest;
    }
    // Shape 2: { token, data: { _id, name, role } }
    else if (responseData?.token && responseData?.data) {
      token = responseData.token;
      userData = responseData.data;
    }
    // Shape 3: { token, user: { _id, name, role } }
    else if (responseData?.token && responseData?.user) {
      token = responseData.token;
      userData = responseData.user;
    }

    return { token, userData };
  };

  const extractUser = (responseData) => {
    if (responseData?.data?._id) return responseData.data;
    if (responseData?.user?._id) return responseData.user;
    if (responseData?._id) return responseData;
    return null;
  };

  // ── Check auth on mount
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      const userData = extractUser(res.data);

      if (userData) {
        setUser(userData);
      } else {
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

  // ── Login
  const login = async (email, password) => {
    try {
      setError(null);
      const res = await api.post('/auth/login', { email, password });

      console.log('Login response:', res.data); // Debug

      const { token, userData } = extractUserAndToken(res.data);

      console.log('Extracted token:', token ? 'YES' : 'NO');
      console.log('Extracted user:', userData);

      if (!token) {
        return { success: false, message: 'No token received from server' };
      }

      if (!userData) {
        return { success: false, message: 'No user data received' };
      }

      localStorage.setItem('token', token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  // ── Register
  const register = async (name, email, password, role) => {
    try {
      setError(null);
      const res = await api.post('/auth/register', { name, email, password, role });

      const { token, userData } = extractUserAndToken(res.data);

      if (token) localStorage.setItem('token', token);
      if (userData) setUser(userData);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  // ── Logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    window.location.href = '/login';
  };

  // ── Update user
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // ── Dashboard route helper
  const getDashboardRoute = (role) => {
    const routes = {
      admin: '/admin',
      lic: '/lic',
      coordinator: '/coordinator'
    };
    return routes[role?.toLowerCase()] || '/admin';
  };

  const value = {
    user,
    setUser,
    updateUser,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin: user?.role?.toLowerCase() === 'admin',
    isLIC: user?.role?.toLowerCase() === 'lic',
    isCoordinator: user?.role?.toLowerCase() === 'coordinator',
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