"use client"

import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from "chart.js"
import { Icons } from "./Icons"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function ContributorsChart({ contributors }) {
  if (!contributors || Object.keys(contributors).length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.users}</span>
          <h2 className="card-title">Top Contributors</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg">{Icons.users}</div>
          No contributor data available
        </div>
      </div>
    )
  }

  const labels = Object.keys(contributors)
  const values = Object.values(contributors)

  const data = {
    labels,
    datasets: [{
      label: "Commits",
      data: values,
      backgroundColor: (ctx) => {
        const chart = ctx.chart
        const { ctx: canvasCtx, chartArea } = chart
        if (!chartArea) return "rgba(99, 102, 241, 0.5)"
        const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
        gradient.addColorStop(0, "rgba(99, 102, 241, 0.2)")
        gradient.addColorStop(1, "rgba(139, 92, 246, 0.7)")
        return gradient
      },
      borderColor: "rgba(99, 102, 241, 0.6)",
      borderWidth: 1,
      borderRadius: 5,
      borderSkipped: false,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(6, 9, 15, 0.95)",
        titleColor: "#e8ecf4",
        bodyColor: "#8b95a8",
        borderColor: "rgba(99, 102, 241, 0.2)",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        bodyFont: { family: "Inter" },
        titleFont: { family: "Space Grotesk", weight: "600" },
      }
    },
    scales: {
      x: {
        ticks: { color: "#515c6e", font: { family: "JetBrains Mono", size: 10 } },
        grid: { display: false },
        border: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        ticks: { color: "#515c6e", font: { family: "JetBrains Mono", size: 10 } },
        grid: { color: "rgba(255,255,255,0.03)" },
        border: { display: false },
      }
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.users}</span>
        <h2 className="card-title">Top Contributors</h2>
        <span className="card-subtitle">{labels.length} total</span>
      </div>
      <div className="chart-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}