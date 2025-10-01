from __future__ import annotations

import pytest

from src.api.app import create_app


@pytest.fixture()
def api_client(trained_service):
    app = create_app(service=trained_service)
    app.config.update({"TESTING": True})
    with app.test_client() as client:
        yield client


def sample_payload(**overrides):
    payload = {
        "application_id": "API-TEST",
        "loan_amount": 20000,
        "interest_rate": 12.0,
        "annual_income": 70000,
        "credit_score": 690,
        "employment_length": 5,
        "dti": 20.0,
        "num_delinquencies": 1,
        "previous_defaults": 0,
        "home_ownership": "rent",
        "purpose": "credit_card",
        "state": "ca",
    }
    payload.update(overrides)
    return payload


def test_health_endpoint(api_client):
    response = api_client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"


def test_predict_endpoint_returns_probability(api_client):
    response = api_client.post("/predict", json=sample_payload())
    assert response.status_code == 200
    data = response.get_json()
    assert set(data.keys()) >= {"probability", "risk_category", "alert"}
    assert 0 <= data["probability"] <= 1


def test_batch_prediction_endpoint(api_client):
    payload = [sample_payload(application_id=f"API-{i}") for i in range(3)]
    response = api_client.post("/predict/batch", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 3
    assert all(0 <= item["probability"] <= 1 for item in data)
