from __future__ import annotations

from src.db.base import get_session
from src.db.models import PredictionLog, RiskAlert


def test_predictor_low_risk_prediction(trained_service):
    payload = {
        "application_id": "TEST-LOW",
        "loan_amount": 18000,
        "interest_rate": 11.0,
        "annual_income": 85000,
        "credit_score": 720,
        "employment_length": 7,
        "dti": 15.0,
        "num_delinquencies": 0,
        "previous_defaults": 0,
        "home_ownership": "rent",
        "purpose": "credit_card",
        "state": "ca",
    }

    result = trained_service.predict_one(payload)

    assert 0 <= result.probability <= 1
    assert result.risk_category in {"LOW", "MEDIUM", "HIGH"}
    assert result.thresholds["low"] < result.thresholds["medium"]

    with get_session() as session:
        count = session.query(PredictionLog).count()
    assert count == 1


def test_predictor_high_risk_creates_alert(trained_service):
    payload = {
        "application_id": "TEST-HIGH",
        "loan_amount": 72000,
        "interest_rate": 30.0,
        "annual_income": 25000,
        "credit_score": 540,
        "employment_length": 1,
        "dti": 45.0,
        "num_delinquencies": 3,
        "previous_defaults": 2,
        "home_ownership": "rent",
        "purpose": "small_business",
        "state": "tx",
    }

    result = trained_service.predict_one(payload)

    assert result.alert is True
    assert result.risk_category == "HIGH"

    with get_session() as session:
        alert_count = session.query(RiskAlert).count()
        log_count = session.query(PredictionLog).count()

    assert alert_count == 1
    assert log_count == 1
