import { useLocation } from 'react-router-dom';
import './BottomNav.css';

export default function BottomNav() {
  const location = useLocation();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'dashboard',
      path: '/dashboard'
    },
    {
      id: 'calendar',
      label: 'Calendrier',
      icon: 'calendar_month',
      path: '/calendar'
    },
    {
      id: 'vacations',
      label: 'Vacances',
      icon: 'beach_access',
      path: '/vacations'
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
    <nav className="bottom-nav">
      {menuItems.map((item) => (
        <a
          key={item.id}
          href={item.path}
          className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
        >
          <span className="material-icons bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
