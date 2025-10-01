"""ORM models for persisting predictions and alerts."""

from __future__ import annotations

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from .base import Base


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    application_id = Column(String(64), nullable=True, index=True)
    features = Column(JSON, nullable=False)
    probability = Column(Float, nullable=False)
    risk_category = Column(String(16), nullable=False)
    alert_triggered = Column(String(8), nullable=False)

    alerts = relationship("RiskAlert", back_populates="prediction", cascade="all, delete-orphan")


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    prediction_id = Column(Integer, ForeignKey("prediction_logs.id", ondelete="CASCADE"), nullable=False)
    message = Column(String(255), nullable=False)
    severity = Column(String(16), nullable=False, default="HIGH")

    prediction = relationship("PredictionLog", back_populates="alerts")
