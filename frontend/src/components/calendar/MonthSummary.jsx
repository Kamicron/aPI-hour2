import "./MonthSummary.css";

export default function MonthSummary({ monthStats }) {
  if (!monthStats) return null;

  const isMissing =
    typeof monthStats.balanceHours === "number"
      ? monthStats.balanceHours < 0
      : false;
  const balanceLabel = isMissing ? "Heures manquantes" : "Heures sup";
  const balanceValue = isMissing
    ? monthStats.missingHours || "0h 00m"
    : monthStats.overtimeHours;

  return (
    <div className="month-summary">
      <div className="summary-header">
        <span className="material-icons">bar_chart</span>
        <h3>Résumé du mois</h3>
      </div>
      <div className="summary-stats">
        <div className="summary-stat">
          <span className="stat-label">Heures réalisées</span>
          <span className="stat-value">{monthStats.totalHours}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Objectif</span>
          <span className="stat-value">{monthStats.goalHours}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">{balanceLabel}</span>
          <span className="stat-value">{balanceValue}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Progression</span>
          <span className="stat-value">{monthStats.progress}%</span>
        </div>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(monthStats.progress, 100)}%` }}
        ></div>
      </div>
      <p className="summary-period">
        Période : {monthStats.periodStart} - {monthStats.periodEnd}
      </p>
    </div>
  );
}
