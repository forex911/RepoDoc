import os
import re


# Patterns that indicate potential violations
SECRET_PATTERNS = [
    (r'(?i)(api[_-]?key|apikey)\s*[=:]\s*["\'][A-Za-z0-9_\-]{16,}["\']', "Hardcoded API Key"),
    (r'(?i)(secret[_-]?key|secretkey)\s*[=:]\s*["\'][A-Za-z0-9_\-]{16,}["\']', "Hardcoded Secret Key"),
    (r'(?i)(password|passwd|pwd)\s*[=:]\s*["\'][^"\']{4,}["\']', "Hardcoded Password"),
    (r'(?i)(access[_-]?token|auth[_-]?token)\s*[=:]\s*["\'][A-Za-z0-9_\-]{16,}["\']', "Hardcoded Access Token"),
    (r'(?i)(aws[_-]?access[_-]?key[_-]?id)\s*[=:]\s*["\']AKIA[A-Z0-9]{16}["\']', "AWS Access Key"),
    (r'(?i)(aws[_-]?secret[_-]?access[_-]?key)\s*[=:]\s*["\'][A-Za-z0-9/+=]{40}["\']', "AWS Secret Key"),
    (r'ghp_[A-Za-z0-9]{36}', "GitHub Personal Access Token"),
    (r'sk-[A-Za-z0-9]{32,}', "OpenAI API Key"),
    (r'(?i)(mongodb(\+srv)?://)[^\s"\']+:[^\s"\']+@', "MongoDB Connection String with Credentials"),
    (r'(?i)(mysql|postgres|postgresql)://[^\s"\']+:[^\s"\']+@', "Database Connection String with Credentials"),
]

SECURITY_PATTERNS = [
    (r'(?i)eval\s*\(', "Use of eval() — potential code injection"),
    (r'(?i)exec\s*\(', "Use of exec() — potential code injection"),
    (r'(?i)subprocess\.call\s*\(.*shell\s*=\s*True', "Subprocess with shell=True — command injection risk"),
    (r'(?i)os\.system\s*\(', "Use of os.system() — prefer subprocess"),
    (r'(?i)pickle\.loads?\s*\(', "Use of pickle — deserialization vulnerability"),
    (r'(?i)(verify\s*=\s*False|VERIFY_SSL\s*=\s*False)', "SSL verification disabled"),
    (r'(?i)DEBUG\s*=\s*True', "Debug mode enabled"),
    (r'(?i)allow_origins\s*=\s*\[\s*["\']?\*["\']?\s*\]', "CORS wildcard origin — restrict in production"),
]

LICENSE_FILES = ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING", "COPYING.md"]

UNSAFE_PATTERNS = [
    (r'(?i)(scrape|scraping|crawler|crawling)', "Web scraping references detected"),
    (r'(?i)(bypass|circumvent)\s+(captcha|rate.?limit|auth)', "Bypass/circumvention logic detected"),
    (r'(?i)selenium|playwright|puppeteer', "Browser automation library usage"),
]


def detect_violations(repo_path):
    """
    Scan a repository for potential violations:
    - Hardcoded secrets and API keys
    - Security vulnerabilities
    - Missing license
    - Unsafe/risky patterns
    """

    violations = []

    # Check for license file
    has_license = False
    for lf in LICENSE_FILES:
        if os.path.exists(os.path.join(repo_path, lf)):
            has_license = True
            break

    if not has_license:
        violations.append({
            "type": "license",
            "severity": "warning",
            "file": "—",
            "line": None,
            "message": "No LICENSE file found — add a license to clarify usage terms",
        })

    # Check for .gitignore
    gitignore_path = os.path.join(repo_path, ".gitignore")
    if not os.path.exists(gitignore_path):
        violations.append({
            "type": "config",
            "severity": "warning",
            "file": "—",
            "line": None,
            "message": "No .gitignore file — sensitive files may be accidentally committed",
        })

    # Check for .env files committed
    for root, dirs, files in os.walk(repo_path):
        # Skip hidden dirs and common non-source dirs
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in (
            'node_modules', 'venv', '.venv', '__pycache__', '.git',
            'dist', 'build', '.tox', '.eggs'
        )]

        for fname in files:
            if fname in ('.env', '.env.local', '.env.production'):
                violations.append({
                    "type": "secret",
                    "severity": "critical",
                    "file": os.path.relpath(os.path.join(root, fname), repo_path),
                    "line": None,
                    "message": f"Environment file '{fname}' is committed — add to .gitignore",
                })

    # Scan source files for pattern violations
    scannable_extensions = {'.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rb', '.php', '.yml', '.yaml', '.json', '.env', '.cfg', '.ini', '.toml'}

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in (
            'node_modules', 'venv', '.venv', '__pycache__', '.git',
            'dist', 'build', '.tox', '.eggs'
        )]

        for fname in files:
            ext = os.path.splitext(fname)[1].lower()
            if ext not in scannable_extensions:
                continue

            file_path = os.path.join(root, fname)
            rel_path = os.path.relpath(file_path, repo_path)

            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
            except Exception:
                continue

            for line_num, line in enumerate(lines, 1):
                # Secrets
                for pattern, label in SECRET_PATTERNS:
                    if re.search(pattern, line):
                        violations.append({
                            "type": "secret",
                            "severity": "critical",
                            "file": rel_path,
                            "line": line_num,
                            "message": label,
                        })

                # Security
                for pattern, label in SECURITY_PATTERNS:
                    if re.search(pattern, line):
                        violations.append({
                            "type": "security",
                            "severity": "warning",
                            "file": rel_path,
                            "line": line_num,
                            "message": label,
                        })

                # Unsafe patterns
                for pattern, label in UNSAFE_PATTERNS:
                    if re.search(pattern, line):
                        violations.append({
                            "type": "unsafe",
                            "severity": "info",
                            "file": rel_path,
                            "line": line_num,
                            "message": label,
                        })

    return violations
