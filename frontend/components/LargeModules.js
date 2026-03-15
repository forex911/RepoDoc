import { Icons } from "./Icons"

export default function LargeModules({ modules }) {
  if (!modules || modules.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.package}</span>
          <h2 className="card-title">Large Modules</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg" style={{ color: "var(--success)" }}>{Icons.check}</div>
          No oversized modules detected
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.package}</span>
        <h2 className="card-title">Large Modules</h2>
        <span className="card-subtitle">{modules.length} found</span>
      </div>
      <table className="data-table">
        <thead>
          <tr><th>File</th><th>Lines</th><th>Status</th></tr>
        </thead>
        <tbody>
          {modules.map((m, i) => {
            const name = m.file.split(/[/\\]/).pop()
            return (
              <tr key={i}>
                <td><span className="file-path" title={m.file}>{name}</span></td>
                <td style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{m.lines.toLocaleString()}</td>
                <td><span className={`badge ${m.lines > 1000 ? "badge-danger" : "badge-warning"}`}><span className="badge-dot" />{m.lines > 1000 ? "very large" : "large"}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
