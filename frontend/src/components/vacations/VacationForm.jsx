import { useState, useEffect } from 'react';
import './VacationForm.css';

export default function VacationForm({ vacation, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    if (vacation) {
      setFormData({
        type: vacation.status || '',
        startDate: vacation.startDate ? new Date(vacation.startDate).toISOString().split('T')[0] : '',
        endDate: vacation.endDate ? new Date(vacation.endDate).toISOString().split('T')[0] : '',
        reason: vacation.reason || ''
      });
    }
  }, [vacation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    // Réinitialiser le formulaire après sauvegarde
    setFormData({
      type: '',
      startDate: '',
      endDate: '',
      reason: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({
      type: '',
      startDate: '',
      endDate: '',
      reason: ''
    });
    onCancel();
  };

  return (
    <div className="vacation-form">
      <div className="form-header">
        <span className="material-icons">event</span>
        <h3>Ajouter / modifier une absence</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionner un type</option>
            <option value="pending">En attente</option>
            <option value="approved">Validé</option>
            <option value="sick_leave">Maladie</option>
            <option value="public_holiday">Jour férié</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date début</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
              <span className="material-icons calendar-icon">calendar_today</span>
            </div>
          </div>

          <div className="form-group">
            <label>Date fin</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
              <span className="material-icons calendar-icon">calendar_today</span>
            </div>
          </div>
        </div>


        <div className="form-group">
          <label>Commentaire</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Ajouter un commentaire..."
            rows="3"
          />
        </div>


        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={handleCancel}>
            Annuler
          </button>
          <button type="submit" className="btn-save">
            <span className="material-icons">save</span>
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
