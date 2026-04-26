import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
// layout components are located under common/layout, not directly under components
import ProtectedRoute from './components/common/layout/ProtectedRoute';
import Layout from './components/common/layout/Layout';

// Auth Pages
import Login from './pages/auth/Login';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import StaffManagement from './pages/admin/StaffManagement';
import BatchManagement from './pages/admin/BatchManagement';
import CourseManagement from './pages/admin/CourseManagement';
import HallManagement from './pages/admin/HallManagement';

// LIC Pages
import LICDashboard from './pages/lic/Dashboard';
// CourseAssignment component did not exist previously; we now provide a simple wrapper
import CourseAssignment from './pages/lic/CourseAssignment';
import StaffSelection from './pages/lic/StaffSelection';

// Coordinator Pages
import CoordinatorDashboard from './pages/coordinator/Dashboard';
import TimetableScheduler from './pages/coordinator/TimetableScheduler';
import WorkloadOverview from './pages/coordinator/WorkloadOverview';
import PublishTimetable from './pages/coordinator/PublishTimetable';

import './styles/index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="batches" element={<BatchManagement />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="halls" element={<HallManagement />} />
          </Route>

          {/* LIC Routes */}
          <Route path="/lic" element={
            <ProtectedRoute allowedRoles={['lic']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<LICDashboard />} />
            <Route path="courses" element={<CourseAssignment />} />
            <Route path="assign" element={<StaffSelection />} />
          </Route>

          {/* Coordinator Routes */}
          <Route path="/coordinator" element={
            <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<CoordinatorDashboard />} />
            <Route path="timetable" element={<TimetableScheduler />} />
            <Route path="schedule" element={<TimetableScheduler />} />
            <Route path="workload" element={<WorkloadOverview />} />
            <Route path="publish" element={<PublishTimetable />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;