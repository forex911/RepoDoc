# AI Repository Intelligence Platform (RepoDoc)

RepoDoc is an advanced, AI-powered static analysis platform designed to inspect GitHub repositories. It evaluates code health, predicts bug-prone files using AI, generates dependency graphs, identifies semantic duplicates using CodeBERT, and detects security violations.

## 🚀 Features

*   **Live Analysis Streaming:** Watch the analysis progress in real-time.
*   **Security & Violation Detection:** Scans for hardcoded secrets, missing licenses, and unsafe patterns.
*   **AI Bug Prediction:** Predicts risk levels of files based on complexity, churn, and size.
*   **Semantic Clone Detection:** Uses CodeBERT to find structurally distinct but functionally identical code blocks.
*   **Architecture Graphing:** Generates an interactive Cytoscape dependency graph of the repository modules.
*   **Actionable Refactoring Suggestions:** Provides specific advice on decoupling and simplifying code.
*   **Report Generation:** Export comprehensive PDF, Markdown, and JSON reports.

## 🏗 Architecture

The platform uses a modern decoupled architecture designed for ephemeral serverless and PaaS deployments.

- **Backend:** FastAPI (Python)
- **Frontend:** Next.js (React)
- **Deployment Targets:** Vercel (Frontend), Render (Backend)
- **AI Engine:** HuggingFace `transformers` (CodeBERT)

## 🛠 Local Development Installation

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Set up a virtual environment and install dependencies:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\\Scripts\\activate
    pip install -r requirements.txt
    ```
3.  Set up environment variables:
    ```bash
    cp .env.example .env
    ```
    *Edit `.env` if necessary.*
4.  Start the FastAPI server:
    ```bash
    uvicorn src.main:app --reload
    ```
    *The backend runs on `http://localhost:8000`.*

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  Set up environment variables:
    ```bash
    cp .env.example .env.local
    ```
    *Ensure `NEXT_PUBLIC_API_URL` points to your backend.*
4.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
    *The frontend runs on `http://localhost:3000`.*

## 🚀 Production Deployment

### Deploying the Backend to Render

1.  Create a new **Web Service** on Render connected to your GitHub repository.
2.  Set the Root Directory to `backend`.
3.  Set the Environment to `Python`.
4.  Set the Build Command:
    ```bash
    pip install -r requirements.txt
    ```
5.  Set the Start Command (Render provides dynamic ports via `$PORT`):
    ```bash
    uvicorn src.main:app --host 0.0.0.0 --port $PORT
    ```
6.  *(Optional)* Add `render.yaml` configurations to auto-deploy your infrastructure.

### Deploying the Frontend to Vercel

1.  Create a new project on Vercel and import your repository.
2.  Set the Root Directory to `frontend`.
3.  Vercel will automatically detect Next.js and apply the correct build settings (`npm run build`).
4.  **Critical:** In the Environment Variables section, add:
    *   **Key:** `NEXT_PUBLIC_API_URL`
    *   **Value:** `https://your-render-backend-url.onrender.com`
5.  Deploy!

## 🧹 Ephemeral Storage Note
The analyzer utilizes ephemeral storage to clone GitHub repositories during analysis. On Render's free tier, the system automatically deletes the cloned directory after the report is sent to the client to immediately free up space for subsequent analyses and prevent hitting disk limits.

## 📜 License
MIT License.
