"""CRUD helpers for prediction logs and alerts."""

from __future__ import annotations

from typing import Iterable, List

from sqlalchemy import desc
from sqlalchemy.orm import Session

from .models import PredictionLog, RiskAlert


def log_prediction(
    session: Session,
    *,
    application_id: str | None,
    features: dict,
    probability: float,
    risk_category: str,
    alert: bool,
) -> PredictionLog:
    log = PredictionLog(
        application_id=application_id,
        features=features,
        probability=probability,
        risk_category=risk_category,
        alert_triggered="YES" if alert else "NO",
    )
    session.add(log)
    session.flush()
    return log


def create_alert(session: Session, prediction: PredictionLog, message: str, severity: str = "HIGH") -> RiskAlert:
    alert = RiskAlert(prediction=prediction, message=message, severity=severity)
    session.add(alert)
    return alert


def get_recent_predictions(session: Session, limit: int = 100) -> List[PredictionLog]:
    return (
        session.query(PredictionLog)
        .order_by(desc(PredictionLog.created_at))
        .limit(limit)
        .all()
    )


def get_recent_alerts(session: Session, limit: int = 50) -> List[RiskAlert]:
    return (
        session.query(RiskAlert)
        .order_by(desc(RiskAlert.created_at))
        .limit(limit)
        .all()
    )
