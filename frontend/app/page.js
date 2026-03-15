"use client"

import { useState } from "react"
import RepoForm from "../components/RepoForm"
import StatsOverview from "../components/StatsOverview"
import HealthScore from "../components/HealthScore"
import ContributorsChart from "../components/ContributorsChart"
import ComplexFunctions from "../components/ComplexFunctions"
import DuplicateFiles from "../components/DuplicateFiles"
import CodeChurn from "../components/CodeChurn"
import RiskyFiles from "../components/RiskyFiles"
import LargeModules from "../components/LargeModules"
import Suggestions from "../components/Suggestions"
import ArchitectureGraph from "../components/ArchitectureGraph"
import CommitActivity from "../components/CommitActivity"
import Violations from "../components/Violations"
import SemanticDuplicates from "../components/SemanticDuplicates"
import RiskDashboard from "../components/RiskDashboard"
import ReportViewer from "../components/ReportViewer"

export default function Home() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(null)
  const [processingTime, setProcessingTime] = useState(null)

  return (
    <div className="app-wrapper">

      {/* ─── Hero Section ─── */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          AI-Powered Analysis
        </div>
        <h1 className="hero-title">Repository Intelligence</h1>
        <p className="hero-subtitle">
          Analyze any GitHub repository for code quality, complexity, architecture patterns, and actionable insights — powered by AI.
        </p>
        <RepoForm
          setData={setData}
          setLoading={setLoading}
          setError={setError}
          setProgress={setProgress}
          setProcessingTime={setProcessingTime}
          loading={loading}
        />
        {error && <div className="error-message">{error}</div>}
      </section>

      {/* ─── Progress Bar ─── */}
      {loading && progress && (
        <div className="progress-container">
          <div className="progress-header">
            <div className="progress-step-label">
              <span className="progress-spinner" />
              {progress.message}
            </div>
            <span className="progress-percent">
              {Math.round((progress.step / progress.total) * 100)}%
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(progress.step / progress.total) * 100}%` }}
            />
          </div>
          <div className="progress-steps">
            Step {progress.step} of {progress.total}
          </div>
        </div>
      )}

      {/* ─── Spot Scan Results ─── */}
      {data && !loading && data.is_spot_scan && (
        <div className="spot-scan-results" style={{ padding: "30px", background: "#1e293b", borderRadius: "8px", marginTop: "20px" }}>
            <h2 style={{ color: "#fff", marginBottom: "15px" }}>Quick Scan Results</h2>
            <p style={{ color: "#94a3b8", marginBottom: "20px" }}>Repository: <a href={data.repo} target="_blank" rel="noreferrer" style={{ color: "#60a5fa" }}>{data.repo}</a></p>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "20px" }}>
                <div style={{ background: "#0f172a", padding: "20px", borderRadius: "8px" }}>
                    <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", textTransform: "uppercase" }}>Total Files</h3>
                    <div style={{ fontSize: "2rem", color: "#60a5fa", fontWeight: "bold" }}>{data.total_files}</div>
                </div>
                <div style={{ background: "#0f172a", padding: "20px", borderRadius: "8px" }}>
                    <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", textTransform: "uppercase" }}>Processing Time</h3>
                    <div style={{ fontSize: "2rem", color: "#34d399", fontWeight: "bold" }}>
                        {processingTime ? `${processingTime}s` : "N/A"}
                    </div>
                </div>
            </div>

            <div style={{ background: "#0f172a", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
                <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "10px" }}>Languages Detected</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {data.languages?.map((lang, i) => (
                        <span key={i} style={{ background: "#334155", padding: "5px 10px", borderRadius: "4px", fontSize: "0.85rem", color: "#e2e8f0" }}>{lang}</span>
                    ))}
                    {(!data.languages || data.languages.length === 0) && <span style={{ color: "#64748b" }}>None detected</span>}
                </div>
            </div>

            <div style={{ background: "#0f172a", padding: "20px", borderRadius: "8px" }}>
                <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "15px" }}>Largest Modules</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {data.largest_modules?.map((m, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", background: "#1e293b", padding: "10px", borderRadius: "4px" }}>
                            <span style={{ color: "#e2e8f0", fontFamily: "monospace", fontSize: "0.85rem", wordBreak: "break-all" }}>{m.file}</span>
                            <span style={{ color: "#94a3b8", fontSize: "0.85rem", whiteSpace: "nowrap", marginLeft: "10px" }}>{m.lines} lines</span>
                        </div>
                    ))}
                    {(!data.largest_modules || data.largest_modules.length === 0) && <span style={{ color: "#64748b" }}>None found</span>}
                </div>
            </div>
        </div>
      )}

      {/* ─── Results Dashboard (Full Analysis) ─── */}
      {data && !loading && !data.is_spot_scan && (
        <>
          {/* Stats Overview Bar */}
          <StatsOverview data={data} />

          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">
            
            {processingTime && (
              <div style={{ gridColumn: "1 / -1", textAlign: "right", color: "#8a8f98", fontSize: "0.9rem", marginBottom: "-10px" }}>
                Analysis completed in <span style={{ color: "#fff", fontWeight: "bold" }}>{processingTime}</span> seconds
              </div>
            )}

            {/* Row 1: Health Score + Contributors */}
            <HealthScore score={data.health_score} />
            <ContributorsChart contributors={data.contributors} />

            {/* Row 2: Risky Files + Complex Functions */}
            <RiskyFiles files={data.risky_files} />
            <ComplexFunctions functions={data.complex_functions} />

            {/* Row 3: Code Churn + Large Modules */}
            <CodeChurn churn={data.code_churn} />
            <LargeModules modules={data.large_modules} />

            {/* Row 4: Duplicates + Suggestions */}
            <DuplicateFiles duplicates={data.duplicates} />
            <Suggestions suggestions={data.suggestions} />

            {/* Row 5: AI Features — Semantic Duplicates + Bug Risk */}
            <SemanticDuplicates duplicates={data.semantic_duplicates} />
            <RiskDashboard predictions={data.risk_predictions} />

            {/* Full-width: Violations */}
            <Violations violations={data.violations} />

            {/* Full-width: Interactive Architecture Graph */}
            <ArchitectureGraph graphData={data.architecture_graph} />

            {/* Full-width: Commit Activity */}
            <CommitActivity history={data.commit_activity_graph} />

            {/* Full-width: Report Generator */}
            <ReportViewer repoUrl={data.repo} analysisData={data} />

          </div>
        </>
      )}

      {/* ─── Footer ─── */}
      <footer className="footer">
        AI Repository Intelligence · Built with Next.js + FastAPI
      </footer>

    </div>
  )
}