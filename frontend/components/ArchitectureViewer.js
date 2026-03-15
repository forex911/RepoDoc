"use client"

import { useState } from "react"
import { Icons } from "./Icons"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function ArchitectureViewer({ image }) {
  const [lightbox, setLightbox] = useState(false)
  if (!image) return null
  const imageUrl = `${API_URL}/${image}`

  return (
    <div className="card full-width">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.network}</span>
        <h2 className="card-title">Architecture Diagram</h2>
        <span className="card-subtitle">click to enlarge</span>
      </div>
      <div className="arch-image-container" onClick={() => setLightbox(true)}>
        <img src={imageUrl} className="arch-image" alt="Repository architecture dependency graph" />
      </div>
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(false)}>
          <img src={imageUrl} className="lightbox-image" alt="Architecture diagram — full size" />
        </div>
      )}
    </div>
  )
}
