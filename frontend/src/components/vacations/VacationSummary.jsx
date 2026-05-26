import './VacationSummary.css';

export default function VacationSummary({ stats }) {
  return (
    <div className="vacation-summary">
      <div className="summary-header">
        <span className="material-icons">bar_chart</span>
        <h3>Résumé</h3>
      </div>

      <div className="summary-content">
        <div className="summary-main">
          <div className="summary-label">Jours à venir</div>
          <div className="summary-value">{stats.totalDays} jours</div>
          <div className="summary-sublabel">Solde restant: {stats.upcomingDays} jours</div>
        </div>

        <div className="summary-breakdown">
          <div className="breakdown-title">Répartition par type</div>
          
          <div className="breakdown-item">
            <div className="breakdown-left">
              <span className="breakdown-dot" style={{ backgroundColor: '#3b82f6' }}></span>
              <span className="breakdown-label">Congé payé</span>
            </div>
            <span className="breakdown-value">{stats.congePaye} jours</span>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-left">
              <span className="breakdown-dot" style={{ backgroundColor: '#8b5cf6' }}></span>
              <span className="breakdown-label">RTT</span>
            </div>
            <span className="breakdown-value">{stats.rtt} jour</span>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-left">
              <span className="breakdown-dot" style={{ backgroundColor: '#f59e0b' }}></span>
              <span className="breakdown-label">Maladie</span>
            </div>
            <span className="breakdown-value">{stats.maladie} jour</span>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-left">
              <span className="breakdown-dot" style={{ backgroundColor: '#10b981' }}></span>
              <span className="breakdown-label">Jour férié</span>
            </div>
            <span className="breakdown-value">{stats.jourFerie} jours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
