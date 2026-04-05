import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiBook, FiCalendar, FiClock, 
  FiSettings, FiChevronLeft, FiChevronRight,
  FiLayers, FiGrid, FiCheckSquare, FiSend,
  FiBarChart2, FiMapPin, FiLogOut
} from 'react-icons/fi';
// relative path up to context directory
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin, isLIC, isCoordinator } = useAuth();
  const location = useLocation();

  // Define navigation items based on role
  const getNavItems = () => {
    if (isAdmin) {
      return [
        { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
        { path: '/admin/staff', icon: FiUsers, label: 'Staff Management' },
        { path: '/admin/batches', icon: FiLayers, label: 'Batch Management' },
        { path: '/admin/courses', icon: FiBook, label: 'Course Management' },
        { path: '/admin/halls', icon: FiMapPin, label: 'Hall Management' },
        { path: '/admin/settings', icon: FiSettings, label: 'Settings' }
      ];
    }

    if (isLIC) {
      return [
        { path: '/lic', icon: FiHome, label: 'Dashboard', exact: true },
        { path: '/lic/courses', icon: FiBook, label: 'My Courses' },
        { path: '/lic/assign', icon: FiCheckSquare, label: 'Assign Instructors' },
        { path: '/lic/workload', icon: FiBarChart2, label: 'Staff Workload' }
      ];
    }

    if (isCoordinator) {
      return [
        { path: '/coordinator', icon: FiHome, label: 'Dashboard', exact: true },
        { path: '/coordinator/timetable', icon: FiCalendar, label: 'Timetable' },
        { path: '/coordinator/schedule', icon: FiClock, label: 'Schedule Classes' },
        { path: '/coordinator/workload', icon: FiBarChart2, label: 'Workload Overview' },
        { path: '/coordinator/conflicts', icon: FiGrid, label: 'Conflict Check' },
        { path: '/coordinator/publish', icon: FiSend, label: 'Publish Timetable' }
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo Section */}
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🎓</span>
          {!collapsed && <span className="logo-text">UniSlot</span>}
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
      </div>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <span className="user-role">{user?.role?.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <FiLogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;