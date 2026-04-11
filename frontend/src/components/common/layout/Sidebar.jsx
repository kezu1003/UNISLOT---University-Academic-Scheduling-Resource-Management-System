import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiUsers, FiBook, FiLayers, FiMapPin,
  FiCalendar, FiBarChart2, FiSend,
  FiGrid, FiChevronDown, FiChevronRight,
  FiLogOut, FiUser, FiSettings,
  FiMenu, FiX, FiCpu
} from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

/* ─── Nav Config per role ─────────────────────────── */
const NAV = {
  admin: [
    {
      group: 'Main',
      items: [
        { label: 'Dashboard',  to: '/admin',         icon: FiGrid,    exact: true },
      ]
    },
    {
      group: 'Management',
      items: [
        { label: 'Staff',      to: '/admin/staff',    icon: FiUsers   },
        { label: 'Batches',    to: '/admin/batches',  icon: FiLayers  },
        { label: 'Courses',    to: '/admin/courses',  icon: FiBook    },
        { label: 'Halls',      to: '/admin/halls',    icon: FiMapPin  },
      ]
    }
  ],
  lic: [
    {
      group: 'Main',
      items: [
        { label: 'Dashboard',        to: '/lic',           icon: FiGrid,   exact: true },
      ]
    },
    {
      group: 'Courses',
      items: [
        { label: 'My Courses',       to: '/lic/courses',   icon: FiBook    },
        { label: 'Assign Staff',     to: '/lic/assign',    icon: FiUsers   },
      ]
    }
  ],
  coordinator: [
    {
      group: 'Main',
      items: [
        { label: 'Dashboard',        to: '/coordinator',              icon: FiGrid,     exact: true },
      ]
    },
    {
      group: 'Scheduling',
      items: [
        { label: 'Timetable',        to: '/coordinator/timetable',    icon: FiCalendar  },
        { label: 'Schedule Classes', to: '/coordinator/schedule',     icon: FiCpu       },
        { label: 'Workload',         to: '/coordinator/workload',     icon: FiBarChart2 },
        { label: 'Publish',          to: '/coordinator/publish',      icon: FiSend      },
      ]
    }
  ]
};

/* ─── Sidebar Component ───────────────────────────── */
const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const role     = user?.role || 'admin';
  const navGroups = NAV[role] || NAV.admin;

  /* close mobile sidebar on route change */
  useEffect(() => {
    if (onMobileClose) onMobileClose();
  }, [location.pathname]);

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside
        className={[
          'sidebar',
          collapsed     ? 'sidebar--collapsed' : '',
          mobileOpen    ? 'sidebar--mobile-open' : ''
        ].filter(Boolean).join(' ')}
      >
        {/* ── Brand ────────────────────────────── */}
        <div className="sidebar__brand">
          <div className="sidebar__brand-logo">
            <FiCalendar size={20} />
          </div>
          {!collapsed && (
            <span className="sidebar__brand-name">UniSlot</span>
          )}
          <button
            className="sidebar__collapse-btn"
            onClick={() => setCollapsed(p => !p)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <FiChevronRight size={16} /> : <FiMenu size={16} />}
          </button>
        </div>

        {/* ── Nav ──────────────────────────────── */}
        <nav className="sidebar__nav">
          {navGroups.map((group) => (
            <div key={group.group} className="sidebar__group">
              {!collapsed && (
                <span className="sidebar__group-label">{group.group}</span>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    ['sidebar__link', isActive ? 'sidebar__link--active' : ''].join(' ')
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={18} className="sidebar__link-icon" />
                  {!collapsed && (
                    <span className="sidebar__link-label">{item.label}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Footer ───────────────────────────── */}
        <div className="sidebar__footer">
          {/* Profile Link */}
          <NavLink
            to={`/${role}/profile`}
            className={({ isActive }) =>
              ['sidebar__footer-link', isActive ? 'sidebar__footer-link--active' : ''].join(' ')
            }
            title={collapsed ? 'My Profile' : undefined}
          >
            <div className="sidebar__footer-avatar">{initials}</div>
            {!collapsed && (
              <div className="sidebar__footer-info">
                <span className="sidebar__footer-name">
                  {user?.name || 'User'}
                </span>
                <span className="sidebar__footer-role">
                  {user?.role?.toUpperCase() || 'ROLE'}
                </span>
              </div>
            )}
          </NavLink>

          {/* Settings */}
          <NavLink
            to={`/${role}/settings`}
            className={({ isActive }) =>
              ['sidebar__icon-btn', isActive ? 'sidebar__icon-btn--active' : ''].join(' ')
            }
            title="Settings"
          >
            <FiSettings size={17} />
            {!collapsed && <span>Settings</span>}
          </NavLink>

          {/* Logout */}
          <button
            className="sidebar__icon-btn sidebar__icon-btn--logout"
            onClick={handleLogout}
            title="Logout"
          >
            <FiLogOut size={17} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;