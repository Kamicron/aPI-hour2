import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthBranding from '../components/auth/AuthBranding';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import './AuthPage.css';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Token de vérification manquant');
        setLoading(false);
        return;
      }

      try {
        await authService.verifyEmail(token);
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setError(err.response?.data || 'Échec de la vérification. Le lien a peut-être expiré.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-left">
        <AuthBranding />
      </div>

      <div className="auth-right">
        <div className="auth-header">
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

        <div className="auth-content">
          <div className="auth-card">
            <div className="auth-tabs">
              <h2 style={{ textAlign: 'center', margin: '0 0 var(--spacing-lg) 0' }}>
                Vérification d'email
              </h2>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl) 0' }}>
                <span className="material-icons rotating" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>
                  hourglass_empty
                </span>
                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                  Vérification en cours...
                </p>
              </div>
            ) : success ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl) 0' }}>
                <span className="material-icons" style={{ fontSize: '64px', color: 'var(--color-success)' }}>
                  check_circle
                </span>
                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                  Email vérifié avec succès !<br />
                  Redirection vers la connexion...
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl) 0' }}>
                <span className="material-icons" style={{ fontSize: '64px', color: 'var(--color-error)' }}>
                  error
                </span>
                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                  {error}
                </p>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    marginTop: 'var(--spacing-lg)',
                    padding: '12px 24px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-base)'
                  }}
                >
                  Retour à la connexion
                </button>
              </div>
            )}
          </div>

          <footer className="auth-footer">
            <a href="#confidentialite">Confidentialité</a>
            <span>•</span>
            <a href="#cgu">CGU</a>
            <span>•</span>
            <a href="#support">Support</a>
          </footer>
        </div>
      </div>
    </div>
  );
}
