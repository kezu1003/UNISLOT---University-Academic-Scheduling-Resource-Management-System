import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { token, data } = response.data;
      localStorage.setItem('token', token);
      setUser(data);
      return { success: true, user: data };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', {
        name, email, password, role
      });
      const { token, data } = response.data;
      localStorage.setItem('token', token);
      setUser(data);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  /* ✅ updateUser – called after profile save */
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    setUser,          // ✅ exposed so Profile can call it
    updateUser,       // ✅ named helper
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin:         user?.role === 'admin',
    isLIC:           user?.role === 'lic',
    isCoordinator:   user?.role === 'coordinator'
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