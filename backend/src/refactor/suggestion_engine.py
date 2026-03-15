def generate_suggestions(complexity_report, duplicates):

    suggestions = []

    for item in complexity_report:
        suggestions.append(
            f"Function '{item['function']}' in {item['file']} is too complex."
        )

    if duplicates:
        suggestions.append(
            "Duplicate files detected. Consider refactoring shared logic."
        )

    if not suggestions:
        suggestions.append(
            "No major issues found. Code structure looks good."
        )

    return suggestions