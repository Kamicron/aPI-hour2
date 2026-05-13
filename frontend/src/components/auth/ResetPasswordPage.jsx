import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Input from './Input';
import AuthBranding from './AuthBranding';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import './AuthPage.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token de réinitialisation manquant');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data || 'Échec de la réinitialisation. Le lien a peut-être expiré.');
      setLoading(false);
    }
  };

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
                Réinitialiser le mot de passe
              </h2>
            </div>

            {error && (
              <div className="auth-error">
                <span className="material-icons">error</span>
                {error}
              </div>
            )}

            {success ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl) 0' }}>
                <span className="material-icons" style={{ fontSize: '64px', color: 'var(--color-success)' }}>
                  check_circle
                </span>
                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                  Mot de passe réinitialisé avec succès !<br />
                  Redirection vers la connexion...
                </p>
              </div>
            ) : (
              <form className="login-form" onSubmit={handleSubmit}>
                <Input
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Nouveau mot de passe"
                  label="Nouveau mot de passe"
                  icon="lock"
                  showToggle={true}

                />

                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirmez le mot de passe"
                  label="Confirmer le mot de passe"
                  icon="lock"
                  showToggle={true}

                />

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading || !token}
                >
                  {loading ? (
                    <>
                      <span className="material-icons rotating">hourglass_empty</span>
                      Réinitialisation...
                    </>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    Retour à la connexion
                  </button>
                </div>
              </form>
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
