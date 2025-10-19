#!/usr/bin/env python3
"""
ML Prediction Service
Flask service that loads the pre-trained model and provides predictions via REST API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import numpy as np
import pandas as pd
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables for model components
MODEL = None
SCALER = None
FEATURE_COLUMNS = None
MODEL_VERSION = "v2.1.3_20251006"
MODEL_LOADED_AT = None

# Model file paths - Try multiple locations
def find_model_files():
    """Find model files in various possible locations."""
    search_paths = [
        # Running from api/services directory
        os.path.join(os.path.dirname(__file__), '..', '..'),
        # Running from api directory
        os.path.join(os.path.dirname(__file__), '..'),
        # Running from project root
        os.path.dirname(__file__),
        # Current working directory
        os.getcwd(),
        # Parent of current working directory
        os.path.join(os.getcwd(), '..'),
    ]
    
    for base_path in search_paths:
        model_path = os.path.join(base_path, 'loan_default_model_20251006.joblib')
        scaler_path = os.path.join(base_path, 'scaler_20251006.joblib')
        columns_path = os.path.join(base_path, 'model_columns.json')
        
        if os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(columns_path):
            logger.info(f"Found model files in: {base_path}")
            return model_path, scaler_path, columns_path
    
    return None, None, None

MODEL_PATH, SCALER_PATH, COLUMNS_PATH = find_model_files()



def load_model_components():
    """Load the trained model, scaler, and feature columns."""
    global MODEL, SCALER, FEATURE_COLUMNS, MODEL_LOADED_AT
    
    try:
        logger.info("Loading model components...")
        
        # Check if files were found
        if MODEL_PATH is None or SCALER_PATH is None or COLUMNS_PATH is None:
            logger.error("Model files not found in any search path!")
            logger.error("Searched directories:")
            for base_path in [
                os.path.join(os.path.dirname(__file__), '..', '..'),
                os.path.join(os.path.dirname(__file__), '..'),
                os.getcwd(),
            ]:
                logger.error(f"  - {os.path.abspath(base_path)}")
            raise FileNotFoundError("Model files not found")

        
        # Load model
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        MODEL = joblib.load(MODEL_PATH)
        logger.info(f"✓ Model loaded from: {MODEL_PATH}")
        
        # Load scaler
        if not os.path.exists(SCALER_PATH):
            raise FileNotFoundError(f"Scaler file not found: {SCALER_PATH}")
        SCALER = joblib.load(SCALER_PATH)
        logger.info(f"✓ Scaler loaded from: {SCALER_PATH}")
        
        # Load feature columns
        if not os.path.exists(COLUMNS_PATH):
            raise FileNotFoundError(f"Columns file not found: {COLUMNS_PATH}")
        with open(COLUMNS_PATH, 'r') as f:
            FEATURE_COLUMNS = json.load(f)
        logger.info(f"✓ Feature columns loaded: {len(FEATURE_COLUMNS)} features")
        logger.info(f"  Features: {', '.join(FEATURE_COLUMNS)}")
        
        MODEL_LOADED_AT = datetime.now()
        logger.info(f"✓ Model components loaded successfully at {MODEL_LOADED_AT}")
        
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to load model components: {str(e)}")
        return False


def transform_applicant_to_features(applicant_data):
    """
    Transform applicant data from backend format to model input features.
    Matches the feature engineering from training pipeline.
    Handles both nested and flat data formats.
    """
    try:
        # Extract nested data safely, with fallback to flat structure
        personal = applicant_data.get('personal_info', {}) or applicant_data.get('personalInfo', {})
        financial = applicant_data.get('financial_info', {}) or applicant_data.get('financialInfo', {})
        credit = applicant_data.get('credit_info', {}) or applicant_data.get('creditInfo', {})
        
        # If no nested structure, use flat structure
        if not personal and not financial and not credit:
            personal = applicant_data
            financial = applicant_data
            credit = applicant_data
        
        # Map backend fields to model features
        features = {}
        
        # 1. InterestRate - estimated based on credit score and loan purpose
        credit_score = credit.get('credit_score', 650)
        loan_purpose = financial.get('loan_purpose', 'other')
        features['InterestRate'] = estimate_interest_rate(credit_score, loan_purpose)
        
        # 2. AnnualIncome
        features['AnnualIncome'] = personal.get('income', 50000)
        
        # 3. Experience (employment length in years)
        features['Experience'] = personal.get('employment_length', 5)
        
        # 4. LengthOfCreditHistory
        features['LengthOfCreditHistory'] = credit.get('credit_history_length', 5)
        
        # 5. LoanPurpose - encode as numeric (label encoding)
        # Map loan purpose to numeric codes
        purpose_encoding = {
            'debt-consolidation': 0,
            'home-improvement': 1,
            'car': 2,
            'business': 3,
            'medical': 4,
            'education': 5,
            'vacation': 6,
            'other': 7,
            # Also handle already-capitalized versions
            'Debt Consolidation': 0,
            'Home': 1,
            'Auto': 2,
            'Personal': 3,
            'Medical': 4,
            'Education': 5
        }
        features['LoanPurpose'] = purpose_encoding.get(loan_purpose, 3)
        
        # 6. LoanAmount
        features['LoanAmount'] = financial.get('loan_amount', 25000)
        
        # 7. HomeOwnershipStatus - encode as numeric
        # Map employment status to ownership (approximation) and encode
        employment = personal.get('employment_status', 'employed')
        ownership_encoding = {
            'employed': 0,      # Mortgage
            'self-employed': 1,  # Own
            'unemployed': 2,     # Rent
            'retired': 1,        # Own
            'student': 2,        # Rent
            # Also handle direct ownership values
            'Mortgage': 0,
            'Own': 1,
            'Rent': 2,
            'Other': 3
        }
        features['HomeOwnershipStatus'] = ownership_encoding.get(employment, 2)
        
        # 8. Age
        features['Age'] = personal.get('age', 35)
        
        # 9. LoanToIncomeRatio (calculated)
        annual_income = features['AnnualIncome']
        loan_amount = features['LoanAmount']
        features['LoanToIncomeRatio'] = loan_amount / annual_income if annual_income > 0 else 0
        
        # 10. ExperienceToAgeRatio (calculated)
        age = features['Age']
        experience = features['Experience']
        features['ExperienceToAgeRatio'] = experience / age if age > 0 else 0
        
        logger.info(f"Transformed features: {features}")
        return features
        
    except Exception as e:
        logger.error(f"Feature transformation error: {str(e)}")
        raise ValueError(f"Failed to transform applicant data: {str(e)}")


def estimate_interest_rate(credit_score, loan_purpose):
    """
    Estimate interest rate based on credit score and loan purpose.
    This mimics the logic from training data.
    """
    # Base rate from credit score
    if credit_score >= 750:
        base_rate = 0.06
    elif credit_score >= 700:
        base_rate = 0.08
    elif credit_score >= 650:
        base_rate = 0.10
    elif credit_score >= 600:
        base_rate = 0.12
    else:
        base_rate = 0.15
    
    # Adjust for loan purpose
    purpose_adjustments = {
        'Home': -0.01,
        'Education': -0.005,
        'Auto': 0,
        'Personal': 0.01,
        'Debt Consolidation': 0.015,
        'Medical': 0.02
    }
    
    adjustment = purpose_adjustments.get(loan_purpose, 0)
    rate = base_rate + adjustment
    
    # Clamp between 1% and 30%
    return max(0.01, min(0.30, rate))


def calculate_feature_importance(features_dict, prediction_proba):
    """
    Calculate feature importance for the prediction.
    Returns top contributing features with their impact.
    """
    # This is a simplified version - in production you might use SHAP or similar
    feature_impacts = []
    
    # Define feature importance weights (from model training)
    importance_weights = {
        'InterestRate': 0.235,
        'LoanToIncomeRatio': 0.189,
        'AnnualIncome': 0.156,
        'LoanAmount': 0.134,
        'Experience': 0.089,
        'Age': 0.067,
        'LengthOfCreditHistory': 0.054,
        'ExperienceToAgeRatio': 0.043,
        'LoanPurpose': 0.033,
        'HomeOwnershipStatus': 0.020
    }
    
    # Calculate impact direction based on feature values
    for feature, value in features_dict.items():
        weight = importance_weights.get(feature, 0)
        
        # Determine impact direction (simplified logic)
        if feature == 'InterestRate':
            impact = 'positive' if value > 0.10 else 'negative'
        elif feature == 'AnnualIncome':
            impact = 'negative' if value > 50000 else 'positive'
        elif feature == 'LoanAmount':
            impact = 'positive' if value > 30000 else 'negative'
        elif feature == 'LoanToIncomeRatio':
            impact = 'positive' if value > 0.5 else 'negative'
        elif feature == 'Age':
            impact = 'negative' if value > 30 else 'positive'
        else:
            impact = 'neutral'
        
        feature_impacts.append({
            'feature': feature,
            'importance': float(weight),
            'impact': impact,
            'value': float(value) if isinstance(value, (int, float)) else str(value),
            'display_name': feature.replace('_', ' ').title()
        })
    
    # Sort by importance and return top features
    feature_impacts.sort(key=lambda x: x['importance'], reverse=True)
    return feature_impacts[:10]


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Prediction Service',
        'version': MODEL_VERSION,
        'model_loaded': MODEL is not None,
        'scaler_loaded': SCALER is not None,
        'features_count': len(FEATURE_COLUMNS) if FEATURE_COLUMNS else 0,
        'loaded_at': MODEL_LOADED_AT.isoformat() if MODEL_LOADED_AT else None
    }), 200


@app.route('/predict', methods=['POST'])
def predict():
    """
    Make prediction from applicant data.
    
    Expected input format:
    {
        "personal_info": {
            "age": 35,
            "income": 75000,
            "employment_status": "employed",
            "employment_length": 10
        },
        "financial_info": {
            "loan_amount": 25000,
            "loan_purpose": "debt-consolidation",
            "loan_term": 36
        },
        "credit_info": {
            "credit_score": 720,
            "credit_history_length": 8
        }
    }
    
    Returns:
    {
        "success": true,
        "data": {
            "risk_score": 0.23,
            "risk_category": "low",
            "confidence_score": 0.89,
            "prediction": 0,
            "feature_importance": [...]
        }
    }
    """
    try:
        # Check if model is loaded
        if MODEL is None or SCALER is None or FEATURE_COLUMNS is None:
            logger.error("Model components not loaded")
            return jsonify({
                'success': False,
                'error': 'Model not loaded. Please contact system administrator.'
            }), 503
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        logger.info(f"Received prediction request: {json.dumps(data, indent=2)}")
        
        # Transform applicant data to model features
        features_dict = transform_applicant_to_features(data)
        
        # Create DataFrame with features
        df = pd.DataFrame([features_dict])
        
        # Ensure all required columns are present and in correct order
        for col in FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0  # Default value for missing features
        
        df = df[FEATURE_COLUMNS]
        
        # Scale features
        scaled_features = SCALER.transform(df)
        
        # Make prediction
        prediction_proba = MODEL.predict_proba(scaled_features)[0]
        prediction = MODEL.predict(scaled_features)[0]
        risk_score = float(prediction_proba[1])  # Probability of default
        
        # Determine risk category
        if risk_score < 0.3:
            risk_category = 'low'
        elif risk_score < 0.7:
            risk_category = 'medium'
        else:
            risk_category = 'high'
        
        # Calculate confidence (max probability)
        confidence_score = float(max(prediction_proba))
        
        # Calculate feature importance
        feature_importance = calculate_feature_importance(features_dict, prediction_proba)
        
        # Prepare response
        response = {
            'success': True,
            'data': {
                'risk_score': risk_score,
                'risk_category': risk_category,
                'confidence_score': confidence_score,
                'prediction': int(prediction),
                'prediction_label': 'default' if prediction == 1 else 'no_default',
                'feature_importance': feature_importance,
                'model_version': MODEL_VERSION,
                'features_used': features_dict
            }
        }
        
        logger.info(f"Prediction result: risk_score={risk_score:.3f}, category={risk_category}")
        
        return jsonify(response), 200
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal server error during prediction'
        }), 500


@app.route('/model/info', methods=['GET'])
def model_info():
    """Get model information."""
    if MODEL is None:
        return jsonify({
            'success': False,
            'error': 'Model not loaded'
        }), 503
    
    return jsonify({
        'success': True,
        'data': {
            'version': MODEL_VERSION,
            'features': FEATURE_COLUMNS,
            'feature_count': len(FEATURE_COLUMNS),
            'loaded_at': MODEL_LOADED_AT.isoformat() if MODEL_LOADED_AT else None,
            'model_type': str(type(MODEL).__name__),
            'expected_input_format': {
                'personal_info': {
                    'age': 'int (18-100)',
                    'income': 'float (annual income)',
                    'employment_status': 'string (employed, self-employed, etc.)',
                    'employment_length': 'int (years)'
                },
                'financial_info': {
                    'loan_amount': 'float',
                    'loan_purpose': 'string',
                    'loan_term': 'int (months)'
                },
                'credit_info': {
                    'credit_score': 'int (300-850)',
                    'credit_history_length': 'int (years)'
                }
            }
        }
    }), 200


@app.route('/model/reload', methods=['POST'])
def reload_model():
    """Reload model components (admin endpoint)."""
    try:
        success = load_model_components()
        if success:
            return jsonify({
                'success': True,
                'message': 'Model components reloaded successfully',
                'loaded_at': MODEL_LOADED_AT.isoformat() if MODEL_LOADED_AT else None
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to reload model components'
            }), 500
    except Exception as e:
        logger.error(f"Model reload error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    # Load model on startup
    logger.info("=" * 60)
    logger.info("ML Prediction Service Starting...")
    logger.info("=" * 60)
    
    if load_model_components():
        logger.info("✓ Service ready to accept requests")
        logger.info("=" * 60)
        
        # Run Flask app
        port = int(os.environ.get('ML_SERVICE_PORT', 5001))
        app.run(
            host='0.0.0.0',
            port=port,
            debug=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
        )
    else:
        logger.error("✗ Failed to start service - model components not loaded")
        exit(1)
