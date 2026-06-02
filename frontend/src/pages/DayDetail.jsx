import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import SessionModal from '../components/modals/SessionModal';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import './DayDetail.css';
import axiosInstance from '../api/axios';

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
      const response = await axiosInstance.get(`/stats/day-detail/${date}`);
      const data = response.data;
      setSessions(data.sessions || []);
      setDayStats(data.stats);
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
      if (editingSession) {
        await axiosInstance.put(`/time-entries/${editingSession.id}`, formData);
      } else {
        await axiosInstance.post('/time-entries', formData);
      }

      setIsModalOpen(false);
      setEditingSession(null);
      fetchDayData();
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
      await axiosInstance.delete(`/time-entries/${sessionToDelete.id}`);
      setDeleteModalOpen(false);
      setSessionToDelete(null);
      fetchDayData();
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

  const getAdjacentDate = (dateStr, deltaDays) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + deltaDays);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  const getCalendarUrlForDate = (dateStr) => {
    const [y, m] = dateStr.split('-');
    const year = String(y);
    const month = String(m).padStart(2, '0');
    return `/calendar?year=${year}&month=${month}&day=${dateStr}`;
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
          <button className="back-button" onClick={() => navigate(getCalendarUrlForDate(date))}>
            <span className="material-icons">arrow_back</span>
            Retour
          </button>
          <div className="day-detail-title-row">
            <button
              className="day-nav-btn"
              onClick={() => navigate(`/day/${getAdjacentDate(date, -1)}`)}
              title="Jour précédent"
            >
              <span className="material-icons">chevron_left</span>
            </button>
            <h1 className="day-detail-title">{formatDate(date)}</h1>
            <button
              className="day-nav-btn"
              onClick={() => navigate(`/day/${getAdjacentDate(date, 1)}`)}
              title="Jour suivant"
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="day-detail-scroll">
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
                      {session.comment && (
                        <div className="session-comment">{session.comment}</div>
                      )}
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
