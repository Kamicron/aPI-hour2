import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const { theme } = useTheme();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'dashboard',
      path: '/dashboard',
      active: true
    },
    {
      id: 'sessions',
      label: 'Mes sessions',
      icon: 'schedule',
      path: '/sessions'
    },
    {
      id: 'calendar',
      label: 'Calendrier',
      icon: 'calendar_month',
      path: '/calendar'
    },
    {
      id: 'reports',
      label: 'Rapports',
      icon: 'assessment',
      path: '/reports'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: 'settings',
      path: '/settings'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <img
              src={theme === 'dark' ? '/images/logo/dark_api-hour.webp' : '/images/logo/white_api-hour.webp'}
              alt="aPI-Hour"
            />
          </div>
          <p>a<span className="sidebar-logo-text">PI</span>-Hour</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <a
            key={item.id}
            href={item.path}
            className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="material-icons nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-help">
          <span className="material-icons help-icon">help_outline</span>
          <span className="help-text">Besoin d'aide ?</span>
        </div>
      </div>
    </aside>
  );
}
