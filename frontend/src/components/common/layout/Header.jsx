import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiMenu, FiBell, FiUser,
  FiSettings, FiLogOut, FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import './Header.css';

const Header = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const role = user?.role || 'admin';

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  /* close dropdown when clicking outside */
  React.useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.header__user')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  return (
    <header className="header">
      {/* Left */}
      <div className="header__left">
        <button
          className="header__menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <FiMenu size={20} />
        </button>
        <h1 className="header__title">{title}</h1>
      </div>

      {/* Right */}
      <div className="header__right">
        {/* Notification Bell */}
        <button className="header__icon-btn" title="Notifications">
          <FiBell size={18} />
          <span className="header__notif-dot" />
        </button>

        {/* User Menu */}
        <div className="header__user">
          <button
            className="header__user-btn"
            onClick={() => setDropdownOpen(p => !p)}
            aria-expanded={dropdownOpen}
          >
            <div className="header__avatar">{initials}</div>
            <div className="header__user-info">
              <span className="header__user-name">{user?.name || 'User'}</span>
              <span className="header__user-role">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            </div>
            <FiChevronDown
              size={15}
              className={`header__chevron ${dropdownOpen ? 'rotated' : ''}`}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="header__dropdown">
              {/* User info header */}
              <div className="header__dropdown-header">
                <div className="header__dropdown-avatar">{initials}</div>
                <div>
                  <span className="header__dropdown-name">{user?.name}</span>
                  <span className="header__dropdown-email">{user?.email}</span>
                </div>
              </div>

              <div className="header__dropdown-divider" />

              {/* Links */}
              <Link
                to={`/${role}/profile`}
                className="header__dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <FiUser size={15} /> My Profile
              </Link>

              <Link
                to={`/${role}/settings`}
                className="header__dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <FiSettings size={15} /> Settings
              </Link>

              <div className="header__dropdown-divider" />

              <button
                className="header__dropdown-item header__dropdown-item--danger"
                onClick={handleLogout}
              >
                <FiLogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;