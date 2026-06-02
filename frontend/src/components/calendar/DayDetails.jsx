import { useEffect, useRef, useState } from 'react';
import './DayDetails.css';

export default function DayDetails({ selectedDay, onAddSession, onEditSession, onDeleteSession }) {
  if (!selectedDay) return null;

  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const menuContainerRef = useRef(null);

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuContainerRef.current) return;
      if (!menuContainerRef.current.contains(event.target)) {
        setMenuOpenIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="day-details">
      <div className="details-header">
        <div className="details-header-content">
          <span className="material-icons">event</span>
          <h3>Détails du jour</h3>
        </div>
        <button className="details-open-btn" onClick={() => window.location.href = `/day/${selectedDay.fullDate}`} title="Voir le détail du jour">
          <span className="material-icons">open_in_new</span>
        </button>
      </div>

      <div className="details-date">{selectedDay.fullDate}</div>
      <div className="details-total">Total : {selectedDay.totalDuration}</div>

      <div className="details-sessions" ref={menuContainerRef}>
        {selectedDay.sessions && selectedDay.sessions.length > 0 ? (
          selectedDay.sessions.map((session, idx) => (
            <div key={idx} className="detail-session">
              <div className="session-icon">
                <span className="material-icons">
                  {session.status === 'ongoing' ? 'play_circle' : 'check_circle'}
                </span>
              </div>
              <div className="session-info">
                <div className="session-time">
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </div>
                <div className="session-duration">{session.duration}</div>
                {session.pauseDuration && session.pauseDuration !== '00:00' && (
                  <div className="session-pause">Pause: {session.pauseDuration}</div>
                )}
                {session.comment && (
                  <div className="session-comment">{session.comment}</div>
                )}
              </div>
              <div className="session-menu">
                <button
                  className="session-menu-btn"
                  onClick={() => setMenuOpenIndex(menuOpenIndex === idx ? null : idx)}
                  title="Actions"
                >
                  <span className="material-icons">more_vert</span>
                </button>
                {menuOpenIndex === idx && (
                  <div className="session-menu-popup">
                    <button
                      className="session-menu-item"
                      onClick={() => {
                        setMenuOpenIndex(null);
                        onEditSession?.(session);
                      }}
                    >
                      <span className="material-icons">edit</span>
                      Éditer
                    </button>
                    <button
                      className="session-menu-item danger"
                      onClick={() => {
                        setMenuOpenIndex(null);
                        onDeleteSession?.(session);
                      }}
                    >
                      <span className="material-icons">delete</span>
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-sessions-message">
            <span className="material-icons">event_busy</span>
            <p>Aucune session pour ce jour</p>
          </div>
        )}
      </div>

      <button className="add-session-btn" onClick={onAddSession}>
        <span className="material-icons">add</span>
        Ajouter une session
      </button>
    </div>
  );
}
