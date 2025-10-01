"""Streamlit dashboard for AI-based loan default prediction."""

from __future__ import annotations

from typing import List

import pandas as pd
import plotly.express as px
import streamlit as st
from pydantic import ValidationError

from src.db.base import get_session, init_db
from src.db import crud
from src.services.predictor import LoanApplication, PredictionResponse, get_predictor_service
from src.utils.logger import get_logger

logger = get_logger(__name__)


@st.cache_resource(show_spinner=False)
def get_service():
    init_db()
    return get_predictor_service()


def render_metrics(prediction: PredictionResponse) -> None:
    col1, col2, col3 = st.columns(3)
    col1.metric("Default Probability", f"{prediction.probability:.2%}")
    col2.metric("Risk Category", prediction.risk_category)
    col3.metric("Alert Triggered", "Yes" if prediction.alert else "No")


def manual_prediction_form() -> None:
    st.subheader("Single Applicant Scoring")
    with st.form("manual_form"):
        application_id = st.text_input("Application ID", value="APP-0001")
        col_a, col_b, col_c = st.columns(3)
        with col_a:
            loan_amount = st.number_input("Loan Amount", min_value=1000.0, value=15000.0, step=500.0)
            annual_income = st.number_input("Annual Income", min_value=10000.0, value=60000.0, step=5000.0)
            credit_score = st.slider("Credit Score", min_value=300, max_value=850, value=680)
            employment_length = st.slider("Employment Length (years)", min_value=0, max_value=40, value=5)
        with col_b:
            interest_rate = st.slider("Interest Rate (%)", min_value=5.0, max_value=35.0, value=13.5, step=0.1)
            dti = st.slider("Debt-to-Income Ratio", min_value=0.0, max_value=60.0, value=18.0, step=0.5)
            num_delinquencies = st.number_input("Delinquencies", min_value=0, value=0, step=1)
            previous_defaults = st.number_input("Previous Defaults", min_value=0, value=0, step=1)
        with col_c:
            home_ownership = st.selectbox("Home Ownership", ["RENT", "OWN", "MORTGAGE", "OTHER"])
            purpose = st.selectbox(
                "Loan Purpose",
                [
                    "debt_consolidation",
                    "credit_card",
                    "home_improvement",
                    "major_purchase",
                    "small_business",
                    "car",
                ],
            )
            state = st.selectbox("State", ["CA", "TX", "NY", "FL", "IL", "PA", "OH", "GA", "NC", "MI"])

        submitted = st.form_submit_button("Score Applicant")

    if submitted:
        payload = {
            "application_id": application_id or None,
            "loan_amount": loan_amount,
            "interest_rate": interest_rate,
            "annual_income": annual_income,
            "credit_score": credit_score,
            "employment_length": employment_length,
            "dti": dti,
            "num_delinquencies": num_delinquencies,
            "previous_defaults": previous_defaults,
            "home_ownership": home_ownership,
            "purpose": purpose,
            "state": state,
        }
        try:
            prediction = get_service().predict_one(payload)
            st.success("Prediction generated!")
            render_metrics(prediction)
        except ValidationError as error:
            st.error(f"Validation error: {error}")
        except Exception as error:
            st.error(f"Prediction failed: {error}")


def batch_prediction_uploader() -> None:
    st.subheader("Batch Scoring via CSV")
    st.write("Upload a CSV with the same schema as the training dataset (excluding the target column).")
    uploaded_file = st.file_uploader("Upload CSV", type="csv")
    if uploaded_file:
        try:
            df = pd.read_csv(uploaded_file)
            predictions = get_service().predict_batch(df.to_dict(orient="records"))
            results_df = pd.DataFrame([p.model_dump() for p in predictions])
            results_df["probability"] = results_df["probability"].apply(lambda x: round(x, 4))
            st.dataframe(results_df)

            chart = px.histogram(results_df, x="risk_category", title="Risk Category Distribution")
            st.plotly_chart(chart, use_container_width=True)
        except ValidationError as error:
            st.error(f"Validation error: {error}")
        except Exception as error:
            st.error(f"Batch prediction failed: {error}")


def alerts_panel() -> None:
    st.subheader("Recent High-Risk Alerts")
    with get_session() as session:
        alerts = crud.get_recent_alerts(session, limit=20)
    if not alerts:
        st.info("No alerts logged yet.")
        return
    data = [
        {
            "Created At": alert.created_at.strftime("%Y-%m-%d %H:%M") if alert.created_at else "-",
            "Message": alert.message,
            "Severity": alert.severity,
        }
        for alert in alerts
    ]
    st.table(pd.DataFrame(data))


def predictions_history() -> None:
    st.subheader("Latest Predictions")
    with get_session() as session:
        records = crud.get_recent_predictions(session, limit=50)
    if not records:
        st.info("Make a prediction to populate the dashboard.")
        return
    df = pd.DataFrame(
        [
            {
                "Created At": record.created_at.strftime("%Y-%m-%d %H:%M") if record.created_at else "-",
                "Application ID": record.application_id or record.id,
                "Probability": round(record.probability, 4),
                "Risk Category": record.risk_category,
                "Alert": record.alert_triggered,
            }
            for record in records
        ]
    )
    st.dataframe(df)


def main() -> None:
    st.set_page_config(page_title="Loan Default Risk Dashboard", layout="wide")
    st.title("AI-Based Loan Default Prediction Dashboard")
    st.caption("Analyze applications, predict default probability, and spot high-risk cases in real time.")

    manual_prediction_form()
    batch_prediction_uploader()

    col1, col2 = st.columns(2)
    with col1:
        alerts_panel()
    with col2:
        predictions_history()


if __name__ == "__main__":
    main()
