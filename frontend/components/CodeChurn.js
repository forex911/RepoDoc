import { Icons } from "./Icons"

export default function CodeChurn({ churn }) {
  if (!churn || churn.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.refreshCw}</span>
          <h2 className="card-title">Code Churn</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg">{Icons.refreshCw}</div>
          No churn data available
        </div>
      </div>
    )
  }

  const maxChanges = Math.max(...churn.map(c => c[1]))

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.refreshCw}</span>
        <h2 className="card-title">Code Churn</h2>
        <span className="card-subtitle">top {churn.length} files</span>
      </div>
      <div>
        {churn.map((item, i) => {
          const [filename, changes] = item
          const name = filename.split(/[/\\]/).pop()
          const pct = (changes / maxChanges) * 100
          return (
            <div key={i} style={{ marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span className="file-path" title={filename} style={{ fontSize: "0.78rem" }}>{name}</span>
              </div>
              <div className="churn-bar-container">
                <div className="churn-bar">
                  <div className="churn-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="churn-count">{changes}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
