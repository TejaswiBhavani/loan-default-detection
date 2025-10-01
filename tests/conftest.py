"""Shared pytest fixtures for the loan default project."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Iterator

import pandas as pd
import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts.generate_synthetic_data import sample_rows
from src.db.base import configure_database, get_session, init_db
from src.db.models import PredictionLog, RiskAlert
from src.pipeline.training import train
from src.services.predictor import PredictorService
from src.utils.config import AppConfig, get_config


@pytest.fixture(scope="session")
def temp_config(tmp_path_factory) -> AppConfig:
    base_config = get_config().model_dump()
    work_dir = tmp_path_factory.mktemp("loan_default_artifacts")

    base_config["data"]["raw_path"] = str(work_dir / "loan_applications.csv")
    base_config["data"]["processed_path"] = str(work_dir / "loan_processed.csv")
    base_config["data"]["feature_store"] = str(work_dir / "feature_store.csv")

    base_config["artifacts"]["model_path"] = str(work_dir / "model.joblib")
    base_config["artifacts"]["metrics_report"] = str(work_dir / "metrics.json")
    base_config["artifacts"]["feature_importances"] = str(work_dir / "feature_importances.csv")

    base_config["database"]["url"] = f"sqlite:///{work_dir / 'test.db'}"

    config = AppConfig(**base_config)
    configure_database(config)
    return config


@pytest.fixture(scope="session")
def trained_service(temp_config: AppConfig) -> Iterator[PredictorService]:
    df = sample_rows(800, random_state=123)
    df.to_csv(temp_config.data.raw_path, index=False)
    train(temp_config)
    service = PredictorService(config=temp_config)
    yield service


@pytest.fixture(autouse=True)
def clear_database(temp_config: AppConfig) -> Iterator[None]:
    init_db(temp_config)
    with get_session() as session:
        session.query(RiskAlert).delete()
        session.query(PredictionLog).delete()
    yield