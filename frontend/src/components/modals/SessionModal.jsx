import { useState, useEffect } from 'react';
import './SessionModal.css';

export default function SessionModal({ isOpen, onClose, onSave, session, date }) {
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    pauses: []
  });

  useEffect(() => {
    if (session) {
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      setFormData({
        startDate: date || formatDate(session.startTime),
        startTime: formatTime(session.startTime),
        endDate: date || formatDate(session.endTime),
        endTime: formatTime(session.endTime),
        pauses: (session.pauses || []).map(pause => ({
          pauseDate: date || formatDate(pause.pauseStart),
          pauseStart: formatTime(pause.pauseStart),
          pauseEnd: formatTime(pause.pauseEnd)
        }))
      });
    } else if (date) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setFormData({
        startDate: date,
        startTime: `${hours}:${minutes}`,
        endDate: date,
        endTime: '',
        pauses: []
      });
    }
  }, [session, date]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const combinedData = {
      startTime: `${formData.startDate}T${formData.startTime}`,
      endTime: formData.endTime ? `${formData.endDate}T${formData.endTime}` : null,
      pauses: formData.pauses.map(pause => ({
        pauseStart: `${pause.pauseDate}T${pause.pauseStart}`,
        pauseEnd: pause.pauseEnd ? `${pause.pauseDate}T${pause.pauseEnd}` : null
      }))
    };

    onSave(combinedData);
  };

  const handleAddPause = () => {
    setFormData({
      ...formData,
      pauses: [...formData.pauses, { pauseDate: formData.startDate, pauseStart: '', pauseEnd: '' }]
    });
  };

  const handleRemovePause = (index) => {
    setFormData({
      ...formData,
      pauses: formData.pauses.filter((_, i) => i !== index)
    });
  };

  const handlePauseChange = (index, field, value) => {
    const newPauses = [...formData.pauses];
    newPauses[index][field] = value;
    setFormData({ ...formData, pauses: newPauses });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{session ? 'Modifier la session' : 'Ajouter une session'}</h2>
          <button className="modal-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Date *</label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value, endDate: e.target.value })}
                disabled={!!date}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="startTime">Heure de début *</label>
              <input
                type="time"
                id="startTime"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="endTime">Heure de fin</label>
            <input
              type="time"
              id="endTime"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>

          <div className="pauses-section">
            <div className="pauses-header">
              <h3>Pauses</h3>
              <button type="button" className="add-pause-btn" onClick={handleAddPause}>
                <span className="material-icons">add</span>
                Ajouter une pause
              </button>
            </div>

            {formData.pauses.map((pause, index) => (
              <div key={index} className="pause-item">
                <div className="pause-fields">
                  <div className="form-group">
                    <label>Début</label>
                    <input
                      type="time"
                      value={pause.pauseStart}
                      onChange={(e) => handlePauseChange(index, 'pauseStart', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fin</label>
                    <input
                      type="time"
                      value={pause.pauseEnd}
                      onChange={(e) => handlePauseChange(index, 'pauseEnd', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="remove-pause-btn"
                  onClick={() => handleRemovePause(index)}
                >
                  <span className="material-icons">delete</span>
                </button>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              {session ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
