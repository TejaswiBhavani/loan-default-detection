"""Flask application exposing prediction endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from flask import Flask, jsonify, request
from flask_cors import CORS
from pydantic import ValidationError

from ..db.base import get_session, init_db
from ..db import crud
from ..services.predictor import PredictorService, get_predictor_service
from ..utils.logger import get_logger

logger = get_logger(__name__)


def create_app(service: PredictorService | None = None) -> Flask:
    if service is not None:
        init_db(service.config)
    else:
        init_db()
    app = Flask(__name__)
    CORS(app)

    predictor = service or get_predictor_service()

    @app.route("/health", methods=["GET"])
    def health() -> Any:
        return jsonify({"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()})

    @app.route("/predict", methods=["POST"])
    def predict() -> Any:
        payload = request.get_json(force=True)
        if payload is None:
            return jsonify({"error": "Missing JSON payload"}), 400
        try:
            result = predictor.predict_one(payload)
        except ValidationError as error:
            return jsonify({"error": error.errors()}), 400
        except FileNotFoundError as error:
            logger.exception("Model artifact missing")
            return jsonify({"error": str(error)}), 500
        except Exception as error:
            logger.exception("Prediction failed")
            return jsonify({"error": str(error)}), 500

        data = result.model_dump()
        payload = {
            "application_id": data["application_id"],
            "default_risk_score": data["default_risk_score"],
            "loan_decision": data["loan_decision"],
            "reason": data["reason"],
            "approved": data["approved"],
            "risk_category": data["risk_category"],
            "alert": data["alert"],
            "thresholds": data["thresholds"],
        }
        return jsonify(payload)

    @app.route("/predict/batch", methods=["POST"])
    def predict_batch() -> Any:
        payload = request.get_json(force=True)
        if not isinstance(payload, list):
            return jsonify({"error": "Expected a list of payloads"}), 400
        try:
            results = predictor.predict_batch(payload)
        except ValidationError as error:
            return jsonify({"error": error.errors()}), 400
        except Exception as error:
            logger.exception("Batch prediction failed")
            return jsonify({"error": str(error)}), 500

        response_data = []
        for result in results:
            data = result.model_dump()
            response_data.append(
                {
                    "application_id": data["application_id"],
                    "default_risk_score": data["default_risk_score"],
                    "loan_decision": data["loan_decision"],
                    "reason": data["reason"],
                    "approved": data["approved"],
                    "risk_category": data["risk_category"],
                    "alert": data["alert"],
                    "thresholds": data["thresholds"],
                }
            )

        return jsonify(response_data)

    @app.route("/predictions", methods=["GET"])
    def list_predictions() -> Any:
        limit = int(request.args.get("limit", 50))
        with get_session() as session:
            records = crud.get_recent_predictions(session, limit=limit)
        response = [
            {
                "id": record.id,
                "created_at": record.created_at.isoformat() if record.created_at else None,
                "application_id": record.application_id,
                "probability": record.probability,
                "risk_category": record.risk_category,
                "alert_triggered": record.alert_triggered,
            }
            for record in records
        ]
        return jsonify(response)

    @app.route("/alerts", methods=["GET"])
    def list_alerts() -> Any:
        limit = int(request.args.get("limit", 50))
        with get_session() as session:
            records = crud.get_recent_alerts(session, limit=limit)
        response = [
            {
                "id": record.id,
                "created_at": record.created_at.isoformat() if record.created_at else None,
                "prediction_id": record.prediction_id,
                "message": record.message,
                "severity": record.severity,
            }
            for record in records
        ]
        return jsonify(response)

    return app


__all__ = ["create_app"]
