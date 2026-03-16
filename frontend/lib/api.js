const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function checkHealth() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(`${API_URL}/health`, {
            signal: controller.signal
        });
        clearTimeout(timeout);
        return response.ok;
    } catch {
        clearTimeout(timeout);
        return false;
    }
}

export async function analyzeRepo(repoUrl) {
    const response = await fetch(`${API_URL}/analyze-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
}

export async function stopAnalysis(jobId) {
    const response = await fetch(`${API_URL}/stop-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId })
    });
    if (!response.ok) throw new Error("Could not stop analysis");
    return response.json();
}

export async function spotAnalysis(repoUrl) {
    const response = await fetch(`${API_URL}/spot-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl })
    });
    if (!response.ok) throw new Error("Spot analysis failed");
    return response.json();
}
