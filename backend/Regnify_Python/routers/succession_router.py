from fastapi import APIRouter
from services.ml_service_s import MLService
from utils.talent_grid import categorize
from utils.feature_engineering import engineer_features
from utils.explainability import explain_employee

router = APIRouter()

ml = MLService()


@router.post("/evaluate_employee")
def evaluate_employee(employee: dict):

    scores = ml.predict_scores(employee)

    features = engineer_features(employee)

    explanation = explain_employee(features)

    category = categorize(
        scores["performance_score"],
        scores["potential_score"]
    )

    return {
        "performance_score": scores["performance_score"],
        "potential_score": scores["potential_score"],
        "talent_category": category,
        "explanation": explanation
    }