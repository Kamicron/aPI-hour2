import React, { useState, useEffect } from 'react';
import './VacationModal.css';

const VacationModal = ({ isOpen, onClose, onSave, vacation, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    status: 'pending',
    reason: ''
  });

  useEffect(() => {
    if (vacation && mode === 'edit') {
      setFormData({
        startDate: vacation.startDate ? new Date(vacation.startDate).toISOString().split('T')[0] : '',
        endDate: vacation.endDate ? new Date(vacation.endDate).toISOString().split('T')[0] : '',
        status: vacation.status || 'pending',
        reason: vacation.reason || ''
      });
    } else {
      setFormData({
        startDate: '',
        endDate: '',
        status: 'pending',
        reason: ''
      });
    }
  }, [vacation, mode, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleCancel = () => {
    setFormData({
      startDate: '',
      endDate: '',
      status: 'pending',
      reason: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Modifier une absence' : 'Ajouter une absence'}</h2>
          <button className="modal-close" onClick={handleCancel}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="vacation-form">
          <div className="form-section">
            <label className="form-label">Type</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="pending">En attente</option>
              <option value="public_holiday">Jour férié</option>
              <option value="sick_leave">Maladie</option>
              <option value="approved">Validé</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date début</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date fin</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Commentaire</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Ajouter un commentaire..."
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleCancel} className="btn-cancel">
              Annuler
            </button>
            <button type="submit" className="btn-save">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VacationModal;
