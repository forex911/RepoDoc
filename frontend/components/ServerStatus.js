"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { checkHealth } from "../lib/api"

const WAKING_MESSAGES = [
  "⚡ Waking analysis engine…",
  "Preparing repository analyzer…",
  "Starting AI analysis service…"
]

export default function ServerStatus({ onStatusChange }) {
  // "checking" | "online" | "waking" | "offline"
  const [status, setStatus] = useState("checking")
  const [wakingMsgIndex, setWakingMsgIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const intervalRef = useRef(null)
  const msgIntervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const hideTimerRef = useRef(null)

  const updateStatus = useCallback((newStatus) => {
    setStatus(newStatus)
    if (onStatusChange) onStatusChange(newStatus === "online")
  }, [onStatusChange])

  // Auto-hide badge 8s after going online
  useEffect(() => {
    if (status === "online") {
      hideTimerRef.current = setTimeout(() => setVisible(false), 8000)
    } else {
      setVisible(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }
  }, [status])

  // Rotate waking messages
  useEffect(() => {
    if (status === "waking") {
      msgIntervalRef.current = setInterval(() => {
        setWakingMsgIndex(i => (i + 1) % WAKING_MESSAGES.length)
      }, 3000)
    } else {
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current)
    }
    return () => { if (msgIntervalRef.current) clearInterval(msgIntervalRef.current) }
  }, [status])

  // Health polling
  useEffect(() => {
    let cancelled = false
    startTimeRef.current = Date.now()

    const poll = async () => {
      const ok = await checkHealth()
      if (cancelled) return

      if (ok) {
        updateStatus("online")
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }

      // First failure — switch to waking
      if (status !== "offline") {
        updateStatus("waking")
      }
    }

    // Initial check
    poll()

    // Retry every 5s
    intervalRef.current = setInterval(() => {
      if (cancelled) return
      const elapsed = Date.now() - startTimeRef.current
      if (elapsed > 120000) {
        updateStatus("offline")
        clearInterval(intervalRef.current)
        return
      }
      poll()
    }, 5000)

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!visible) return null

  const config = {
    checking: {
      dotClass: "server-dot--checking",
      label: "Checking Server…",
      subtitle: null
    },
    online: {
      dotClass: "server-dot--online",
      label: "Server Online",
      subtitle: null
    },
    waking: {
      dotClass: "server-dot--waking",
      label: "Server Waking Up",
      subtitle: "Render free tier — may take up to 60 seconds"
    },
    offline: {
      dotClass: "server-dot--offline",
      label: "Server Unreachable",
      subtitle: "Please try again later"
    }
  }

  const c = config[status]

  return (
    <div className={`server-status server-status--${status}`} id="server-status-badge">
      <div className="server-status-main">
        <span className={`server-dot ${c.dotClass}`} />
        <span className="server-label">{c.label}</span>
      </div>
      {status === "waking" && (
        <div className="server-status-detail">
          <div className="server-waking-msg" key={wakingMsgIndex}>
            {WAKING_MESSAGES[wakingMsgIndex]}
          </div>
          <div className="server-subtitle">{c.subtitle}</div>
        </div>
      )}
      {status === "offline" && c.subtitle && (
        <div className="server-status-detail">
          <div className="server-subtitle">{c.subtitle}</div>
        </div>
      )}
    </div>
  )
}
