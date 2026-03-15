import { Icons } from "./Icons"

export default function ComplexFunctions({ functions }) {
  if (!functions || functions.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.puzzle}</span>
          <h2 className="card-title">Complex Functions</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg" style={{ color: "var(--success)" }}>{Icons.check}</div>
          No overly complex functions detected
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.puzzle}</span>
        <h2 className="card-title">Complex Functions</h2>
        <span className="card-subtitle">{functions.length} found</span>
      </div>
      <table className="data-table">
        <thead>
          <tr><th>Function</th><th>File</th><th>Score</th></tr>
        </thead>
        <tbody>
          {functions.map((f, i) => {
            const fileName = f.file.split(/[/\\]/).pop()
            return (
              <tr key={i}>
                <td style={{ color: "var(--text-primary)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>{f.function}</td>
                <td><span className="file-path" title={f.file}>{fileName}</span></td>
                <td><span className={`badge ${f.complexity > 15 ? "badge-danger" : "badge-warning"}`}><span className="badge-dot" />{f.complexity}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
