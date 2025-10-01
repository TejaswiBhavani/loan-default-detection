"""Preprocessing utilities for loan default dataset."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUMERIC_FEATURES = [
    "loan_amount",
    "interest_rate",
    "annual_income",
    "credit_score",
    "employment_length",
    "dti",
    "num_delinquencies",
    "previous_defaults",
]

CATEGORICAL_FEATURES = ["home_ownership", "purpose", "state"]


@dataclass
class DatasetSplits:
    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: pd.Series
    y_test: pd.Series


def build_preprocessor() -> ColumnTransformer:
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "encoder",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
        ]
    )

    return preprocessor


def get_feature_names(preprocessor: ColumnTransformer) -> List[str]:
    """Return expanded feature names after preprocessing."""
    feature_names: List[str] = []

    for name, transformer, columns in preprocessor.transformers_:
        if name == "remainder":
            continue
        if hasattr(transformer, "named_steps"):
            last_step = list(transformer.named_steps.values())[-1]
            if hasattr(last_step, "get_feature_names_out"):
                feature_names.extend(last_step.get_feature_names_out(columns))
                continue
        feature_names.extend(columns)

    return feature_names


def load_raw_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, parse_dates=["application_date"])
    return df


def split_features_target(
    df: pd.DataFrame, target_column: str, id_column: str | None = None
) -> Tuple[pd.DataFrame, pd.Series]:
    features = df.drop(columns=[target_column])
    if id_column and id_column in features.columns:
        features = features.drop(columns=[id_column])
    target = df[target_column].astype(int)
    return features, target
