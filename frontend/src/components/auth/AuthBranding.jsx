import './AuthBranding.css';
import { useTheme } from '../../context/ThemeContext';

export default function AuthBranding() {
  const { theme } = useTheme();

  return (
    <div className="auth-branding">
      <div className="branding-content">
        <div className="logo">
          <div className="logo-icon">
            <img
              src={theme === 'dark' ? '/images/logo/dark_api-hour.webp' : '/images/logo/white_api-hour.webp'}
              alt="aPI-Hour"
            />
          </div>
          <h1 className="logo-text">
            a<span className="logo-highlight">PI</span>-Hour
          </h1>
        </div>

        <div className="tagline-container">
          <h2 className="tagline">Suivez vos heures simplement.</h2>
          <p className="description">
            Planifiez, suivez et analysez votre temps<br />
            de travail en toute simplicité.
          </p>
        </div>

      </div>
    </div>
  );
}
