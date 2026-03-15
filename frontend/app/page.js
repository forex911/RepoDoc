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

      {/* ─── Results Dashboard ─── */}
      {data && !loading && (
        <>
          {/* Stats Overview Bar */}
          <StatsOverview data={data} />

          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">

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