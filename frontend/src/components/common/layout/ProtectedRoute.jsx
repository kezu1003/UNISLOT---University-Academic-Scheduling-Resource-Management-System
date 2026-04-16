import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // ✅ Still loading - show spinner
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 16, background: '#f8fafc'
      }}>
        <div style={{
          width: 40, height: 40,
          border: '4px solid #e2e8f0', borderTopColor: '#6366f1',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite'
        }} />
        <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
          Verifying access…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ✅ Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Case-insensitive role check
  const userRole = user?.role?.toLowerCase();
  const allowed = allowedRoles.map(r => r.toLowerCase());
  const hasAccess = allowed.length === 0 || allowed.includes(userRole);

  if (!hasAccess) {
    const dashboards = {
      admin: '/admin',
      lic: '/lic',
      coordinator: '/coordinator'
    };
    return <Navigate to={dashboards[userRole] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;