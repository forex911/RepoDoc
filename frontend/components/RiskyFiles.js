import { Icons } from "./Icons"

export default function RiskyFiles({ files }) {
  if (!files || files.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.alertTriangle}</span>
          <h2 className="card-title">Risky Files</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg" style={{ color: "var(--success)" }}>{Icons.check}</div>
          No high-risk files detected
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.alertTriangle}</span>
        <h2 className="card-title">Risky Files</h2>
        <span className="card-subtitle">{files.length} found</span>
      </div>
      <div>
        {files.map((f, i) => {
          const severity = f.complexity > 10 ? "high" : "medium"
          const fileName = f.file.split(/[/\\]/).pop()
          return (
            <div key={i} className={`risky-row severity-${severity}`}>
              <div>
                <div className="risky-file-name" title={f.file}>{fileName}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem", fontFamily: "var(--font-mono)" }}>{f.file}</div>
              </div>
              <div className="risky-meta">
                <span className={`badge ${severity === "high" ? "badge-danger" : "badge-warning"}`}>
                  <span className="badge-dot" /> {severity}
                </span>
                <span className="badge badge-info">C:{f.complexity}</span>
                {f.changes && <span className="badge badge-info">{f.changes}x</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}