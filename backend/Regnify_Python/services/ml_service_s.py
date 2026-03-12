import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from utils.feature_engineering import engineer_features


class MLService:

    def __init__(self):
        self.performance_model = RandomForestRegressor()
        self.potential_model = RandomForestRegressor()
        self.train()

    def generate_synthetic_data(self, n=2000):

        data = []

        for _ in range(n):

            employee = {
                "completion_ratio": np.random.uniform(0.4, 1),
                "task_consistency": np.random.uniform(0.4, 1),
                "attendance_percent": np.random.uniform(70, 100),
                "avg_delay_days": np.random.uniform(0, 8),
                "manager_rating": np.random.uniform(1, 5),
                "performance_trend": np.random.uniform(-1, 1),
                "escalation_count": np.random.randint(0, 5),
                "warning_count": np.random.randint(0, 3)
            }

            features = engineer_features(employee)

            performance = (
                features[0] * 40 +
                features[1] * 20 +
                features[2] * 25 +
                features[4] * -10
            )

            potential = (
                features[3] * 40 +
                features[2] * 30 +
                features[1] * 10 +
                features[4] * -10
            )

            data.append(features + [performance, potential])

        columns = [
            "execution",
            "reliability",
            "leadership",
            "growth",
            "risk",
            "performance",
            "potential"
        ]

        return pd.DataFrame(data, columns=columns)

    def train(self):

        df = self.generate_synthetic_data()

        X = df[[
            "execution",
            "reliability",
            "leadership",
            "growth",
            "risk"
        ]]

        y_perf = df["performance"]
        y_pot = df["potential"]

        self.performance_model.fit(X, y_perf)
        self.potential_model.fit(X, y_pot)

    def predict_scores(self, employee):

        features = engineer_features(employee)

        perf = self.performance_model.predict([features])[0]
        pot = self.potential_model.predict([features])[0]

        perf = max(0, min(100, perf))
        pot = max(0, min(100, pot))

        return {
            "performance_score": round(perf, 2),
            "potential_score": round(pot, 2)
        }