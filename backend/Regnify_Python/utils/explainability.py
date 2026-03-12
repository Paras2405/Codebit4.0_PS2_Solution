def explain_employee(features):

    execution, reliability, leadership, growth, risk = features

    explanations = []

    if execution > 0.7:
        explanations.append("Strong task execution and consistency")

    if reliability > 0.8:
        explanations.append("Highly reliable with strong attendance")

    if leadership > 0.7:
        explanations.append("Strong leadership trust from manager")

    if growth > 0.6:
        explanations.append("Positive performance growth trend")

    if risk > 0.5:
        explanations.append("Behavioral risks detected")

    if not explanations:
        explanations.append("Balanced but moderate performance indicators")

    return explanations