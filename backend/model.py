import numpy as np
from sklearn.ensemble import IsolationForest

class BehaviorModel:
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.15,
            random_state=42
        )
        self.trained = False

    def train(self, data):
        self.model.fit(data)
        self.trained = True

    def predict_risk(self, features):
        score = self.model.decision_function([features])[0]
        # Convert to 0–1 risk score
        risk = min(max(1 - score, 0), 1)
        return risk
