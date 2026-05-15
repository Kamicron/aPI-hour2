import { useState, useEffect } from 'react';
import './WeekHistory.css';

export default function WeekHistory() {
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeekHistory();
  }, []);

  const fetchWeekHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/stats/week-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Week history data received:', data);
        console.log('Data is array:', Array.isArray(data));
        console.log('Data length:', data.length);
        if (data.length > 0) {
          console.log('First item:', data[0]);
        }
        setWeekData(data);
        console.log('State updated with data');
      } else {
        console.error('Failed to fetch week history:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching week history:', error);
    } finally {
      setLoading(false);
      console.log('Loading set to false');
    }
  };

  const formatTime = (time) => {
    if (!time) return '—';
    return time;
  };

  const formatDuration = (duration) => {
    if (!duration) return '—';
    return duration;
  };

  const getStatusClass = (status) => {
    if (status === 'Validée') return 'status-validated';
    if (status === 'En cours') return 'status-ongoing';
    return 'status-pending';
  };

  const getStatusIcon = (status) => {
    if (status === 'Validée') return '●';
    if (status === 'En cours') return '●';
    return '●';
  };

  return (
    <div className="week-history-widget">
      <div className="week-history-header">
        <span className="material-icons week-history-icon">calendar_today</span>
        <h3>Historique de la semaine</h3>
      </div>

      <div className="week-history-content">
        <table className="week-history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Pause</th>
              <th>Total</th>
              <th>Heures sup.</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="loading-cell">Chargement...</td>
              </tr>
            ) : weekData.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-cell">Aucune donnée disponible</td>
              </tr>
            ) : (
              weekData.map((day, index) => (
                <tr key={index}>
                  <td>
                    <div className="date-cell">
                      <span className="day-name">{day.dayName}</span>
                      <span className="day-date">{day.date}</span>
                    </div>
                  </td>
                  <td>{formatTime(day.startTime)}</td>
                  <td>{formatTime(day.endTime)}</td>
                  <td>{formatDuration(day.pauseDuration)}</td>
                  <td className="total-cell">{formatDuration(day.totalDuration)}</td>
                  <td className="overtime-cell">{formatDuration(day.overtime)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(day.status)}`}>
                      <span className="status-icon">{getStatusIcon(day.status)}</span>
                      {day.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="week-history-footer">
          <button className="view-calendar-button">
            <span className="material-icons">calendar_month</span>
            Afficher le calendrier complet
          </button>
        </div>
      </div>
    </div>
  );
}
