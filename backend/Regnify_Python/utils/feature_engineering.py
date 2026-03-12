import numpy as np


def normalize(value, min_val, max_val):
    return (value - min_val) / (max_val - min_val)


def invert(value):
    return 1 - value


def engineer_features(employee):

    completion_ratio = normalize(employee["completion_ratio"], 0, 1)
    task_consistency = normalize(employee["task_consistency"], 0, 1)
    attendance = normalize(employee["attendance_percent"], 0, 100)

    delay = normalize(employee["avg_delay_days"], 0, 10)
    delay = invert(delay)

    manager_rating = normalize(employee["manager_rating"], 1, 5)

    performance_trend = normalize(employee["performance_trend"], -1, 1)

    escalation = normalize(employee["escalation_count"], 0, 10)
    warnings = normalize(employee["warning_count"], 0, 5)

    execution_ability = 0.5 * completion_ratio + 0.5 * task_consistency
    reliability = attendance
    leadership_trust = manager_rating
    growth_momentum = performance_trend
    behavioral_risk = 0.6 * escalation + 0.4 * warnings

    return [
        execution_ability,
        reliability,
        leadership_trust,
        growth_momentum,
        behavioral_risk
    ]