import React, { createContext, useContext, useState, useEffect } from 'react';
<<<<<<< HEAD
import api from '../services/api';
=======
import api, { authAPI } from '../services/api';
>>>>>>> fec701362d3b1719b076d7b4abef8c2eaf0fca05

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    } catch (err) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
=======
  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data);
      return response.data.data;
    } catch (err) {
      localStorage.removeItem('token');
      setUser(null);
      throw err;
    }
  };

>>>>>>> fec701362d3b1719b076d7b4abef8c2eaf0fca05
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { token, ...userData } = response.data.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      
      return { success: true };
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
        name,
        email,
        password,
        role
      });
      
      const { token, ...userData } = response.data.data;
      localStorage.setItem('token', token);
      setUser(userData);
      
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

  const value = {
    user,
<<<<<<< HEAD
=======
    setUser,
>>>>>>> fec701362d3b1719b076d7b4abef8c2eaf0fca05
    loading,
    error,
    login,
    register,
    logout,
<<<<<<< HEAD
=======
    refreshUser,
>>>>>>> fec701362d3b1719b076d7b4abef8c2eaf0fca05
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLIC: user?.role === 'lic',
    isCoordinator: user?.role === 'coordinator'
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

<<<<<<< HEAD
export default AuthContext;
=======
export default AuthContext;
>>>>>>> fec701362d3b1719b076d7b4abef8c2eaf0fca05
