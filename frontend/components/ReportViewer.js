"use client"

import { useState } from "react"
import { Icons } from "./Icons"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function ReportViewer({ repoUrl, analysisData }) {
  const [downloading, setDownloading] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)

  if (!repoUrl || !analysisData) return null

  const repoName = repoUrl.replace(/\/+$/, "").split("/").pop() || "report"

  const downloadReport = async (format) => {
    setDownloading(format)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/report/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: analysisData, format })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server responded with ${res.status}`)
      }

      if (format === "json") {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        triggerDownload(blob, `report_${repoName}.json`)
      } else if (format === "pdf") {
        const blob = await res.blob()
        if (blob.size < 200) {
          // Likely an error response, not a real PDF
          const text = await blob.text()
          try {
            const errData = JSON.parse(text)
            throw new Error(errData.error || "PDF generation failed")
          } catch (e) {
            if (e.message.includes("PDF")) throw e
            throw new Error("PDF generation failed — file too small")
          }
        }
        triggerDownload(blob, `report_${repoName}.pdf`)
      } else {
        const text = await res.text()
        setPreview(text)
        const blob = new Blob([text], { type: "text/markdown" })
        triggerDownload(blob, `report_${repoName}.md`)
      }
    } catch (e) {
      console.error("Report download failed:", e)
      setError(e.message)
    } finally {
      setDownloading(null)
    }
  }

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card full-width">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.fileText}</span>
        <h2 className="card-title">AI Report</h2>
        <span className="card-subtitle">{repoName}</span>
      </div>

      <div className="report-actions">
        <button
          className="report-btn report-btn-md"
          onClick={() => downloadReport("markdown")}
          disabled={downloading !== null}
        >
          <span className="icon icon-sm">{Icons.fileText}</span>
          {downloading === "markdown" ? "Generating..." : "Markdown"}
        </button>
        <button
          className="report-btn report-btn-pdf"
          onClick={() => downloadReport("pdf")}
          disabled={downloading !== null}
        >
          <span className="icon icon-sm">{Icons.download}</span>
          {downloading === "pdf" ? "Generating..." : "PDF"}
        </button>
        <button
          className="report-btn report-btn-json"
          onClick={() => downloadReport("json")}
          disabled={downloading !== null}
        >
          <span className="icon icon-sm">{Icons.settings}</span>
          {downloading === "json" ? "Generating..." : "JSON"}
        </button>
      </div>

      {error && (
        <div style={{
          padding: "0.6rem 1rem",
          background: "var(--danger-bg)",
          border: "1px solid rgba(248, 113, 113, 0.15)",
          borderRadius: "var(--radius-sm)",
          color: "var(--danger)",
          fontSize: "0.82rem",
          marginBottom: "0.75rem"
        }}>
          {error}
        </div>
      )}

      {preview && (
        <div className="report-preview">
          <div className="report-preview-header">
            <span className="icon icon-sm">{Icons.fileText}</span>
            <span>Report Preview</span>
            <button className="report-close-btn" onClick={() => setPreview(null)}>×</button>
          </div>
          <pre className="report-preview-content">{preview}</pre>
        </div>
      )}
    </div>
  )
}
