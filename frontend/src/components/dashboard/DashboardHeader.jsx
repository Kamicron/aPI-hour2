import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './DashboardHeader.css';

export default function DashboardHeader() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getFormattedDate = () => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const date = new Date().toLocaleDateString('fr-FR', options);
    return date.charAt(0).toUpperCase() + date.slice(1);
  };

  const getUserName = () => {
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Utilisateur';
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1 className="header-greeting">
          {getGreeting()}, {getUserName()}
        </h1>
        <p className="header-subtitle">
          Voici un aperçu de vos heures travaillées.
        </p>
      </div>

      <div className="header-right">
        <div className="header-date">
          <span className="material-icons date-icon">calendar_today</span>
          <span className="date-text">{getFormattedDate()}</span>
        </div>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <span className="material-icons">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
      </div>
    </header>
  );
}
