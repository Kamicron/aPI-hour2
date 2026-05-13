import { useState, useEffect } from 'react';
import Input from './Input';
import './LoginForm.css';

export default function LoginForm({ onSubmit, onSwitchToRegister, onForgotPassword, loading = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const wasRemembered = localStorage.getItem('rememberMe') === 'true';

    if (savedEmail && wasRemembered) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password, rememberMe });
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    onForgotPassword();
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <Input
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="vous@exemple.com"
        label="Email"
        icon="mail"
      />

      <Input
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••••"
        label="Mot de passe"
        icon="lock"
        showToggle={true}
      />

      <div className="login-options">
        <label className="remember-me">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Se souvenir de moi</span>
        </label>
        <button type="button" onClick={handleForgotPassword} className="forgot-password">
          Mot de passe oublié ?
        </button>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? (
          <>
            <span className="material-icons rotating">hourglass_empty</span>
            Connexion...
          </>
        ) : (
          <>
            <span className="material-icons">person</span>
            Se connecter
          </>
        )}
      </button>

      {/* <div className="divider">
        <span>ou</span>
      </div> */}

      <div className="create-account">
        Pas de compte ? <button type="button" onClick={onSwitchToRegister} className="switch-link">Créer un compte</button>
      </div>
    </form>
  );
}
