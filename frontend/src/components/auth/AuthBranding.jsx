import './AuthBranding.css';

export default function AuthBranding() {
  return (
    <div className="auth-branding">
      <div className="branding-content">
        <div className="logo">
          <div className="logo-icon">
            <span className="material-icons">schedule</span>
          </div>
          <h1 className="logo-text">
            a<span className="logo-highlight">PI</span>-Hour
          </h1>
        </div>

        <h2 className="tagline">Suivez vos heures simplement.</h2>

        <p className="description">
          Planifiez, suivez et analysez votre temps<br />
          de travail en toute simplicité.
        </p>
      </div>
    </div>
  );
}
