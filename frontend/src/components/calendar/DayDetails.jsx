import './DayDetails.css';

export default function DayDetails({ selectedDay, onAddSession }) {
  if (!selectedDay) return null;

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  return (
    <div className="day-details">
      <div className="details-header">
        <span className="material-icons">event</span>
        <h3>Détails du jour</h3>
      </div>
      <div className="details-date">{selectedDay.fullDate}</div>
      <div className="details-total">Total : {selectedDay.totalDuration}</div>
      
      <div className="details-sessions">
        {selectedDay.sessions.map((session, idx) => (
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
            </div>
            <button className="session-menu-btn">
              <span className="material-icons">more_vert</span>
            </button>
          </div>
        ))}
      </div>
      
      <button className="add-session-btn" onClick={onAddSession}>
        <span className="material-icons">add</span>
        Ajouter une session
      </button>
    </div>
  );
}
