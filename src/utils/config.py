"""Configuration loading utilities for the loan default detection project."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

import yaml
from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = PROJECT_ROOT / "config" / "config.yaml"


class RiskThresholds(BaseModel):
    low: float = Field(..., ge=0, le=1)
    medium: float = Field(..., ge=0, le=1)

    @field_validator("medium")
    @classmethod
    def validate_medium(cls, value: float, info: ValidationInfo) -> float:
        low = info.data.get("low", 0)
        if value < low:
            raise ValueError("medium threshold must be >= low threshold")
        return value


class ModelConfig(BaseModel):
    type: str = Field("gradient_boosting", description="Model identifier")
    random_state: int = 42
    risk_thresholds: RiskThresholds


class TrainingConfig(BaseModel):
    test_size: float = Field(0.2, gt=0, lt=1)
    cv_folds: int = Field(5, ge=2)
    target_column: str
    id_column: Optional[str] = None


class DataConfig(BaseModel):
    raw_path: str
    processed_path: str
    feature_store: str

    @property
    def raw_path_abs(self) -> Path:
        return PROJECT_ROOT / self.raw_path

    @property
    def processed_path_abs(self) -> Path:
        return PROJECT_ROOT / self.processed_path

    @property
    def feature_store_abs(self) -> Path:
        return PROJECT_ROOT / self.feature_store


class ArtifactsConfig(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_path: str
    metrics_report: str
    feature_importances: str

    @property
    def model_path_abs(self) -> Path:
        return PROJECT_ROOT / self.model_path

    @property
    def metrics_report_abs(self) -> Path:
        return PROJECT_ROOT / self.metrics_report

    @property
    def feature_importances_abs(self) -> Path:
        return PROJECT_ROOT / self.feature_importances


class LoggingConfig(BaseModel):
    level: str = "INFO"
    file: str = "logs/app.log"

    @property
    def file_path_abs(self) -> Path:
        return PROJECT_ROOT / self.file


class DatabaseConfig(BaseModel):
    url: str = Field(..., description="SQLAlchemy database URL")
    echo: bool = False


class AppConfig(BaseModel):
    model: ModelConfig
    training: TrainingConfig
    data: DataConfig
    artifacts: ArtifactsConfig
    logging: LoggingConfig
    database: DatabaseConfig


def _load_yaml_config(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Configuration file not found at {path}")
    with path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file)


@lru_cache(maxsize=1)
def get_config(config_path: Optional[Path] = None) -> AppConfig:
    """Load configuration from YAML and environment overrides."""

    load_dotenv(override=False)

    path = config_path or CONFIG_PATH
    data = _load_yaml_config(path)

    # Environment overrides
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        data.setdefault("database", {})["url"] = database_url

    model_path = os.getenv("MODEL_PATH")
    if model_path:
        data.setdefault("artifacts", {})["model_path"] = model_path

    log_level = os.getenv("LOG_LEVEL")
    if log_level:
        data.setdefault("logging", {})["level"] = log_level

    return AppConfig(**data)


__all__ = [
    "AppConfig",
    "ArtifactsConfig",
    "DataConfig",
    "DatabaseConfig",
    "LoggingConfig",
    "ModelConfig",
    "RiskThresholds",
    "TrainingConfig",
    "get_config",
]
