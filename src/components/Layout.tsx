import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from './Header';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Header title={title} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="layout-container">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="sidebar-nav">
            <Link to="/" className="nav-item">
              📊 Главная
            </Link>
            <Link to="/bookings" className="nav-item">
              🎫 Мои бронирования
            </Link>
            <Link to="/search" className="nav-item">
              🔍 Поиск рейсов
            </Link>
            <Link to="/payments" className="nav-item">
              💳 История платежей
            </Link>
            <Link to="/notifications" className="nav-item">
              🔔 Уведомления
            </Link>
            <Link to="/profile" className="nav-item">
              👤 Мой профиль
            </Link>
          </nav>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};
