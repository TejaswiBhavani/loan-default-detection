# Architecture Overview

## Objective
Build an AI-driven loan default prediction system that ingests loan application data, engineers features, trains a classification model, exposes predictions through an API and an interactive dashboard, and highlights high-risk applicants for decision support.

## Components

1. **Data Layer**
   - Source: CSV dataset (`data/raw/loan_applications.csv`) generated via synthetic generator or replaced with real data.
   - Storage: Configurable SQL database via SQLAlchemy (defaults to SQLite; supports PostgreSQL by supplying a connection URL).
   - Artifacts: Processed dataset (`data/processed/`), serialized model (`models/loan_default_model.joblib`), feature metadata.

2. **Feature & Model Pipeline**
   - Preprocessing: Handle missing values, encode categorical variables, scale numeric features.
   - Model: `GradientBoostingClassifier` (scikit-learn) with probability outputs for risk scoring.
   - Training Script: `scripts/train_model.py` orchestrates data loading, preprocessing, training, evaluation, and persistence.
   - Evaluation: Generates metrics report (AUC, F1, confusion matrix) stored in `reports/`.

3. **Prediction & Lending Decision Services**
    - **Flask API (`src/api/app.py`)** exposing endpoints:
       - `POST /predict`: Accepts applicant features, produces a default probability, applies lending rules, and returns the decision, risk score, reason, and alert flag. Logs requests and responses to the database.
       - `GET /health`: Basic health check.
    - Prediction pipeline in `src/services/predictor.py` loads the trained model and orchestrates inference.
    - Lending rules encapsulated in `src/services/decision.py`, currently approving loans when default risk < 20% and debt-to-income ratio < 45%.

4. **Dashboard**
    - Streamlit app (`streamlit_app.py`) for:
       - Uploading CSV or manual entry for predictions and decisions.
       - Visualizing loan decision distribution and underlying risk categories.
       - Highlighting high-risk applicants via alerts panel.
       - Displaying latest predictions, decisions, and rationales from the database when available.

5. **Alerting Logic**
   - Risk category thresholds: Low (<0.3), Medium (0.3-0.6), High (>0.6).
   - Alerts triggered for High risk and optionally persisted for audit in DB table `risk_alerts`.

6. **Utilities & Configuration**
   - Configuration via `.env` or environment variables (e.g., `DATABASE_URL`, `MODEL_PATH`).
   - Logging configured with `logging` module outputting to console and file (`logs/app.log`).

7. **Testing & CI**
   - Pytest-based tests covering data pipeline, predictor service, and API endpoints (using Flask test client).
   - Continuous integration ready via `pytest` command.

## Workflow Steps

1. Data collection/generation (`scripts/generate_synthetic_data.py`).
2. Feature engineering and preprocessing (`src/pipeline/preprocess.py`).
3. Model training and evaluation (`scripts/train_model.py`).
4. Model serving through Flask API (`scripts/run_api.py`).
5. Lending decision evaluation and visualization with Streamlit dashboard (`scripts/run_dashboard.py`).

## Future Enhancements
- Integrate with real-time message queue for streaming risk updates.
- Connect to external KYC/credit APIs for enriched features.
- Deploy containerized services with CI/CD pipeline.
