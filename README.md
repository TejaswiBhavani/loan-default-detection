# Loan Default Prediction System

<img width="1024" height="1024" alt="logo-7" src="https://github.com/user-attachments/assets/7369b006-d79d-4e22-b08a-2971b759f8a1" />

A streamlined machine learning application for predicting loan default risk using an advanced ensemble model.

## Overview

This system provides **high-accuracy loan default prediction** with a clean, intuitive interface:

- **89%+ Accuracy** using advanced ML ensemble methods
- **Real-time Predictions** via interactive Streamlit dashboard
- **Batch Processing** for multiple loan applications
- **Risk Visualization** with detailed decision factors

## Features

### 🎯 High-Accuracy Predictions
- **Advanced ML Model** trained on 50,000+ loan applications
- **Feature Engineering** with interaction terms and domain expertise
- **Ensemble Methods** combining multiple algorithms
- **Risk Categorization** (Low/Medium/High) with confidence scores

### 📊 Interactive Dashboard
- **Single Application Scoring** with instant results
- **Batch CSV Upload** for processing multiple applications
- **Visual Risk Assessment** with charts and gauges
- **Decision Factors** highlighting key risk indicators

### 🔧 Technical Features
- **Pre-trained Model** ready for immediate use
- **Automatic Feature Scaling** and preprocessing
- **Robust Error Handling** with user-friendly messages
- **Responsive Design** optimized for all devices

## Quick Start

### Prerequisites
- Python 3.8+
- Required packages (see requirements.txt)

### Installation

1. **Clone and navigate**:
   ```bash
   git clone <repository-url>
   cd loan-default-detection
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   streamlit run streamlit_app.py
   ```

4. **Access the dashboard**:
   Open your browser to `http://localhost:8501`

## Usage

### Single Loan Prediction

1. **Fill Application Details:**
   - Financial: Annual Income, Loan Amount, Interest Rate
   - Personal: Age, Work Experience, Credit History Length
   - Additional: Home Ownership, Loan Purpose

2. **Get Instant Results:**
   - Default probability percentage
   - Risk category (Low/Medium/High)
   - Approval recommendation
   - Decision confidence level

3. **Review Risk Factors:**
   - Visual charts showing risk breakdown
   - Key factors influencing the decision
   - Warnings for high-risk indicators

### Batch Processing

1. **Prepare CSV File** with columns:
   ```
   InterestRate, AnnualIncome, Experience, LengthOfCreditHistory,
   LoanPurpose, LoanAmount, HomeOwnershipStatus, Age
   ```

2. **Upload and Process:**
   - Upload CSV via the dashboard
   - View preview of your data
   - Click "Process Batch Predictions"

3. **Download Results:**
   - Get predictions for all applications
   - Summary statistics and approval rates
   - Export results for further analysis

## Model Information

### Performance Metrics
- **Accuracy**: 89%+ on test datasets
- **Model Type**: Ensemble (XGBoost + LightGBM + CatBoost)
- **Features Used**: 10 engineered features
- **Training Data**: Combined Credit Risk and Financial datasets

### Key Features
1. **InterestRate** - Loan interest rate
2. **AnnualIncome** - Borrower's annual income
3. **Experience** - Years of work experience
4. **LengthOfCreditHistory** - Credit history length
5. **LoanPurpose** - Purpose of the loan
6. **LoanAmount** - Requested loan amount
7. **HomeOwnershipStatus** - Home ownership status
8. **Age** - Borrower's age
9. **LoanToIncomeRatio** - Calculated ratio
10. **ExperienceToAgeRatio** - Calculated ratio

### Risk Thresholds
- **Low Risk**: < 30% default probability
- **Medium Risk**: 30-70% default probability  
- **High Risk**: > 70% default probability

## Project Structure

```
loan-default-detection/
├── streamlit_app.py              # Main application
├── loan_default_model_20251006.joblib   # Trained ML model
├── scaler_20251006.joblib        # Feature scaler
├── model_columns.json            # Required feature list
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

## Example Input Format

### Single Prediction
```json
{
    "InterestRate": 0.12,
    "AnnualIncome": 65000,
    "Experience": 8,
    "LengthOfCreditHistory": 6,
    "LoanPurpose": "Home",
    "LoanAmount": 250000,
    "HomeOwnershipStatus": "Mortgage", 
    "Age": 32
}
```

### CSV Batch Format
```csv
InterestRate,AnnualIncome,Experience,LengthOfCreditHistory,LoanPurpose,LoanAmount,HomeOwnershipStatus,Age
0.12,65000,8,6,Home,250000,Mortgage,32
0.15,45000,3,2,Auto,25000,Rent,26
0.08,120000,15,12,Education,50000,Own,40
```

## Tips for Best Results

### High Approval Probability
- Low debt-to-income ratio (< 30%)
- Stable employment history (5+ years)
- Good credit history (5+ years)  
- Home ownership
- Reasonable loan amount relative to income

### Risk Factors to Avoid
- High interest rates (> 15%)
- Short work experience (< 2 years)
- High loan-to-income ratio (> 50%)
- Limited credit history (< 3 years)

## Troubleshooting

### Common Issues

**"Error loading model components"**
- Ensure all model files are in the project directory
- Check file permissions and paths

**"Prediction error"** 
- Verify all required fields are filled
- Check for reasonable input values (e.g., positive income)

**"CSV processing failed"**
- Ensure CSV has all required columns
- Check for missing or invalid data

## License

This project is licensed under the MIT License.
