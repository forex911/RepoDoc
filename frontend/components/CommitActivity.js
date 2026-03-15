"use client"

import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from "chart.js"
import { Icons } from "./Icons"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function CommitActivity({ history }) {
  const dataPoints = history;

  if (!dataPoints || !Array.isArray(dataPoints) || dataPoints.length === 0) {
    return (
      <div className="card full-width">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.activity}</span>
          <h2 className="card-title">Commit Activity</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg">{Icons.activity}</div>
          No commit activity data available
        </div>
      </div>
    )
  }

  const labels = dataPoints.map(d => d.date)
  const values = dataPoints.map(d => d.commits)

  const data = {
    labels,
    datasets: [{
      label: "Commits",
      data: values,
      fill: true,
      backgroundColor: (ctx) => {
        const chart = ctx.chart
        const { ctx: canvasCtx, chartArea } = chart
        if (!chartArea) return "rgba(52, 211, 153, 0.2)"
        const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, "rgba(52, 211, 153, 0.4)")
        gradient.addColorStop(1, "rgba(52, 211, 153, 0.0)")
        return gradient
      },
      borderColor: "#34d399",
      borderWidth: 2,
      pointBackgroundColor: "#10b981",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "#10b981",
      pointRadius: 2,
      pointHoverRadius: 5,
      tension: 0.3
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(6, 9, 15, 0.95)",
        titleColor: "#e8ecf4",
        bodyColor: "#8b95a8",
        borderColor: "rgba(52, 211, 153, 0.3)",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        bodyFont: { family: "Inter" },
        titleFont: { family: "Space Grotesk", weight: "600" },
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y} commits`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#515c6e", font: { family: "JetBrains Mono", size: 10 }, maxRotation: 45, minRotation: 45 },
        grid: { display: false },
        border: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#515c6e", font: { family: "JetBrains Mono", size: 10 }, stepSize: 1 },
        grid: { color: "rgba(255,255,255,0.03)" },
        border: { display: false },
      }
    }
  }

  return (
    <div className="card full-width">
      <div className="card-header">
        <span className="card-header-icon icon icon-md" style={{ color: "var(--success)" }}>{Icons.activity}</span>
        <h2 className="card-title">Commit Activity</h2>
        <span className="card-subtitle">Over time</span>
      </div>
      <div className="chart-container" style={{ height: "300px" }}>
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
