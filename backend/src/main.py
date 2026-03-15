import matplotlib
matplotlib.use("Agg")

from fastapi import FastAPI
from pydantic import BaseModel, validator
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, Response, JSONResponse

from dotenv import load_dotenv
import logging
import json
import traceback
import os
import uuid
import time
import asyncio
import concurrent.futures

import uvicorn

# Load environment variables
load_dotenv()

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("repodoc-api")


app = FastAPI(title="AI Repository Intelligence API")


# -----------------------------
# Enable CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Lazy Imports (heavy modules)
# -----------------------------

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
from src.refactor.suggestion_engine import generate_suggestions
from src.metrics.health_score import calculate_health_score
from src.report.report_generator import (
    generate_markdown_report,
    generate_pdf_report,
    generate_json_summary
)


# -----------------------------
# Request Models
# -----------------------------

class RepoRequest(BaseModel):
    repo_url: str

    @validator("repo_url")
    def validate_github_url(cls, v):
        if not v.startswith("https://github.com/"):
            raise ValueError("Only https://github.com/* URLs are supported.")
        return v

class StopRequest(BaseModel):
    job_id: str

# -----------------------------
# Global State
# -----------------------------
running_jobs = {}


# -----------------------------
# Root Endpoint
# -----------------------------

@app.get("/")
def home():
    return {"message": "RepoDoc Backend Running 🚀"}


# -----------------------------
# SSE helper
# -----------------------------

def _sse_event(event_type: str, data: dict) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


# -----------------------------
# Streaming Analysis
# -----------------------------

@app.post("/analyze-stream")
def analyze_repo_stream(data: RepoRequest):

    job_id = str(uuid.uuid4())
    running_jobs[job_id] = True

    logger.info(f"Starting analysis for repo: {data.repo_url} (Job {job_id})")

    def event_stream():
        start_time = time.time()
        result = {}

        try:
            yield _sse_event("job_started", {"job_id": job_id})

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":1,"total":13,"message":"Cloning repository"})
            repo_path = clone_repo(data.repo_url)
            result["repo"] = data.repo_url

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":2,"total":13,"message":"Analyzing complexity"})
            complexity_report = analyze_complexity(repo_path)
            result["complex_functions"] = complexity_report

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":3,"total":13,"message":"Detecting duplicates"})
            duplicates = detect_duplicates(repo_path)
            result["duplicates"] = duplicates

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":4,"total":13,"message":"Architecture analysis"})
            try:
                architecture_diagram = generate_architecture_diagram(repo_path)
            except Exception:
                architecture_diagram = None
            result["architecture_diagram"] = architecture_diagram

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":5,"total":13,"message":"Commit history"})
            commit_activity_graph = analyze_commit_history(repo_path)
            result["commit_activity_graph"] = commit_activity_graph

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":6,"total":13,"message":"Contributor analysis"})
            contributors = analyze_contributors(repo_path)
            result["contributors"] = contributors

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":7,"total":13,"message":"Code churn"})
            churn = analyze_code_churn(repo_path)
            result["code_churn"] = churn

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":8,"total":13,"message":"Risky files"})
            risky_files = detect_risky_files(complexity_report, churn)
            result["risky_files"] = risky_files

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":9,"total":13,"message":"Module sizes"})
            large_modules = analyze_module_sizes(repo_path)
            result["large_modules"] = large_modules

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":10,"total":13,"message":"Suggestions + Health"})
            suggestions = generate_suggestions(complexity_report, duplicates)
            health_score = calculate_health_score(complexity_report, duplicates, churn)

            result["suggestions"] = suggestions
            result["health_score"] = health_score

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":11,"total":13,"message":"Security violations"})
            violations = detect_violations(repo_path)
            result["violations"] = violations

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":12,"total":13,"message":"AI semantic duplicates"})

            semantic_dupes = []
            try:
                from src.ai_engine.semantic_similarity import find_semantic_duplicates
                
                # Render free tier optimization - hard 30s timeout to prevent locking
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                    future = pool.submit(find_semantic_duplicates, repo_path)
                    semantic_dupes = future.result(timeout=30.0)
            except concurrent.futures.TimeoutError:
                logger.warning(f"Semantic analysis timed out for {data.repo_url}")
            except Exception as e:
                logger.error(f"Semantic analysis error: {str(e)}")

            result["semantic_duplicates"] = semantic_dupes

            if not running_jobs.get(job_id, True):
                yield _sse_event("stopped", {"message": "Analysis stopped by user"})
                return

            yield _sse_event("progress", {"step":13,"total":13,"message":"AI risk prediction"})

            risk_predictions = predict_risky_files(
                repo_path,
                complexity_report,
                churn,
                contributors,
                large_modules
            )

            result["risk_predictions"] = risk_predictions

            try:
                graph = build_dependency_graph(repo_path)
                nodes = [{"id": n} for n in graph.nodes()]
                edges = [{"source": u, "target": v} for u, v in graph.edges()]
                result["architecture_graph"] = {"nodes": nodes, "edges": edges}
            except Exception:
                result["architecture_graph"] = {"nodes": [], "edges": []}
            
            processing_time = round(time.time() - start_time, 2)
            result["processing_time_seconds"] = processing_time

            logger.info(f"Job {job_id} complete. Time: {processing_time}s")
            yield _sse_event("complete", result)

        except Exception as e:
            logger.error(str(e))
            traceback.print_exc()
            yield _sse_event("error", {"message":str(e)})

        finally:
            if "repo_path" in locals():
                from src.parser.repo_loader import cleanup_repo
                cleanup_repo(repo_path)
            
            # Clean up job state
            running_jobs.pop(job_id, None)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":"no-cache",
            "Connection":"keep-alive"
        }
    )

# -----------------------------
# Stop Analysis Endpoint
# -----------------------------
@app.post("/stop-analysis")
def stop_analysis_endpoint(data: StopRequest):
    if data.job_id in running_jobs:
        running_jobs[data.job_id] = False
        return {"status": "analysis stopped"}
    return {"status": "job not found or already completed"}


# -----------------------------
# Spot Analysis Endpoint (Quick Scan)
# -----------------------------
@app.post("/spot-analysis")
def spot_analysis_endpoint(data: RepoRequest):
    start_time = time.time()
    try:
        repo_path = clone_repo(data.repo_url)
        
        total_files = 0
        file_ext_counts = {}
        file_sizes = []
        
        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in (
                'node_modules', 'venv', '.venv', '__pycache__', '.git',
                'dist', 'build', '.tox', '.eggs'
            )]
            for file in files:
                total_files += 1
                ext = os.path.splitext(file)[1].lower()
                if ext:
                    file_ext_counts[ext] = file_ext_counts.get(ext, 0) + 1
                
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        lines = sum(1 for _ in f)
                        file_sizes.append({"file": os.path.relpath(filepath, repo_path), "lines": lines})
                except Exception:
                    pass
                
        # mapping extensions to simplified languages (basic)
        lang_map = {
            ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript", 
            ".jsx": "React/JavaScript", ".tsx": "React/TypeScript",
            ".java": "Java", ".go": "Go", ".rb": "Ruby", ".php": "PHP", 
            ".html": "HTML", ".css": "CSS", ".c": "C", ".cpp": "C++", ".rs": "Rust"
        }
        
        languages = list(set([lang_map.get(ext, ext) for ext in file_ext_counts.keys() if ext in lang_map]))
        
        file_sizes.sort(key=lambda x: x["lines"], reverse=True)
        largest_modules = file_sizes[:5]
        
        from src.parser.repo_loader import cleanup_repo
        cleanup_repo(repo_path)
        
        processing_time = round(time.time() - start_time, 2)
        
        return {
            "repo": data.repo_url,
            "total_files": total_files,
            "languages": languages,
            "largest_modules": largest_modules,
            "message": "Quick scan completed",
            "processing_time_seconds": processing_time
        }
    except Exception as e:
        logger.error(f"Spot analysis failed: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})


# -----------------------------
# Legacy Analysis Endpoint (non-streaming)
# -----------------------------

@app.post("/analyze")
def analyze_repo(data: RepoRequest):

    repo_path = clone_repo(data.repo_url)

    complexity_report = analyze_complexity(repo_path)
    duplicates = detect_duplicates(repo_path)
    try:
        architecture_diagram = generate_architecture_diagram(repo_path)
    except Exception:
        architecture_diagram = None
    commit_activity_graph = analyze_commit_history(repo_path)
    contributors = analyze_contributors(repo_path)
    churn = analyze_code_churn(repo_path)
    risky_files = detect_risky_files(complexity_report, churn)
    large_modules = analyze_module_sizes(repo_path)
    suggestions = generate_suggestions(complexity_report, duplicates)
    health_score = calculate_health_score(complexity_report, duplicates, churn)
    violations = detect_violations(repo_path)

    try:
        from src.ai_engine.semantic_similarity import find_semantic_duplicates
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(find_semantic_duplicates, repo_path)
            semantic_dupes = future.result(timeout=30.0)
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
        from src.ai_engine.semantic_similarity import find_semantic_duplicates
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(find_semantic_duplicates, repo_path)
            results = future.result(timeout=30.0)
    except concurrent.futures.TimeoutError:
        return {"error": "Semantic analysis timed out", "semantic_duplicates": []}
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
# Report generator
# -----------------------------

@app.post("/report/generate")
def generate_report(request: dict):

    analysis_data = request.get("data")
    fmt = request.get("format","markdown")

    if not analysis_data:
        return JSONResponse(status_code=400,content={"error":"No analysis data"})

    if fmt == "markdown":
        md = generate_markdown_report(analysis_data)
        return Response(content=md,media_type="text/markdown")

    elif fmt == "pdf":
        pdf_path = generate_pdf_report(analysis_data)
        return FileResponse(pdf_path,media_type="application/pdf")

    elif fmt == "json":
        summary = generate_json_summary(analysis_data)
        return JSONResponse(content=summary)

    return JSONResponse(status_code=400,content={"error":"Invalid format"})


# -----------------------------
# Architecture image
# -----------------------------

@app.get("/architecture.png")
def get_architecture():
    return FileResponse("architecture.png")


# -----------------------------
# Startup
# -----------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("src.main:app", host="0.0.0.0", port=port)