import { useState } from 'react';
import Input from './Input';
import './RegisterForm.css';

export default function RegisterForm({ onSubmit, loading = false }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, email, password, confirmPassword, acceptTerms });
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <Input
        type="text"
        value={name}
        onChange={setName}
        placeholder="Votre nom complet"
        label="Nom"
        icon="person"
      />

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

      <Input
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="••••••••••"
        label="Confirmer le mot de passe"
        icon="lock"
        showToggle={true}
      />

      <label className="accept-terms">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
        />
        <span>J'accepte les <a href="#cgu">CGU</a></span>
      </label>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? (
          <>
            <span className="material-icons rotating">hourglass_empty</span>
            Création...
          </>
        ) : (
          <>
            <span className="material-icons">person_add</span>
            Créer mon compte
          </>
        )}
      </button>
    </form>
  );
}
