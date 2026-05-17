import './DeleteConfirmModal.css';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-icon">
          <span className="material-icons">warning</span>
        </div>
        
        <h2 className="delete-modal-title">{title || 'Confirmer la suppression'}</h2>
        <p className="delete-modal-message">
          {message || 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.'}
        </p>

        <div className="delete-modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-delete" onClick={onConfirm}>
            <span className="material-icons">delete</span>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
