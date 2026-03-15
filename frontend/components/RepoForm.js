"use client"

import { useState } from "react"
import { Icons } from "./Icons"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function RepoForm({ setData, setLoading, setError, setProgress, loading }) {
  const [repo, setRepo] = useState("")

  const analyze = async () => {
    if (!repo.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    setProgress({ step: 0, total: 13, message: "Starting analysis..." })

    try {
      const res = await fetch(`${API_URL}/analyze-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repo.trim() })
      })

      if (!res.ok) throw new Error(`Server responded with ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop()

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue
          let eventType = "", eventData = ""
          for (const line of eventBlock.split("\n")) {
            if (line.startsWith("event: ")) eventType = line.slice(7)
            else if (line.startsWith("data: ")) eventData = line.slice(6)
          }
          if (!eventType || !eventData) continue
          try {
            const parsed = JSON.parse(eventData)
            if (eventType === "progress") setProgress(parsed)
            else if (eventType === "complete") { setData(parsed); setProgress(null) }
            else if (eventType === "error") throw new Error(parsed.message || "Analysis failed")
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes("JSON")) throw parseErr
          }
        }
      }
    } catch (e) {
      console.error(e)
      setProgress(null)
      setError(
        e.message.includes("Failed to fetch") || e.message.includes("NetworkError")
          ? "Cannot connect to backend. Make sure the server is running on port 8000."
          : `Analysis failed: ${e.message}`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && repo.trim() && !loading) analyze()
  }

  return (
    <div>
      <div className="form-wrapper">
        <div className="input-wrapper">
          <span className="input-icon icon icon-sm">{Icons.link}</span>
          <input
            type="text"
            className="input-field"
            placeholder="Paste a GitHub repository URL..."
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>
        <button className="btn-analyze" onClick={analyze} disabled={loading || !repo.trim()}>
          {loading ? (
            <><span className="icon icon-sm" style={{ animation: "spin 1s linear infinite" }}>{Icons.loader}</span>Analyzing...</>
          ) : (
            <><span className="icon icon-sm">{Icons.rocket}</span>Analyze</>
          )}
        </button>
      </div>
    </div>
  )
}