"""Prediction service for scoring loan applications."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from typing import Iterable, List, Optional

import joblib
import pandas as pd
from pydantic import BaseModel, Field, ValidationError, field_validator

from ..db.base import get_session, init_db
from ..db import crud
from ..utils.config import AppConfig, get_config
from ..utils.logger import get_logger
from ..pipeline.preprocess import CATEGORICAL_FEATURES, NUMERIC_FEATURES

logger = get_logger(__name__)


class LoanApplication(BaseModel):
    application_id: Optional[str] = Field(default=None)
    application_date: Optional[datetime] = Field(default=None)
    loan_amount: float = Field(..., ge=0)
    interest_rate: float = Field(..., ge=0)
    annual_income: float = Field(..., ge=0)
    credit_score: int = Field(..., ge=300, le=850)
    employment_length: int = Field(..., ge=0, le=60)
    dti: float = Field(..., ge=0)
    num_delinquencies: int = Field(..., ge=0)
    previous_defaults: int = Field(..., ge=0)
    home_ownership: str
    purpose: str
    state: str

    @field_validator("home_ownership")
    @classmethod
    def uppercase_home_ownership(cls, value: str) -> str:
        return value.upper()

    @field_validator("state")
    @classmethod
    def uppercase_state(cls, value: str) -> str:
        return value.upper()

    @field_validator("purpose")
    @classmethod
    def normalize_purpose(cls, value: str) -> str:
        return value.lower()


class PredictionResponse(BaseModel):
    application_id: Optional[str]
    probability: float
    risk_category: str
    alert: bool
    thresholds: dict


@dataclass
class PredictorService:
    config: AppConfig

    def __post_init__(self) -> None:
        init_db(self.config)
        self._pipeline = self._load_pipeline()
        self.thresholds = {
            "low": self.config.model.risk_thresholds.low,
            "medium": self.config.model.risk_thresholds.medium,
        }

    @staticmethod
    @lru_cache(maxsize=1)
    def _load_pipeline_cached(model_path: str):
        logger.info("Loading model pipeline from %s", model_path)
        return joblib.load(model_path)

    def _load_pipeline(self):
        model_path = self.config.artifacts.model_path
        pipeline = self._load_pipeline_cached(model_path)
        return pipeline

    @classmethod
    def create(cls) -> "PredictorService":
        config = get_config()
        return cls(config=config)

    def _prepare_dataframe(self, applications: List[LoanApplication]) -> pd.DataFrame:
        records = []
        for app in applications:
            data = app.model_dump()
            record = {feature: data.get(feature) for feature in NUMERIC_FEATURES + CATEGORICAL_FEATURES}
            # Optional fields
            if app.application_date is not None:
                record["application_date"] = app.application_date
            records.append(record)
        df = pd.DataFrame(records)
        return df

    def _categorize_risk(self, probability: float) -> tuple[str, bool]:
        low = self.thresholds["low"]
        medium = self.thresholds["medium"]
        if probability < low:
            return "LOW", False
        if probability < medium:
            return "MEDIUM", False
        return "HIGH", True

    def predict_one(self, payload: dict) -> PredictionResponse:
        try:
            application = LoanApplication(**payload)
        except ValidationError as error:
            logger.error("Validation error: %s", error)
            raise

        df = self._prepare_dataframe([application])
        probability = float(self._pipeline.predict_proba(df)[0][1])
        risk_category, alert = self._categorize_risk(probability)

        self._log_prediction(application, probability, risk_category, alert)

        return PredictionResponse(
            application_id=application.application_id,
            probability=probability,
            risk_category=risk_category,
            alert=alert,
            thresholds=self.thresholds,
        )

    def predict_batch(self, rows: Iterable[dict]) -> List[PredictionResponse]:
        applications = [LoanApplication(**row) for row in rows]
        df = self._prepare_dataframe(applications)
        probabilities = self._pipeline.predict_proba(df)[:, 1]

        responses: List[PredictionResponse] = []
        for app, prob in zip(applications, probabilities):
            risk_category, alert = self._categorize_risk(float(prob))
            self._log_prediction(app, float(prob), risk_category, alert)
            responses.append(
                PredictionResponse(
                    application_id=app.application_id,
                    probability=float(prob),
                    risk_category=risk_category,
                    alert=alert,
                    thresholds=self.thresholds,
                )
            )
        return responses

    def _log_prediction(
        self,
        application: LoanApplication,
        probability: float,
        risk_category: str,
        alert: bool,
    ) -> None:
        try:
            with get_session() as session:
                prediction = crud.log_prediction(
                    session,
                    application_id=application.application_id,
                    features=application.model_dump(mode="json"),
                    probability=probability,
                    risk_category=risk_category,
                    alert=alert,
                )
                if alert:
                    message = (
                        f"High-risk applicant {application.application_id or prediction.id} with probability {probability:.2f}"
                    )
                    crud.create_alert(session, prediction, message=message)
        except Exception as exc:
            logger.exception("Failed to log prediction: %s", exc)


@lru_cache(maxsize=1)
def get_predictor_service() -> PredictorService:
    return PredictorService.create()
