import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Get page title from route
  const getPageTitle = () => {
    const path = location.pathname;
<<<<<<< HEAD
=======

    if (path.endsWith('/profile')) return 'My Profile';
    if (path.endsWith('/settings')) return 'Settings';
>>>>>>> fec701362d3b1719b076d7b4abef8c2eaf0fca05
    
    // Admin routes
    if (path.includes('/admin/staff')) return 'Staff Management';
    if (path.includes('/admin/batches')) return 'Batch Management';
    if (path.includes('/admin/courses')) return 'Course Management';
    if (path.includes('/admin/halls')) return 'Hall Management';
<<<<<<< HEAD
    if (path.includes('/admin/settings')) return 'Settings';
=======
>>>>>>> fec701362d3b1719b076d7b4abef8c2eaf0fca05
    if (path === '/admin') return 'Admin Dashboard';
    
    // LIC routes
    if (path.includes('/lic/courses')) return 'My Courses';
    if (path.includes('/lic/assign')) return 'Assign Instructors';
    if (path.includes('/lic/workload')) return 'Staff Workload';
    if (path === '/lic') return 'LIC Dashboard';
    
    // Coordinator routes
    if (path.includes('/coordinator/timetable')) return 'Timetable View';
    if (path.includes('/coordinator/schedule')) return 'Schedule Classes';
    if (path.includes('/coordinator/workload')) return 'Workload Overview';
    if (path.includes('/coordinator/conflicts')) return 'Conflict Check';
    if (path.includes('/coordinator/publish')) return 'Publish Timetable';
    if (path === '/coordinator') return 'Coordinator Dashboard';
    
    return 'Dashboard';
  };

  return (
    <div className="layout">
      <Sidebar />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="main-content">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          title={getPageTitle()}
        />
        
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default Layout;
=======
export default Layout;
>>>>>>> fec701362d3b1719b076d7b4abef8c2eaf0fca05
