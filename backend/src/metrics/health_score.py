def calculate_health_score(complexity, duplicates, churn):

    score = 100

    score -= len(complexity) * 2
    score -= len(duplicates) * 5
    score -= len(churn) * 1

    if score < 0:
        score = 0

    return score