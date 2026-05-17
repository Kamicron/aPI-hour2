import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import SessionModal from '../components/modals/SessionModal';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import './DayDetail.css';

export default function DayDetail() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [dayStats, setDayStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  useEffect(() => {
    fetchDayData();
  }, [date]);

  const fetchDayData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/stats/day-detail/${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        setDayStats(data.stats);
      } else {
        console.error('Failed to fetch day data');
      }
    } catch (error) {
      console.error('Error fetching day data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = () => {
    setEditingSession(null);
    setIsModalOpen(true);
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setIsModalOpen(true);
  };

  const handleSaveSession = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingSession
        ? `http://localhost:8080/api/time-entries/${editingSession.id}`
        : 'http://localhost:8080/api/time-entries';
      const method = editingSession ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingSession(null);
        fetchDayData();
      } else {
        console.error('Failed to save session');
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleDeleteClick = (session) => {
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/time-entries/${sessionToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDeleteModalOpen(false);
        setSessionToDelete(null);
        fetchDayData();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDuration = (duration) => {
    if (!duration) return '—';
    return duration;
  };

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${days[date.getDay()]} ${day} ${months[date.getMonth()]} ${year}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="day-detail-loading">Chargement...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="day-detail-container">
        <div className="day-detail-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            <span className="material-icons">arrow_back</span>
            Retour
          </button>
          <h1 className="day-detail-title">{formatDate(date)}</h1>
        </div>

        {dayStats && (
          <div className="day-stats-card">
            <h2 className="stats-title">Récapitulatif de la journée</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Début</span>
                <span className="stat-value">{formatTime(dayStats.startTime)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Fin</span>
                <span className="stat-value">{formatTime(dayStats.endTime)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pause totale</span>
                <span className="stat-value">{formatDuration(dayStats.totalPause)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Temps total</span>
                <span className="stat-value highlight">{formatDuration(dayStats.totalDuration)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Heures sup.</span>
                <span className={`stat-value ${dayStats.overtime && dayStats.overtime !== '00:00' ? 'overtime-positive' : ''}`}>
                  {formatDuration(dayStats.overtime)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Statut</span>
                <span className={`stat-badge ${dayStats.status === 'Validée' ? 'status-validated' : 'status-ongoing'}`}>
                  {dayStats.status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="sessions-section">
          <div className="sessions-header">
            <h2 className="sessions-title">Sessions de la journée</h2>
            <button className="add-session-button" onClick={handleAddSession}>
              <span className="material-icons">add</span>
              Ajouter une session
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="no-sessions">
              <span className="material-icons">event_busy</span>
              <p>Aucune session enregistrée pour cette journée</p>
            </div>
          ) : (
            <div className="sessions-list">
              {sessions.map((session, index) => (
                <div key={session.id} className="session-card">
                  <div className="session-number">Session {index + 1}</div>
                  <div className="session-details">
                    <div className="session-time-range">
                      <div className="time-item">
                        <span className="material-icons">login</span>
                        <span className="time-label">Début</span>
                        <span className="time-value">{formatTime(session.startTime)}</span>
                      </div>
                      <div className="time-separator">→</div>
                      <div className="time-item">
                        <span className="material-icons">logout</span>
                        <span className="time-label">Fin</span>
                        <span className="time-value">{formatTime(session.endTime)}</span>
                      </div>
                    </div>
                    <div className="session-stats">
                      <div className="session-stat">
                        <span className="material-icons">pause_circle</span>
                        <span className="stat-text">
                          <span className="stat-label-small">Pause</span>
                          <span className="stat-value-small">{formatDuration(session.pauseDuration)}</span>
                        </span>
                      </div>
                      <div className="session-stat">
                        <span className="material-icons">schedule</span>
                        <span className="stat-text">
                          <span className="stat-label-small">Durée</span>
                          <span className="stat-value-small">{formatDuration(session.duration)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="session-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditSession(session)}
                      title="Modifier"
                    >
                      <span className="material-icons">edit</span>
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteClick(session)}
                      title="Supprimer"
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <SessionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSession(null);
          }}
          onSave={handleSaveSession}
          session={editingSession}
          date={date}
        />

        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSessionToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Supprimer la session"
          message="Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible."
        />
      </div>
    </DashboardLayout>
  );
}
