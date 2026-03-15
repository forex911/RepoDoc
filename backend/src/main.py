from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl, validator
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, Response, JSONResponse

from dotenv import load_dotenv
import logging

from src.parser.repo_loader import clone_repo

from src.analysis.complexity import analyze_complexity
from src.analysis.duplicate_detector import detect_duplicates
from src.analysis.architecture import generate_architecture_diagram, build_dependency_graph
from src.analysis.commit_analysis import analyze_commit_history
from src.analysis.contributor_analysis import analyze_contributors
from src.analysis.code_churn import analyze_code_churn
from src.analysis.risky_files import detect_risky_files
from src.analysis.module_size import analyze_module_sizes
from src.analysis.violation_detector import detect_violations
from src.analysis.risk_prediction import predict_risky_files

from src.ai_engine.semantic_similarity import find_semantic_duplicates

from src.refactor.suggestion_engine import generate_suggestions
from src.metrics.health_score import calculate_health_score

from src.report.report_generator import (
    generate_markdown_report,
    generate_pdf_report,
    generate_json_summary
)
import uvicorn

import json
import traceback
import os

# Load environment variables
load_dotenv()

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("repodoc-api")


app = FastAPI(title="AI Repository Intelligence API")


# -----------------------------
# Enable CORS for frontend
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




# -----------------------------
# Request Model
# -----------------------------

class RepoRequest(BaseModel):
    repo_url: str

    @validator('repo_url')
    def validate_github_url(cls, v):
        if not v.startswith("https://github.com/"):
            raise ValueError('Only https://github.com/* URLs are supported.')
        return v


# -----------------------------
# Root Endpoint
# -----------------------------

@app.get("/")
def home():
    return {"message": "AI Repo Analyzer Backend Running"}


# -----------------------------
# Streaming Analysis Endpoint (SSE)
# -----------------------------

@app.post("/analyze-stream")
def analyze_repo_stream(data: RepoRequest):
    
    # URL is already validated by Pydantic validator to be github.com
    logger.info(f"Starting analysis for repo: {data.repo_url}")

    def event_stream():
        result = {}

        try:
            # Step 1: Clone
            yield _sse_event("progress", {"step": 1, "total": 13, "message": "Cloning repository..."})
            repo_path = clone_repo(data.repo_url)
            result["repo"] = data.repo_url

            # Step 2: Complexity
            yield _sse_event("progress", {"step": 2, "total": 13, "message": "Analyzing code complexity..."})
            complexity_report = analyze_complexity(repo_path)
            result["complex_functions"] = complexity_report

            # Step 3: Duplicates
            yield _sse_event("progress", {"step": 3, "total": 13, "message": "Detecting duplicate files..."})
            duplicates = detect_duplicates(repo_path)
            result["duplicates"] = duplicates

            # Step 4: Architecture
            yield _sse_event("progress", {"step": 4, "total": 13, "message": "Generating architecture diagram..."})
            architecture_diagram = generate_architecture_diagram(repo_path)
            result["architecture_diagram"] = architecture_diagram

            # Step 5: Commit history
            yield _sse_event("progress", {"step": 5, "total": 13, "message": "Analyzing commit history..."})
            commit_activity_graph = analyze_commit_history(repo_path)
            result["commit_activity_graph"] = commit_activity_graph

            # Step 6: Contributors
            yield _sse_event("progress", {"step": 6, "total": 13, "message": "Analyzing contributors..."})
            contributors = analyze_contributors(repo_path)
            result["contributors"] = contributors

            # Step 7: Code churn
            yield _sse_event("progress", {"step": 7, "total": 13, "message": "Computing code churn..."})
            churn = analyze_code_churn(repo_path)
            result["code_churn"] = churn

            # Step 8: Risky files
            yield _sse_event("progress", {"step": 8, "total": 13, "message": "Detecting risky files..."})
            risky_files = detect_risky_files(complexity_report, churn)
            result["risky_files"] = risky_files

            # Step 9: Module sizes
            yield _sse_event("progress", {"step": 9, "total": 13, "message": "Analyzing module sizes..."})
            large_modules = analyze_module_sizes(repo_path)
            result["large_modules"] = large_modules

            # Step 10: Suggestions + Health
            yield _sse_event("progress", {"step": 10, "total": 13, "message": "Generating suggestions & health score..."})
            suggestions = generate_suggestions(complexity_report, duplicates)
            result["suggestions"] = suggestions

            health_score = calculate_health_score(complexity_report, duplicates, churn)
            result["health_score"] = health_score

            # Step 11: Violation Detection
            yield _sse_event("progress", {"step": 11, "total": 13, "message": "Scanning for violations & security issues..."})
            violations = detect_violations(repo_path)
            result["violations"] = violations

            # Step 12: Semantic Duplicate Detection (AI)
            yield _sse_event("progress", {"step": 12, "total": 13, "message": "AI: Detecting semantic code duplicates..."})
            try:
                semantic_dupes = find_semantic_duplicates(repo_path)
            except Exception:
                semantic_dupes = []
            result["semantic_duplicates"] = semantic_dupes

            # Step 13: Risk Prediction (AI)
            yield _sse_event("progress", {"step": 13, "total": 13, "message": "AI: Predicting bug-prone files..."})
            risk_predictions = predict_risky_files(
                repo_path, complexity_report, churn, contributors, large_modules
            )
            result["risk_predictions"] = risk_predictions

            # Build architecture graph JSON
            try:
                graph = build_dependency_graph(repo_path)
                nodes = [{"id": n} for n in graph.nodes()]
                edges = [{"source": u, "target": v} for u, v in graph.edges()]
                result["architecture_graph"] = {"nodes": nodes, "edges": edges}
            except Exception:
                result["architecture_graph"] = {"nodes": [], "edges": []}


            # Done — send final result
            logger.info(f"Analysis completed successfully for: {data.repo_url}")
            yield _sse_event("complete", result)

        except Exception as e:
            logger.error(f"Analysis failed for {data.repo_url}: {str(e)}", exc_info=True)
            traceback.print_exc()
            yield _sse_event("error", {"message": str(e)})

        finally:
            if 'repo_path' in locals() and repo_path:
                from src.parser.repo_loader import cleanup_repo
                cleanup_repo(repo_path)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


def _sse_event(event_type: str, data: dict) -> str:
    """Format a Server-Sent Event string."""
    json_data = json.dumps(data)
    return f"event: {event_type}\ndata: {json_data}\n\n"


# -----------------------------
# Legacy Analysis Endpoint (non-streaming)
# -----------------------------

@app.post("/analyze")
def analyze_repo(data: RepoRequest):

    repo_path = clone_repo(data.repo_url)

    complexity_report = analyze_complexity(repo_path)
    duplicates = detect_duplicates(repo_path)
    architecture_diagram = generate_architecture_diagram(repo_path)
    commit_activity_graph = analyze_commit_history(repo_path)
    contributors = analyze_contributors(repo_path)
    churn = analyze_code_churn(repo_path)
    risky_files = detect_risky_files(complexity_report, churn)
    large_modules = analyze_module_sizes(repo_path)
    suggestions = generate_suggestions(complexity_report, duplicates)
    health_score = calculate_health_score(complexity_report, duplicates, churn)
    violations = detect_violations(repo_path)

    try:
        semantic_dupes = find_semantic_duplicates(repo_path)
    except Exception:
        semantic_dupes = []

    risk_predictions = predict_risky_files(
        repo_path, complexity_report, churn, contributors, large_modules
    )

    try:
        graph = build_dependency_graph(repo_path)
        nodes = [{"id": n} for n in graph.nodes()]
        edges = [{"source": u, "target": v} for u, v in graph.edges()]
        arch_graph = {"nodes": nodes, "edges": edges}
    except Exception:
        arch_graph = {"nodes": [], "edges": []}

    result = {
        "repo": data.repo_url,
        "health_score": health_score,
        "complex_functions": complexity_report,
        "duplicates": duplicates,
        "contributors": contributors,
        "code_churn": churn,
        "risky_files": risky_files,
        "large_modules": large_modules,
        "suggestions": suggestions,
        "architecture_diagram": architecture_diagram,
        "commit_activity_graph": commit_activity_graph,
        "violations": violations,
        "semantic_duplicates": semantic_dupes,
        "risk_predictions": risk_predictions,
        "architecture_graph": arch_graph,
    }


    return result


# -----------------------------
# Semantic Duplicates Endpoint
# -----------------------------

@app.post("/semantic-duplicates")
def get_semantic_duplicates(data: RepoRequest):
    repo_path = clone_repo(data.repo_url)
    try:
        results = find_semantic_duplicates(repo_path)
    except Exception as e:
        return {"error": str(e), "semantic_duplicates": []}
    return {"semantic_duplicates": results}


# -----------------------------
# Risk Analysis Endpoint
# -----------------------------

@app.post("/risk-analysis")
def get_risk_analysis(data: RepoRequest):
    repo_path = clone_repo(data.repo_url)

    complexity_report = analyze_complexity(repo_path)
    churn = analyze_code_churn(repo_path)
    contributors = analyze_contributors(repo_path)
    large_modules = analyze_module_sizes(repo_path)

    predictions = predict_risky_files(
        repo_path, complexity_report, churn, contributors, large_modules
    )

    return {"risk_predictions": predictions}


# -----------------------------
# Architecture Graph Endpoint
# -----------------------------

@app.post("/architecture-graph")
def get_architecture_graph(data: RepoRequest):
    repo_path = clone_repo(data.repo_url)

    try:
        graph = build_dependency_graph(repo_path)
        nodes = [{"id": n} for n in graph.nodes()]
        edges = [{"source": u, "target": v} for u, v in graph.edges()]
    except Exception:
        nodes, edges = [], []

    return {"nodes": nodes, "edges": edges}


# -----------------------------
# Report Endpoint (POST — receives analysis data)
# -----------------------------

@app.post("/report/generate")
def generate_report(request: dict):
    """
    Generate a report from analysis data sent by the frontend.
    Expects: { "data": {...analysis...}, "format": "markdown"|"pdf"|"json" }
    """

    analysis_data = request.get("data")
    report_format = request.get("format", "markdown")

    if not analysis_data:
        return JSONResponse(
            status_code=400,
            content={"error": "No analysis data provided."}
        )

    if report_format == "markdown":
        md = generate_markdown_report(analysis_data)
        return Response(
            content=md,
            media_type="text/markdown",
            headers={"Content-Disposition": "attachment; filename=report.md"}
        )

    elif report_format == "pdf":
        pdf_path = generate_pdf_report(analysis_data)
        if pdf_path and os.path.exists(pdf_path):
            return FileResponse(
                pdf_path,
                media_type="application/pdf",
                filename="report.pdf"
            )
        return JSONResponse(
            status_code=500,
            content={"error": "PDF generation failed. Ensure 'reportlab' is installed: pip install reportlab"}
        )

    elif report_format == "json":
        summary = generate_json_summary(analysis_data)
        return JSONResponse(content=summary)

    return JSONResponse(
        status_code=400,
        content={"error": "Invalid format. Use 'markdown', 'pdf', or 'json'."}
    )


# -----------------------------
# Serve Architecture Diagram
# -----------------------------

@app.get("/architecture.png")
def get_architecture():
    return FileResponse("architecture.png")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("src.main:app", host="0.0.0.0", port=port)