def succession_score(perf, pot):

    return 0.6 * pot + 0.4 * perf


def recommend_successors(employees):

    ranked = []

    for emp in employees:

        score = succession_score(
            emp["performance_score"],
            emp["potential_score"]
        )

        ranked.append({
            "name": emp["name"],
            "score": round(score, 2)
        })

    ranked.sort(key=lambda x: x["score"], reverse=True)

    return ranked[:3]