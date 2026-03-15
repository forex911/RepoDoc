"use client"

import { useState } from "react"
import { Icons } from "./Icons"

const SEVERITY_CONFIG = {
  critical: { label: "Critical", badgeClass: "badge-danger" },
  warning: { label: "Warning", badgeClass: "badge-warning" },
  info: { label: "Info", badgeClass: "badge-info" },
}

const TYPE_CONFIG = {
  secret: { icon: Icons.key, label: "Secret" },
  security: { icon: Icons.shield, label: "Security" },
  license: { icon: Icons.fileText, label: "License" },
  config: { icon: Icons.settings, label: "Config" },
  unsafe: { icon: Icons.zap, label: "Unsafe" },
}

export default function Violations({ violations }) {
  const [filter, setFilter] = useState("all")

  if (!violations || violations.length === 0) {
    return (
      <div className="card full-width">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.shieldAlert}</span>
          <h2 className="card-title">Violation Scanner</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg" style={{ color: "var(--success)" }}>{Icons.check}</div>
          No violations detected — repository looks clean
        </div>
      </div>
    )
  }

  const criticalCount = violations.filter(v => v.severity === "critical").length
  const warningCount = violations.filter(v => v.severity === "warning").length
  const infoCount = violations.filter(v => v.severity === "info").length

  const filtered = filter === "all" ? violations : violations.filter(v => v.severity === filter)

  return (
    <div className="card full-width">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.shieldAlert}</span>
        <h2 className="card-title">Violation Scanner</h2>
        <span className="card-subtitle">{violations.length} issues</span>
      </div>

      <div className="violation-summary">
        {criticalCount > 0 && (
          <span className="badge badge-danger" style={{ cursor: "pointer" }} onClick={() => setFilter(filter === "critical" ? "all" : "critical")}>
            <span className="badge-dot" />{criticalCount} critical
          </span>
        )}
        {warningCount > 0 && (
          <span className="badge badge-warning" style={{ cursor: "pointer" }} onClick={() => setFilter(filter === "warning" ? "all" : "warning")}>
            <span className="badge-dot" />{warningCount} warning
          </span>
        )}
        {infoCount > 0 && (
          <span className="badge badge-info" style={{ cursor: "pointer" }} onClick={() => setFilter(filter === "info" ? "all" : "info")}>
            <span className="badge-dot" />{infoCount} info
          </span>
        )}
        {filter !== "all" && (
          <span className="badge" style={{ cursor: "pointer", background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }} onClick={() => setFilter("all")}>
            clear
          </span>
        )}
      </div>

      <div className="violation-list">
        {filtered.map((v, i) => {
          const sev = SEVERITY_CONFIG[v.severity] || SEVERITY_CONFIG.info
          const typ = TYPE_CONFIG[v.type] || { icon: Icons.alertTriangle, label: v.type }
          return (
            <div key={i} className={`violation-row severity-${v.severity}`}>
              <div className="violation-left">
                <span className={`badge ${sev.badgeClass}`} style={{ fontSize: "0.66rem" }}>
                  <span className="badge-dot" />{sev.label}
                </span>
                <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", fontSize: "0.66rem" }}>
                  <span className="icon icon-sm" style={{ marginRight: "2px" }}>{typ.icon}</span>{typ.label}
                </span>
              </div>
              <div className="violation-message">{v.message}</div>
              {v.file && v.file !== "—" && (
                <div className="violation-file">
                  <span className="file-path">{v.file}</span>
                  {v.line && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>:{v.line}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
