import { useState, useEffect } from 'react';
import './WeeklyGoal.css';

export default function WeeklyGoal() {
  const [stats, setStats] = useState({
    weeklyGoal: 40,
    hoursWorked: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyStats();
  }, []);

  const fetchWeeklyStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/stats/weekly-hours', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          weeklyGoal: data.weeklyGoal,
          hoursWorked: data.hoursWorked,
          percentage: data.percentage
        });
      }
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = () => {
    if (stats.percentage >= 100) return 'var(--color-success)';
    if (stats.percentage >= 75) return 'var(--color-primary)';
    if (stats.percentage >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const hoursRemaining = Math.max(0, stats.weeklyGoal - stats.hoursWorked);

  return (
    <div className="weekly-goal-widget">
      <div className="weekly-goal-header">
        <span className="material-icons weekly-goal-icon">track_changes</span>
        <h3>Objectif hebdo</h3>
      </div>

      <div className="weekly-goal-content">
        <div className="weekly-goal-stats">
          <div className="weekly-goal-hours">
            <span className="hours-worked">{Math.round(stats.hoursWorked)}</span>
            <span className="hours-separator">/</span>
            <span className="hours-goal">{stats.weeklyGoal} h</span>
          </div>
          <div className="weekly-goal-percentage" style={{ color: getProgressColor() }}>
            {Math.round(stats.percentage)} %
          </div>
        </div>

        <div className="weekly-goal-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${Math.min(100, stats.percentage)}%`,
                backgroundColor: getProgressColor()
              }}
            />
          </div>
        </div>

        <p className="weekly-goal-message">
          {stats.percentage >= 100 
            ? '🎉 Objectif atteint !' 
            : `Il vous reste ${Math.round(hoursRemaining)}h pour atteindre votre objectif hebdomadaire.`
          }
        </p>
      </div>
    </div>
  );
}
