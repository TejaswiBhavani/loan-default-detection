# AI-Based Loan Default Prediction

An end-to-end machine learning system that predicts loan default risk using applicant financial data, surfaces risk categories in real time, and powers decision support dashboards for banks and fintech teams. The project covers data generation, feature engineering, model training, API serving, alerting, and interactive visualization.

## Highlights

- **Gradient Boosting classifier** trained on engineered financial features.
- **Automated preprocessing pipeline** (imputation, scaling, encoding) with persisted artifacts.
- **Flask prediction API** with two-step risk scoring and lending decisions, plus batch scoring and alert logging.
- **Streamlit dashboard** for manual/batch scoring, lending decision transparency, alert monitoring, and trend visualization.
- **SQLAlchemy-backed storage** for prediction logs and high-risk alerts (SQLite by default, PostgreSQL-ready).
- **Synthetic data generator** to bootstrap experimentation.
- **Pytest suite** covering predictor logic, API endpoints, and artifact generation.

## Quickstart

### 1. Environment setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Copy the sample environment variables if needed:

```bash
cp .env.example .env
```

### 2. Generate synthetic data

```bash
python scripts/generate_synthetic_data.py --rows 5000
```

### 3. Train the model

```bash
python scripts/train_model.py
```

The script saves:

- Model pipeline → `models/loan_default_model.joblib`
- Processed dataset → `data/processed/loan_applications_processed.csv`
- Feature list → `data/processed/feature_store.csv`
- Metrics report → `reports/metrics_report.json`
- Feature importances → `reports/feature_importances.csv`

### 4. Run the prediction API

```bash
python scripts/run_api.py --host 0.0.0.0 --port 8000
```

Endpoints:

- `GET /health` – service check
- `POST /predict` – single applicant scoring + loan decision (returns default risk score, decision, and reason)
- `POST /predict/batch` – batch scoring
- `GET /predictions` – recent prediction logs
- `GET /alerts` – high-risk alerts

### 5. Launch the Streamlit dashboard

```bash
python scripts/run_dashboard.py --address 0.0.0.0 --port 8501
```

The dashboard supports manual scoring, CSV uploads, decision rationale visualization, and alert monitoring.

## Configuration

Project settings live in `config/config.yaml` and can be overridden via environment variables:

- `DATABASE_URL` – SQLAlchemy URL (defaults to SQLite `data/loan_risk.db`)
- `MODEL_PATH` – path to the serialized pipeline
- `LOG_LEVEL` – logging verbosity

The configuration schema also exposes model hyperparameters, risk thresholds, and artifact locations. See `docs/architecture.md` for a detailed breakdown.

## Testing & Quality Checks

Run the automated test suite:

```bash
pytest
```

The suite covers predictor inference, high-risk alerting, Flask API endpoints, and artifact persistence. Generated test artifacts live under a temporary directory and do not interfere with production files.

## Project Structure

```
├── config/               # Configuration files
├── data/                 # Raw and processed datasets
├── docs/                 # Architecture documentation
├── models/               # Trained model artifacts
├── reports/              # Evaluation reports & feature importances
├── scripts/              # CLI utilities for data, training, serving
├── src/
│   ├── api/              # Flask application
│   ├── db/               # SQLAlchemy models and helpers
│   ├── pipeline/         # Preprocessing, training, evaluation
│   ├── services/         # Prediction service and business logic
│   └── utils/            # Config and logging helpers
├── streamlit_app.py      # Streamlit dashboard entry point
└── tests/                # Pytest suite
```

## Future Enhancements

- Real-time streaming of alerts via messaging systems.
- Integration with external KYC/credit bureau APIs for richer features.
- Automated model retraining and monitoring pipelines.

## SDG Alignment

Aligned with **United Nations SDG 8: Decent Work and Economic Growth** by enabling smarter credit risk management and supporting healthy lending ecosystems.
