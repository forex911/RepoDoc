import { Icons } from "./Icons"

export default function StatsOverview({ data }) {
  if (!data) return null

  const stats = [
    { icon: Icons.heartPulse, value: data.health_score ?? "—", label: "Health Score" },
    { icon: Icons.users, value: data.contributors ? Object.keys(data.contributors).length : 0, label: "Contributors" },
    { icon: Icons.alertTriangle, value: data.risky_files ? data.risky_files.length : 0, label: "Risky Files" },
    { icon: Icons.puzzle, value: data.complex_functions ? data.complex_functions.length : 0, label: "Complex Funcs" },
    { icon: Icons.copy, value: data.duplicates ? data.duplicates.length : 0, label: "Duplicates" },
    { icon: Icons.shieldAlert, value: data.violations ? data.violations.length : 0, label: "Violations" },
    { icon: Icons.brain, value: data.semantic_duplicates ? data.semantic_duplicates.length : 0, label: "AI Duplicates" },
    { icon: Icons.barChart, value: data.risk_predictions && data.risk_predictions.length > 0 ? data.risk_predictions[0].risk_score : "—", label: "Top Risk" },
  ]

  return (
    <div className="stats-bar">
      {stats.map((s, i) => (
        <div key={i} className="stat-card">
          <div className="stat-icon icon icon-md">{s.icon}</div>
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
