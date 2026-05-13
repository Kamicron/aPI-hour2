import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthBranding from '../components/auth/AuthBranding';
import AuthTabs from '../components/auth/AuthTabs';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import './AuthPage.css';

export default function AuthPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname === '/register' ? 'register' : 'login'
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();

  useEffect(() => {
    setActiveTab(location.pathname === '/register' ? 'register' : 'login');
  }, [location.pathname]);

  const handleLogin = async (data) => {
    setError('');
    setEmailNotVerified(null);
    setLoading(true);

    try {
      const response = await authService.login(data.email, data.password);

      // Gérer "Se souvenir de moi"
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
      }

      login(response.token, { email: data.email });
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.error === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(err.response.data.email);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data || 'Échec de la connexion. Vérifiez vos identifiants.');
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email) => {
    await authService.forgotPassword(email);
  };

  const handleRegister = async (data) => {
    setError('');

    if (data.password !== data.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!data.acceptTerms) {
      setError('Vous devez accepter les CGU');
      return;
    }

    if (data.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(data.email, data.password, data.name);
      setRegistrationSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data || 'Échec de l\'inscription. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!emailNotVerified) return;

    try {
      await authService.resendVerification(emailNotVerified);
      setError('Email de vérification renvoyé. Vérifiez votre boîte mail.');
      setEmailNotVerified(null);
    } catch (err) {
      setError('Échec de l\'envoi de l\'email de vérification.');
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
            <AuthTabs
              activeTab={activeTab}
              onTabChange={(tab) => {
                setError('');
                navigate(tab === 'login' ? '/login' : '/register');
              }}
            />

            {registrationSuccess && (
              <div style={{
                padding: 'var(--spacing-lg)',
                backgroundColor: 'var(--color-success-bg, #d4edda)',
                color: 'var(--color-success, #155724)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-lg)',
                textAlign: 'center'
              }}>
                <span className="material-icons" style={{ fontSize: '48px', marginBottom: 'var(--spacing-sm)' }}>mark_email_read</span>
                <p style={{ margin: '0 0 var(--spacing-sm) 0', fontWeight: 'var(--font-weight-semibold)' }}>
                  Inscription réussie !
                </p>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                  Un email de vérification a été envoyé. Vérifiez votre boîte mail pour activer votre compte.
                </p>
              </div>
            )}

            {error && (
              <div className="auth-error">
                <span className="material-icons">error</span>
                {error}
                {emailNotVerified && (
                  <button
                    onClick={handleResendVerification}
                    style={{
                      marginTop: 'var(--spacing-md)',
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    Renvoyer l'email de vérification
                  </button>
                )}
              </div>
            )}

            {activeTab === 'login' ? (
              <LoginForm
                onSubmit={handleLogin}
                onSwitchToRegister={() => {
                  setError('');
                  navigate('/register');
                }}
                onForgotPassword={() => setShowForgotPassword(true)}
                loading={loading}
              />
            ) : (
              <RegisterForm
                onSubmit={handleRegister}
                loading={loading}
              />
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

      {showForgotPassword && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPassword(false)}
          onSubmit={handleForgotPassword}
        />
      )}
    </div>
  );
}
