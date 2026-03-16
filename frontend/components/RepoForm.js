"use client"

import { useState, useEffect, useRef } from "react"
import { Icons } from "./Icons"
import { analyzeRepo, spotAnalysis, stopAnalysis, checkHealth } from "../lib/api"

const COLD_START_MESSAGES = [
  "⚡ Waking analysis engine…",
  "Preparing repository analyzer…",
  "Starting AI analysis service…"
]

export default function RepoForm({ setData, setLoading, setError, setProgress, loading, setProcessingTime, serverOnline }) {
  const [repo, setRepo] = useState("")
  const [jobId, setJobId] = useState(null)
  const [timer, setTimer] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  const [coldStartActive, setColdStartActive] = useState(false)
  const [coldStartMsgIndex, setColdStartMsgIndex] = useState(0)
  const [engineReady, setEngineReady] = useState(false)
  const coldStartInterval = useRef(null)

  // Rotate cold-start messages
  useEffect(() => {
    if (coldStartActive) {
      coldStartInterval.current = setInterval(() => {
        setColdStartMsgIndex(i => (i + 1) % COLD_START_MESSAGES.length)
      }, 3000)
    } else {
      if (coldStartInterval.current) clearInterval(coldStartInterval.current)
    }
    return () => { if (coldStartInterval.current) clearInterval(coldStartInterval.current) }
  }, [coldStartActive])

  // If server comes online while cold-start is showing, clear it
  useEffect(() => {
    if (serverOnline && coldStartActive) {
      setColdStartActive(false)
      setEngineReady(true)
      setTimeout(() => setEngineReady(false), 4000)
    }
  }, [serverOnline, coldStartActive])

  const waitForServer = async () => {
    // Poll until server responds, up to 60s
    for (let i = 0; i < 12; i++) {
      const ok = await checkHealth()
      if (ok) return true
      await new Promise(r => setTimeout(r, 5000))
    }
    return false
  }

  const analyze = async () => {
    if (!repo.trim()) return

    // If server is not online, show cold-start and wait
    if (!serverOnline) {
      setColdStartActive(true)
      setColdStartMsgIndex(0)
      const ready = await waitForServer()
      setColdStartActive(false)
      if (!ready) {
        setError("Server could not be reached. Please try again later.")
        return
      }
      setEngineReady(true)
      setTimeout(() => setEngineReady(false), 3000)
    }

    setLoading(true)
    setError(null)
    setData(null)
    setJobId(null)
    if (setProcessingTime) setProcessingTime(null)
    
    setTimer(0)
    if (timerInterval) clearInterval(timerInterval)
    const newInterval = setInterval(() => setTimer(t => t + 0.1), 100)
    setTimerInterval(newInterval)
    
    setProgress({ step: 0, total: 13, message: "Starting analysis..." })

    try {
      const res = await analyzeRepo(repo.trim())
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
            if (eventType === "job_started") {
                setJobId(parsed.job_id)
            } else if (eventType === "progress") {
                setProgress(parsed)
            } else if (eventType === "complete") { 
                setData(parsed)
                setProgress(null)
                if (setProcessingTime) setProcessingTime(parsed.processing_time_seconds)
            } else if (eventType === "stopped") {
                setProgress(null)
                setError("Analysis was stopped by the user.")
            } else if (eventType === "error") {
                throw new Error(parsed.message || "Analysis failed")
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes("JSON")) throw parseErr
          }
        }
      }
    } catch (e) {
      console.error(e)
      setProgress(null)
      if (e.message !== "Analysis was stopped by the user.") {
          setError("Repository analysis failed. Please check the repo URL.")
      }
    } finally {
      setLoading(false)
      clearInterval(newInterval)
    }
  }

  const handleStop = async () => {
    if (jobId) {
        try {
            await stopAnalysis(jobId)
            setJobId(null)
        } catch (e) {
            console.error(e)
        }
    }
  }

  const handleSpotScan = async () => {
    if (!repo.trim()) return

    // If server is not online, show cold-start and wait
    if (!serverOnline) {
      setColdStartActive(true)
      setColdStartMsgIndex(0)
      const ready = await waitForServer()
      setColdStartActive(false)
      if (!ready) {
        setError("Server could not be reached. Please try again later.")
        return
      }
      setEngineReady(true)
      setTimeout(() => setEngineReady(false), 3000)
    }

    setLoading(true)
    setError(null)
    setData(null)
    setJobId(null)
    if (setProcessingTime) setProcessingTime(null)
    
    setTimer(0)
    if (timerInterval) clearInterval(timerInterval)
    const newInterval = setInterval(() => setTimer(t => t + 0.1), 100)
    setTimerInterval(newInterval)
    
    setProgress({ step: 0, total: 1, message: "Running quick spot scan..." })

    try {
        const result = await spotAnalysis(repo.trim())
        setData({
            repo: result.repo,
            is_spot_scan: true,
            total_files: result.total_files,
            languages: result.languages,
            largest_modules: result.largest_modules,
        })
        setProgress(null)
        if (setProcessingTime) setProcessingTime(result.processing_time_seconds)
    } catch (e) {
        console.error(e)
        setProgress(null)
        setError("Spot scan failed. Please check the repo URL.")
    } finally {
        setLoading(false)
        clearInterval(newInterval)
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
            disabled={loading || coldStartActive}
          />
        </div>
        {loading && (
          <div className="processing-timer">
            Processing time: {timer.toFixed(1)} seconds
          </div>
        )}

        {/* Cold-start overlay */}
        {coldStartActive && (
          <div className="cold-start-overlay">
            <div className="cold-start-msg" key={coldStartMsgIndex}>
              {COLD_START_MESSAGES[coldStartMsgIndex]}
            </div>
            <div className="cold-start-sub">
              The backend is waking up (Render free tier).<br />
              This may take up to 60 seconds.
            </div>
          </div>
        )}

        {/* Engine ready flash */}
        {engineReady && !loading && (
          <div className="cold-start-ready">🟢 Analysis Engine Ready</div>
        )}

        <div className="button-row">
          {!loading && !coldStartActive ? (
            <>
              <button className="btn-analyze" style={{ background: "#2563eb" }} onClick={analyze} disabled={!repo.trim()}>
                <span className="icon icon-sm">{Icons.rocket}</span> Analyze Repository
              </button>
              <button className="btn-analyze" style={{ background: "#10b981" }} onClick={handleSpotScan} disabled={!repo.trim()}>
                <span className="icon icon-sm">{Icons.zap}</span> Quick Scan
              </button>
            </>
          ) : coldStartActive ? (
            <button className="btn-analyze" style={{ background: "#d97706", cursor: "wait" }} disabled>
              <span className="icon icon-sm" style={{ animation: "spin 1s linear infinite" }}>{Icons.loader}</span> Waking Server…
            </button>
          ) : (
            <>
              <button className="btn-analyze" style={{ background: "#475569", cursor: "wait" }} disabled>
                <span className="icon icon-sm" style={{ animation: "spin 1s linear infinite" }}>{Icons.loader}</span> Analyzing...
              </button>
              {jobId && (
                <button className="btn-analyze" style={{ background: "#ef4444" }} onClick={handleStop}>
                  <span className="icon icon-sm">{Icons.close}</span> Stop Analysis
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}