import { useTheme } from '../../context/ThemeContext';
import './MobileHeader.css';

export default function MobileHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="mobile-header">
      <div className="mobile-header-logo">
        <div className="mobile-logo-icon">
          <img
            src={theme === 'dark' ? '/images/logo/dark_api-hour.webp' : '/images/logo/white_api-hour.webp'}
            alt="aPI-Hour"
          />
        </div>
        <p>a<span className="sidebar-logo-text">PI</span>-Hour</p>
      </div>

      <div className="mobile-header-actions">
        <button
          className="mobile-theme-toggle"
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
