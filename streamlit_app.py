"""Streamlit app for loan default prediction using trained ML model."""

import streamlit as st
import pandas as pd
import numpy as np
import joblib
import json
import plotly.express as px
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Load model and preprocessing components
@st.cache_resource
def load_model_components():
    """Load the trained model and preprocessing components."""
    try:
        # Load the trained model
        model = joblib.load("loan_default_model_20251006.joblib")
        
        # Load the scaler
        scaler = joblib.load("scaler_20251006.joblib")
        
        # Load feature columns
        with open("model_columns.json", "r") as f:
            feature_columns = json.load(f)
        
        return model, scaler, feature_columns
    except Exception as e:
        st.error(f"Error loading model components: {e}")
        return None, None, None

def predict_default_probability(features_dict, model, scaler, feature_columns):
    """Make prediction using the trained model."""
    try:
        # Create DataFrame with the input features
        df = pd.DataFrame([features_dict])
        
        # Ensure all required columns are present
        for col in feature_columns:
            if col not in df.columns:
                df[col] = 0  # Default value for missing columns
        
        # Select only the required columns in the correct order
        df = df[feature_columns]
        
        # Scale the features
        scaled_features = scaler.transform(df)
        
        # Make prediction
        probability = model.predict_proba(scaled_features)[0, 1]
        prediction = model.predict(scaled_features)[0]
        
        return probability, prediction
    except Exception as e:
        st.error(f"Prediction error: {e}")
        return None, None

def get_risk_category(probability):
    """Categorize risk based on probability."""
    if probability < 0.3:
        return "Low Risk", "green"
    elif probability < 0.7:
        return "Medium Risk", "orange"
    else:
        return "High Risk", "red"

def main():
    """Main Streamlit application."""
    st.set_page_config(
        page_title="Loan Default Predictor", 
        page_icon="🏦",
        layout="wide"
    )
    
    # Load model components
    model, scaler, feature_columns = load_model_components()
    
    if model is None:
        st.error("Failed to load model. Please check model files.")
        return
    
    # Header
    st.title("🏦 Loan Default Risk Prediction")
    st.markdown("**Advanced ML Model for Loan Approval Decision Support**")
    st.divider()
    
    # Sidebar for model info
    with st.sidebar:
        st.header("📊 Model Information")
        st.info(f"**Features Used:** {len(feature_columns)}")
        st.info("**Model Type:** Ensemble ML Model")
        st.info("**Training Date:** October 2025")
        
        st.header("📋 Required Features")
        for i, feature in enumerate(feature_columns, 1):
            st.write(f"{i}. {feature}")
    
    # Main prediction form
    st.header("🎯 Loan Application Assessment")
    
    with st.form("prediction_form"):
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.subheader("💰 Financial Information")
            annual_income = st.number_input(
                "Annual Income ($)", 
                min_value=10000, 
                max_value=1000000, 
                value=60000, 
                step=1000
            )
            
            loan_amount = st.number_input(
                "Loan Amount ($)", 
                min_value=1000, 
                max_value=500000, 
                value=25000, 
                step=1000
            )
            
            interest_rate = st.slider(
                "Interest Rate (%)", 
                min_value=0.01, 
                max_value=0.30, 
                value=0.12, 
                step=0.01,
                format="%.2f"
            )
            
        with col2:
            st.subheader("👤 Personal Information")
            age = st.number_input(
                "Age", 
                min_value=18, 
                max_value=80, 
                value=35
            )
            
            experience = st.number_input(
                "Work Experience (years)", 
                min_value=0, 
                max_value=50, 
                value=10
            )
            
            credit_history_length = st.number_input(
                "Credit History Length (years)", 
                min_value=0, 
                max_value=40, 
                value=8
            )
            
        with col3:
            st.subheader("🏠 Additional Details")
            home_ownership = st.selectbox(
                "Home Ownership Status",
                ["Own", "Mortgage", "Rent"]
            )
            
            loan_purpose = st.selectbox(
                "Loan Purpose",
                ["Home", "Education", "Auto", "Personal", "Debt Consolidation", "Medical"]
            )
            
            # Calculate derived features
            loan_to_income = loan_amount / annual_income if annual_income > 0 else 0
            experience_to_age = experience / age if age > 0 else 0
            
            st.metric("Loan-to-Income Ratio", f"{loan_to_income:.3f}")
            st.metric("Experience-to-Age Ratio", f"{experience_to_age:.3f}")
        
        # Submit button
        submitted = st.form_submit_button("🔍 Predict Default Risk", use_container_width=True)
    
    if submitted:
        # Prepare features for prediction
        features = {
            "InterestRate": interest_rate,
            "AnnualIncome": annual_income,
            "Experience": experience,
            "LengthOfCreditHistory": credit_history_length,
            "LoanPurpose": loan_purpose,
            "LoanAmount": loan_amount,
            "HomeOwnershipStatus": home_ownership,
            "Age": age,
            "LoanToIncomeRatio": loan_to_income,
            "ExperienceToAgeRatio": experience_to_age
        }
        
        # Make prediction
        probability, prediction = predict_default_probability(features, model, scaler, feature_columns)
        
        if probability is not None:
            st.divider()
            
            # Display results
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric(
                    "Default Probability", 
                    f"{probability:.1%}",
                    delta=f"{probability - 0.5:.1%}" if probability != 0.5 else None
                )
            
            with col2:
                risk_category, color = get_risk_category(probability)
                st.markdown(f"**Risk Level:** :{color}[{risk_category}]")
            
            with col3:
                decision = "APPROVE" if prediction == 0 else "REJECT"
                decision_color = "green" if decision == "APPROVE" else "red"
                st.markdown(f"**Recommendation:** :{decision_color}[{decision}]")
            
            with col4:
                confidence = max(probability, 1 - probability)
                st.metric("Confidence", f"{confidence:.1%}")
            
            # Visual representation
            st.subheader("📊 Risk Visualization")
            
            # Create gauge chart
            fig = px.pie(
                values=[probability, 1-probability],
                names=['Default Risk', 'Safe'],
                color_discrete_map={'Default Risk': 'red', 'Safe': 'green'},
                title=f"Default Risk: {probability:.1%}"
            )
            fig.update_traces(textposition='inside', textinfo='percent+label')
            
            col1, col2 = st.columns([2, 1])
            with col1:
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                st.subheader("📋 Decision Factors")
                
                # Risk factors
                if loan_to_income > 0.5:
                    st.warning("⚠️ High loan-to-income ratio")
                
                if interest_rate > 0.15:
                    st.warning("⚠️ High interest rate")
                
                if experience_to_age < 0.2:
                    st.warning("⚠️ Limited work experience")
                
                if credit_history_length < 3:
                    st.warning("⚠️ Short credit history")
                
                # Positive factors
                if loan_to_income < 0.3:
                    st.success("✅ Reasonable loan amount")
                
                if annual_income > 80000:
                    st.success("✅ High income")
                
                if home_ownership in ["Own", "Mortgage"]:
                    st.success("✅ Property ownership")
    
    # Batch prediction section
    st.divider()
    st.header("📁 Batch Predictions")
    
    uploaded_file = st.file_uploader("Upload CSV file for batch predictions", type="csv")
    
    if uploaded_file is not None:
        try:
            df = pd.read_csv(uploaded_file)
            st.write("**Preview of uploaded data:**")
            st.dataframe(df.head())
            
            if st.button("Process Batch Predictions"):
                predictions_list = []
                
                progress_bar = st.progress(0)
                for i, row in df.iterrows():
                    # Prepare features (you may need to adjust this based on your CSV structure)
                    features = {
                        "InterestRate": row.get("InterestRate", 0.12),
                        "AnnualIncome": row.get("AnnualIncome", 60000),
                        "Experience": row.get("Experience", 10),
                        "LengthOfCreditHistory": row.get("LengthOfCreditHistory", 8),
                        "LoanPurpose": row.get("LoanPurpose", "Personal"),
                        "LoanAmount": row.get("LoanAmount", 25000),
                        "HomeOwnershipStatus": row.get("HomeOwnershipStatus", "Rent"),
                        "Age": row.get("Age", 35),
                        "LoanToIncomeRatio": row.get("LoanToIncomeRatio", 0.4),
                        "ExperienceToAgeRatio": row.get("ExperienceToAgeRatio", 0.3)
                    }
                    
                    probability, prediction = predict_default_probability(features, model, scaler, feature_columns)
                    
                    if probability is not None:
                        risk_category, _ = get_risk_category(probability)
                        predictions_list.append({
                            "Row": i + 1,
                            "Default Probability": f"{probability:.1%}",
                            "Risk Category": risk_category,
                            "Decision": "APPROVE" if prediction == 0 else "REJECT"
                        })
                    
                    progress_bar.progress((i + 1) / len(df))
                
                # Display results
                results_df = pd.DataFrame(predictions_list)
                st.subheader("📊 Batch Prediction Results")
                st.dataframe(results_df)
                
                # Summary statistics
                approve_count = len([p for p in predictions_list if p["Decision"] == "APPROVE"])
                st.info(f"**Summary:** {approve_count}/{len(predictions_list)} applications recommended for approval ({approve_count/len(predictions_list)*100:.1f}%)")
                
        except Exception as e:
            st.error(f"Error processing file: {e}")

if __name__ == "__main__":
    main()
