import { useState } from 'react';
import Input from './Input';
import './ForgotPasswordModal.css';

export default function ForgotPasswordModal({ onClose, onSubmit }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(email);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Mot de passe oublié</h2>
          <button className="close-btn" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {success ? (
          <div className="success-message">
            <span className="material-icons">check_circle</span>
            <p>Un email de réinitialisation a été envoyé à votre adresse.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="modal-description">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <Input
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="vous@exemple.com"
              label="Email"
              icon="mail"
            />

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                Annuler
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="material-icons rotating">hourglass_empty</span>
                    Envoi...
                  </>
                ) : (
                  'Envoyer'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
