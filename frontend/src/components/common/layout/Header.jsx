import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMenu, FiBell, FiSearch, FiSun, FiMoon,
  FiChevronDown, FiUser, FiSettings, FiLogOut
} from 'react-icons/fi';
// context folder is three levels up from common/layout
import { useAuth } from '../../../context/AuthContext';
import './Header.css';

const initialNotifications = [
  { id: 1, text: 'New course assignment pending', time: '5 min ago', unread: true },
  { id: 2, text: 'Timetable published for Y2.S1.WD.IT', time: '1 hour ago', unread: true },
  { id: 3, text: 'Workload updated for Dr. Smith', time: '3 hours ago', unread: false }
];

const Header = ({ onMenuClick, title }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const { user, logout } = useAuth();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', !darkMode ? 'dark' : 'light');
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      unread: false
    })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;
  const baseRoute = user?.role ? `/${user.role}` : '';

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn hide-desktop" onClick={onMenuClick}>
          <FiMenu size={24} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="header-center hide-mobile">
        <div className="search-bar">
          <FiSearch size={18} />
          <input 
            type="text" 
            placeholder="Search courses, staff, batches..." 
          />
        </div>
      </div>

      <div className="header-right">
        {/* Dark Mode Toggle */}
        <button className="icon-btn" onClick={toggleDarkMode} title="Toggle theme">
          {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>

        {/* Notifications */}
        <div className="dropdown">
          <button 
            className="icon-btn notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FiBell size={20} />
            {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="dropdown-menu notifications-menu">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                <button className="mark-read-btn" onClick={markAllAsRead}>Mark all as read</button>
              </div>
              <div className="dropdown-body">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.unread ? 'unread' : ''}`}
                  >
                    <p>{notification.text}</p>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                ))}
              </div>
              <div className="dropdown-footer">
                <Link to={`${baseRoute}/notifications`}>View all notifications</Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="dropdown">
          <button 
            className="profile-btn"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="profile-name hide-mobile">{user?.name}</span>
            <FiChevronDown size={16} className="hide-mobile" />
          </button>

          {showProfile && (
            <div className="dropdown-menu profile-menu">
              <div className="profile-info">
                <div className="profile-avatar large">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="profile-name">{user?.name}</p>
                  <p className="profile-email">{user?.email}</p>
                </div>
              </div>
              <div className="dropdown-divider" />
              <Link
                to={`${baseRoute}/profile`}
                className="dropdown-item"
                onClick={() => setShowProfile(false)}
              >
                <FiUser size={18} />
                <span>My Profile</span>
              </Link>
              <Link
                to={`${baseRoute}/settings`}
                className="dropdown-item"
                onClick={() => setShowProfile(false)}
              >
                <FiSettings size={18} />
                <span>Settings</span>
              </Link>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={logout}>
                <FiLogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
