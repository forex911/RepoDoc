import { Icons } from "./Icons"

export default function Suggestions({ suggestions }) {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.lightbulb}</span>
          <h2 className="card-title">Refactor Suggestions</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg" style={{ color: "var(--success)" }}>{Icons.check}</div>
          No suggestions — code looks great
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.lightbulb}</span>
        <h2 className="card-title">Refactor Suggestions</h2>
        <span className="card-subtitle">{suggestions.length} items</span>
      </div>
      <div>
        {suggestions.map((s, i) => (
          <div key={i} className="list-item">
            <span className="list-item-icon icon icon-sm">{Icons.lightbulb}</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}