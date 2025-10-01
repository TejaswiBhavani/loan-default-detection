"""Evaluation utilities for the classification pipeline."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Iterable

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline

from ..utils.config import AppConfig
from ..utils.logger import get_logger
from .preprocess import get_feature_names

logger = get_logger(__name__)


def categorize_risk(probabilities: Iterable[float], thresholds: Dict[str, float]) -> list[str]:
    low_threshold = thresholds["low"]
    medium_threshold = thresholds["medium"]

    categories: list[str] = []
    for prob in probabilities:
        if prob < low_threshold:
            categories.append("LOW")
        elif prob < medium_threshold:
            categories.append("MEDIUM")
        else:
            categories.append("HIGH")
    return categories


def evaluate_classifier(
    pipeline: Pipeline,
    X_test,
    y_test,
    config: AppConfig,
) -> Dict[str, object]:
    y_pred = pipeline.predict(X_test)
    if hasattr(pipeline, "predict_proba"):
        y_scores = pipeline.predict_proba(X_test)[:, 1]
    else:
        # Fallback for models without predict_proba
        decision_scores = pipeline.decision_function(X_test)
        y_scores = 1 / (1 + np.exp(-decision_scores))

    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_scores)),
        "classification_report": classification_report(y_test, y_pred, output_dict=True),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }

    thresholds = {
        "low": config.model.risk_thresholds.low,
        "medium": config.model.risk_thresholds.medium,
    }
    risk_categories = categorize_risk(y_scores, thresholds)

    metrics["risk_distribution"] = {
        "LOW": risk_categories.count("LOW"),
        "MEDIUM": risk_categories.count("MEDIUM"),
        "HIGH": risk_categories.count("HIGH"),
    }

    save_feature_importances(pipeline, config)

    return metrics


def save_feature_importances(pipeline: Pipeline, config: AppConfig) -> None:
    classifier = pipeline.named_steps.get("classifier")
    preprocessor = pipeline.named_steps.get("preprocessor")

    if classifier is None or preprocessor is None:
        logger.warning("Pipeline missing classifier or preprocessor; skipping feature importance export")
        return

    feature_names = get_feature_names(preprocessor)
    if hasattr(classifier, "feature_importances_"):
        importances = classifier.feature_importances_
    elif hasattr(classifier, "coef_"):
        importances = np.abs(classifier.coef_[0])
    else:
        logger.warning("Classifier %s does not expose importances; skipping export", classifier.__class__.__name__)
        return

    data = (
        pd.DataFrame({"feature": feature_names, "importance": importances})
        .sort_values("importance", ascending=False)
        .reset_index(drop=True)
    )

    path = Path(config.artifacts.feature_importances)
    path.parent.mkdir(parents=True, exist_ok=True)
    data.to_csv(path, index=False)
    logger.info("Saved feature importances to %s", path)
