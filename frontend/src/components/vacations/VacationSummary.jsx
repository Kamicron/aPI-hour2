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
              <span className="breakdown-dot" style={{ backgroundColor: 'var(--color-warning)' }}></span>
              <span className="breakdown-label">En attente</span>
            </div>
            <span className="breakdown-value">{stats.pendingDays} jours</span>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-left">
              <span className="breakdown-dot" style={{ backgroundColor: 'var(--color-success)' }}></span>
              <span className="breakdown-label">Validé</span>
            </div>
            <span className="breakdown-value">{stats.approvedDays} jours</span>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-left">
              <span className="breakdown-dot" style={{ backgroundColor: 'var(--color-info)' }}></span>
              <span className="breakdown-label">Maladie</span>
            </div>
            <span className="breakdown-value">{stats.sickLeaveDays} jours</span>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-left">
              <span className="breakdown-dot" style={{ backgroundColor: 'var(--color-secondary)' }}></span>
              <span className="breakdown-label">Jour férié</span>
            </div>
            <span className="breakdown-value">{stats.publicHolidayDays} jours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
