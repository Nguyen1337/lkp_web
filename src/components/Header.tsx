import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Личный кабинет', onMenuClick }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <button className="menu-toggle" onClick={onMenuClick}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <Link to="/" className="logo">
            LKP
          </Link>
          <h1 className="header-title">{title}</h1>
        </div>

        <div className="header-right">
          <div className="notifications">
            <button className="notification-btn">
              🔔
              <span className="notification-badge">2</span>
            </button>
          </div>

          <div className="user-menu">
            <button
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-avatar">👤</span>
              <span className="user-name">Пассажир</span>
            </button>

            {showUserMenu && (
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item">
                  Мой профиль
                </Link>
                <Link to="/settings" className="dropdown-item">
                  Параметры
                </Link>
                <button
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  Выход
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
