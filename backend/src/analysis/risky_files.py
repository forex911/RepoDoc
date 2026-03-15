def detect_risky_files(complexity_report, churn):

    risky = []

    churn_files = {f[0]: f[1] for f in churn}

    for item in complexity_report:

        file = item["file"]

        if file in churn_files and churn_files[file] > 10:

            risky.append({
                "file": file,
                "complexity": item["complexity"],
                "changes": churn_files[file]
            })

    return risky