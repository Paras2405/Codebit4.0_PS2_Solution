def categorize(performance, potential):

    if performance >= 75 and potential >= 75:
        return "Ready for Site Head"

    if performance >= 70 and potential >= 55:
        return "Ready for Manager"

    if performance >= 50 and potential >= 70:
        return "Emerging Leader"

    if performance >= 50 and potential >= 50:
        return "Strong Individual Contributor"

    if performance < 50 and potential >= 60:
        return "Needs Development (High Potential)"

    return "Performance Improvement Required"