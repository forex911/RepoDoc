import { Icons } from "./Icons"

export default function SemanticDuplicates({ duplicates }) {
  if (!duplicates || duplicates.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.brain}</span>
          <h2 className="card-title">Semantic Duplicates</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg" style={{ color: "var(--success)" }}>{Icons.check}</div>
          No semantic duplicates detected
        </div>
      </div>
    )
  }

  const displayed = duplicates.slice(0, 20)

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.brain}</span>
        <h2 className="card-title">Semantic Duplicates</h2>
        <span className="card-subtitle">{duplicates.length} pairs</span>
      </div>
      <div>
        {displayed.map((d, i) => (
          <div key={i} className="semantic-pair">
            <div className="semantic-pair-row">
              <div className="semantic-func">
                <span className="semantic-func-label">Function A</span>
                <span className="semantic-func-name">{d.function1}()</span>
                <span className="semantic-file-path">{d.file1}</span>
              </div>
              <div className="semantic-connector">
                <span className="semantic-sim-badge">
                  {Math.round(d.similarity * 100)}%
                </span>
                <div className="semantic-arrow">↔</div>
              </div>
              <div className="semantic-func">
                <span className="semantic-func-label">Function B</span>
                <span className="semantic-func-name">{d.function2}()</span>
                <span className="semantic-file-path">{d.file2}</span>
              </div>
            </div>
            <div className="semantic-sim-bar">
              <div
                className="semantic-sim-fill"
                style={{ width: `${d.similarity * 100}%` }}
              />
            </div>
          </div>
        ))}
        {duplicates.length > 20 && (
          <div className="empty-state" style={{ padding: "0.8rem", fontSize: "0.78rem" }}>
            Showing top 20 of {duplicates.length} pairs
          </div>
        )}
      </div>
    </div>
  )
}
