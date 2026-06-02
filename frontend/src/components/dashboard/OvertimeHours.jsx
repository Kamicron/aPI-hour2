import { useState, useEffect } from 'react';
import './OvertimeHours.css';
import axiosInstance from '../../api/axios';

export default function OvertimeHours() {
  const [stats, setStats] = useState({
    monthlyOvertime: 0,
    weeklyOvertime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOvertimeStats();
  }, []);

  const fetchOvertimeStats = async () => {
    try {
      const response = await axiosInstance.get('/stats/overtime');
      const data = response.data;
      setStats({
        monthlyOvertime: data.monthlyOvertime,
        weeklyOvertime: data.weeklyOvertime
      });
    } catch (error) {
      console.error('Error fetching overtime stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours) => {
    const absHours = Math.abs(hours);
    const h = Math.floor(absHours);
    const m = Math.round((absHours - h) * 60);

    if (h === 0) {
      return `${m}min`;
    }
    if (m === 0) {
      return `${h}h`;
    }
    return `${h}h${m.toString().padStart(2, '0')}`;
  };

  const getWeeklyComparisonText = () => {
    if (stats.weeklyOvertime === 0) {
      return 'Aucune heure sup cette semaine';
    }
    return `+${formatHours(stats.weeklyOvertime)} cette semaine`;
  };

  const getWeeklyComparisonClass = () => {
    if (stats.weeklyOvertime > 0) return 'positive';
    return 'neutral';
  };

  return (
    <div className="overtime-widget">
      <div className="overtime-header">
        <span className="material-icons overtime-icon">schedule</span>
        <h3>Heures supplémentaires</h3>
      </div>

      <div className="overtime-content">
        <div className="overtime-value">
          {formatHours(stats.monthlyOvertime)}
        </div>
        <p className="overtime-subtitle">Accumulées ce mois</p>

        <div className={`overtime-weekly ${getWeeklyComparisonClass()}`}>
          {getWeeklyComparisonText()}
          {stats.weeklyOvertime > 0 && (
            <span className="material-icons overtime-trend-icon">trending_up</span>
          )}
        </div>
      </div>
    </div>
  );
}
