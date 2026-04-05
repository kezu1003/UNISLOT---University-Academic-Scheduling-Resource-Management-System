import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// context is located at src/context
import { useAuth } from '../../../context/AuthContext';
// Loading component is one level up (common directory)
import Loading from '../Loading';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Loading text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to their respective dashboard
    const dashboardRoutes = {
      admin: '/admin',
      lic: '/lic',
      coordinator: '/coordinator'
    };
    return <Navigate to={dashboardRoutes[user?.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;