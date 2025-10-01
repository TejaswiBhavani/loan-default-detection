"""Generate synthetic loan application data for development and testing."""

import argparse
import pathlib
import uuid
from datetime import datetime

import numpy as np
import pandas as pd

CATEGORICAL = {
    "home_ownership": ["RENT", "OWN", "MORTGAGE", "OTHER"],
    "purpose": [
        "debt_consolidation",
        "credit_card",
        "home_improvement",
        "major_purchase",
        "small_business",
        "car",
    ],
    "state": [
        "CA",
        "TX",
        "NY",
        "FL",
        "IL",
        "PA",
        "OH",
        "GA",
        "NC",
        "MI",
    ],
}


def sigmoid(x: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-x))


def sample_rows(n_rows: int, random_state: int) -> pd.DataFrame:
    rng = np.random.default_rng(random_state)

    loan_amount = rng.normal(25000, 15000, n_rows).clip(1000, 75000)
    interest_rate = rng.normal(12, 4, n_rows).clip(5, 30)
    annual_income = rng.lognormal(mean=10.5, sigma=0.5, size=n_rows)
    credit_score = rng.normal(680, 60, n_rows).clip(300, 850)
    employment_length = rng.integers(0, 40, n_rows)
    dti = rng.normal(18, 8, n_rows).clip(0, 60)
    num_delinquencies = rng.poisson(0.5, n_rows)
    previous_defaults = rng.binomial(2, 0.1, n_rows)

    home_ownership = rng.choice(CATEGORICAL["home_ownership"], size=n_rows, p=[0.42, 0.21, 0.33, 0.04])
    purpose = rng.choice(CATEGORICAL["purpose"], size=n_rows)
    state = rng.choice(CATEGORICAL["state"], size=n_rows)

    decision_score = (
        -3.5
        + 0.00005 * loan_amount
        + 0.08 * (interest_rate - 10)
        - 0.00002 * annual_income
        - 0.004 * (credit_score - 700)
        - 0.03 * employment_length
        + 0.05 * dti
        + 0.4 * num_delinquencies
        + 0.6 * previous_defaults
    )

    risk = sigmoid(decision_score)
    defaulted = rng.binomial(1, risk)

    application_date = pd.to_datetime(
        rng.integers(
            int(datetime(2022, 1, 1).timestamp()),
            int(datetime(2024, 12, 31).timestamp()),
            n_rows,
        ),
        unit="s",
    )

    df = pd.DataFrame(
        {
            "application_id": [str(uuid.uuid4()) for _ in range(n_rows)],
            "application_date": application_date,
            "loan_amount": loan_amount.round(2),
            "interest_rate": interest_rate.round(2),
            "annual_income": annual_income.round(2),
            "credit_score": credit_score.round(0),
            "employment_length": employment_length,
            "dti": dti.round(2),
            "num_delinquencies": num_delinquencies,
            "previous_defaults": previous_defaults,
            "home_ownership": home_ownership,
            "purpose": purpose,
            "state": state,
            "defaulted": defaulted,
        }
    )

    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic loan application dataset.")
    parser.add_argument("--rows", type=int, default=5000, help="Number of samples to generate.")
    parser.add_argument(
        "--output",
        type=pathlib.Path,
        default=pathlib.Path("data/raw/loan_applications.csv"),
        help="Output CSV path.",
    )
    parser.add_argument(
        "--seed", type=int, default=42, help="Random seed for reproducibility.")
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)

    df = sample_rows(args.rows, args.seed)
    df.to_csv(args.output, index=False)
    print(f"Generated dataset with {len(df)} rows at {args.output}")


if __name__ == "__main__":
    main()
