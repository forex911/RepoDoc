import { Icons } from "./Icons"

export default function RiskDashboard({ predictions }) {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.barChart}</span>
          <h2 className="card-title">Bug Risk Prediction</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg" style={{ color: "var(--success)" }}>{Icons.check}</div>
          No high-risk files predicted
        </div>
      </div>
    )
  }

  const maxScore = Math.max(...predictions.map(p => p.risk_score))

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.barChart}</span>
        <h2 className="card-title">Bug Risk Prediction</h2>
        <span className="card-subtitle">Top {predictions.length}</span>
      </div>
      <div>
        {predictions.map((p, i) => {
          const pct = (p.risk_score / Math.max(maxScore, 0.01)) * 100
          const severity = p.risk_score >= 0.7 ? "critical" : p.risk_score >= 0.4 ? "high" : "medium"
          const fileName = p.file.split(/[/\\]/).pop()

          return (
            <div key={i} className="risk-item">
              <div className="risk-item-header">
                <div className="risk-item-info">
                  <span className="risk-rank">#{i + 1}</span>
                  <div>
                    <div className="risk-file-name" title={p.file}>{fileName}</div>
                    <div className="risk-file-path">{p.file}</div>
                  </div>
                </div>
                <div className="risk-item-meta">
                  <span className={`badge ${
                    severity === "critical" ? "badge-danger" :
                    severity === "high" ? "badge-warning" : "badge-info"
                  }`}>
                    <span className="badge-dot" /> {severity}
                  </span>
                  <span className="risk-score-value">{p.risk_score}</span>
                </div>
              </div>
              <div className="risk-bar">
                <div
                  className={`risk-bar-fill risk-bar-${severity}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {(p.complexity !== undefined || p.churn !== undefined || p.size !== undefined) && (
                <div className="risk-factors">
                  {p.complexity > 0 && <span className="risk-factor">Complexity: {p.complexity}</span>}
                  {p.churn > 0 && <span className="risk-factor">Churn: {p.churn}</span>}
                  {p.size > 0 && <span className="risk-factor">Size: {p.size}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
