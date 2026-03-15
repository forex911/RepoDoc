"use client"

import { useEffect, useRef } from "react"
import { Icons } from "./Icons"

export default function HealthScore({ score }) {
  const circleRef = useRef(null)
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const normalizedScore = Math.max(0, Math.min(100, score || 0))
  const offset = circumference - (normalizedScore / 100) * circumference

  let color = "#f87171"
  let label = "Critical"
  if (normalizedScore >= 80) { color = "#34d399"; label = "Excellent" }
  else if (normalizedScore >= 60) { color = "#6366f1"; label = "Good" }
  else if (normalizedScore >= 40) { color = "#fbbf24"; label = "Fair" }

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = circumference
      requestAnimationFrame(() => {
        circleRef.current.style.transition = "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)"
        circleRef.current.style.strokeDashoffset = offset
      })
    }
  }, [offset, circumference])

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.heartPulse}</span>
        <h2 className="card-title">Health Score</h2>
        <span className="card-subtitle">{label}</span>
      </div>
      <div className="health-ring-container">
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <svg className="health-ring-svg" viewBox="0 0 150 150">
            <circle className="health-ring-bg" cx="75" cy="75" r={radius} />
            <circle
              ref={circleRef}
              className="health-ring-progress"
              cx="75" cy="75" r={radius}
              stroke={color}
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
            />
          </svg>
          <span className="health-ring-text" style={{ color, position: "absolute" }}>{normalizedScore}</span>
        </div>
        <span className="health-label">out of 100</span>
      </div>
    </div>
  )
}