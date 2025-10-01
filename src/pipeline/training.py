"""Training pipeline for the loan default classification model."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline

from ..utils.config import AppConfig
from ..utils.logger import get_logger
from .evaluation import evaluate_classifier
from .preprocess import (
    build_preprocessor,
    get_feature_names,
    load_raw_data,
    split_features_target,
)

logger = get_logger(__name__)


def build_model(random_state: int) -> GradientBoostingClassifier:
    return GradientBoostingClassifier(random_state=random_state)


def make_pipeline(random_state: int) -> Pipeline:
    preprocessor = build_preprocessor()
    model = build_model(random_state)
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", model),
        ]
    )
    return pipeline


def fit_pipeline(
    config: AppConfig,
) -> Tuple[Pipeline, pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
    raw_path = Path(config.data.raw_path)
    df = load_raw_data(str(raw_path))
    X, y = split_features_target(
        df,
        target_column=config.training.target_column,
        id_column=config.training.id_column,
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=config.training.test_size,
        random_state=config.model.random_state,
        stratify=y,
    )

    pipeline = make_pipeline(config.model.random_state)

    pipeline.fit(X_train, y_train)

    return pipeline, X_train, y_train, X_test, y_test


def run_cross_validation(pipeline: Pipeline, X: pd.DataFrame, y: pd.Series, cv: int) -> Dict[str, float]:
    skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)
    scores = []
    for fold, (train_idx, test_idx) in enumerate(skf.split(X, y), start=1):
        pipeline.fit(X.iloc[train_idx], y.iloc[train_idx])
        score = pipeline.score(X.iloc[test_idx], y.iloc[test_idx])
        logger.info("Fold %s accuracy: %.4f", fold, score)
        scores.append(score)
    return {
        "accuracy_mean": float(np.mean(scores)),
        "accuracy_std": float(np.std(scores)),
    }


def persist_artifacts(
    pipeline: Pipeline,
    config: AppConfig,
    X_train: pd.DataFrame,
    y_train: pd.Series,
) -> Dict[str, str]:
    model_path = Path(config.artifacts.model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, model_path)

    preprocessor = pipeline.named_steps["preprocessor"]
    feature_names = get_feature_names(preprocessor)

    # Save processed training features for reference
    processed_data = preprocessor.transform(X_train)
    processed_df = pd.DataFrame(processed_data, columns=feature_names)
    processed_df["target"] = y_train.reset_index(drop=True)
    processed_path = Path(config.data.processed_path)
    processed_path.parent.mkdir(parents=True, exist_ok=True)
    processed_df.to_csv(processed_path, index=False)
    feature_store_path = Path(config.data.feature_store)
    feature_store_path.parent.mkdir(parents=True, exist_ok=True)
    pd.Series(feature_names).to_csv(feature_store_path, index=False)

    return {
        "model_path": str(model_path),
        "feature_store": str(feature_store_path),
        "processed_data": str(processed_path),
    }


def train(config: AppConfig) -> Dict[str, object]:
    logger.info("Starting training pipeline")

    pipeline, X_train, y_train, X_test, y_test = fit_pipeline(config)

    cv_metrics = run_cross_validation(
        pipeline=pipeline,
        X=X_train,
        y=y_train,
        cv=config.training.cv_folds,
    )

    metrics = evaluate_classifier(
        pipeline,
        X_test,
        y_test,
        config=config,
    )

    artifact_paths = persist_artifacts(pipeline, config, X_train, y_train)

    metrics_report = {
        "cv": cv_metrics,
        "evaluation": metrics,
        "artifacts": artifact_paths,
    }

    report_path = Path(config.artifacts.metrics_report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", encoding="utf-8") as file:
        json.dump(metrics_report, file, indent=2)

    logger.info("Training complete. Model saved to %s", artifact_paths["model_path"])

    return metrics_report
