#!/bin/bash
# End-to-End ML Integration Test
# Tests the complete flow: API → Node.js → Python ML Service → Database

set -e  # Exit on error

BASE_URL="http://localhost:5000"
ML_SERVICE_URL="http://localhost:5001"
TOKEN_FILE="/workspaces/loan-default-detection/api/.test-token"

echo "🧪 End-to-End ML Integration Test"
echo "=================================="
echo ""

# 1. Check ML Service Health
echo "1️⃣  Checking ML Service Health..."
ML_HEALTH=$(curl -s $ML_SERVICE_URL/health)
if echo "$ML_HEALTH" | grep -q '"status":"healthy"'; then
    echo "✅ ML Service is healthy"
    echo "$ML_HEALTH" | python3 -m json.tool | head -10
else
    echo "❌ ML Service is not healthy"
    exit 1
fi
echo ""

# 2. Check Backend API Health
echo "2️⃣  Checking Backend API Health..."
API_HEALTH=$(curl -s $BASE_URL/health)
if echo "$API_HEALTH" | grep -q '"status":"healthy"'; then
    echo "✅ Backend API is healthy"
else
    echo "❌ Backend API is not healthy"
    exit 1
fi
echo ""

# 3. Get Authentication Token
echo "3️⃣  Authenticating..."
if [ -f "$TOKEN_FILE" ]; then
    TOKEN=$(cat $TOKEN_FILE)
    echo "✅ Using existing token from $TOKEN_FILE"
else
    echo "❌ No token file found. Please login first."
    exit 1
fi
echo ""

# 4. Create Test Applicant
echo "4️⃣  Creating test applicant..."
APPLICANT_DATA='{
  "first_name": "John",
  "last_name": "TestUser",
  "date_of_birth": "1988-05-15",
  "email": "john.test@example.com",
  "phone": "+1-555-9999",
  "address_line_1": "123 Test Street",
  "city": "Springfield",
  "state": "IL",
  "zip_code": "62701",
  "employment_status": "employed",
  "employer_name": "Tech Corp",
  "job_title": "Software Engineer",
  "employment_length_years": 5,
  "annual_income": 75000.00,
  "education_level": "bachelor",
  "existing_debts": 20000.00,
  "assets_value": 100000.00,
  "savings_account_balance": 15000.00,
  "credit_score": 720,
  "credit_history_length_years": 10,
  "number_of_credit_inquiries": 2,
  "number_of_open_accounts": 5,
  "payment_history_score": 85.0,
  "home_ownership": "mortgage",
  "years_at_current_address": 3
}'

APPLICANT_RESPONSE=$(curl -s -X POST $BASE_URL/api/applicants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$APPLICANT_DATA")

if echo "$APPLICANT_RESPONSE" | grep -q '"success":true'; then
    APPLICANT_ID=$(echo "$APPLICANT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['applicant']['id'])")
    echo "✅ Applicant created: $APPLICANT_ID"
else
    echo "❌ Failed to create applicant"
    echo "$APPLICANT_RESPONSE" | python3 -m json.tool
    exit 1
fi
echo ""

# 5. Create Loan Application
echo "5️⃣  Creating loan application..."
LOAN_APP_DATA=$(cat <<EOF
{
  "applicant_id": "$APPLICANT_ID",
  "loan_amount": 25000.00,
  "loan_purpose": "debt_consolidation",
  "loan_term_months": 60
}
EOF
)

LOAN_APP_RESPONSE=$(curl -s -X POST $BASE_URL/api/loan-applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$LOAN_APP_DATA")

if echo "$LOAN_APP_RESPONSE" | grep -q '"success":true'; then
    LOAN_APP_ID=$(echo "$LOAN_APP_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin)['data']; print(data.get('application', {}).get('id', data.get('id', 'none')))")
    echo "✅ Loan application created: $LOAN_APP_ID"
else
    echo "❌ Failed to create loan application"
    echo "$LOAN_APP_RESPONSE" | python3 -m json.tool
    exit 1
fi
echo ""

# 6. Create ML Prediction (THE MAIN TEST!)
echo "6️⃣  Creating ML Prediction (calling Node.js → Python ML Service)..."
echo "   This tests the complete integration chain!"
echo ""

PREDICTION_DATA=$(cat <<EOF
{
  "loan_application_id": "$LOAN_APP_ID"
}
EOF
)

PREDICTION_RESPONSE=$(curl -s -X POST $BASE_URL/api/predictions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PREDICTION_DATA")

echo "📊 Prediction Response:"
echo "$PREDICTION_RESPONSE" | python3 -m json.tool

if echo "$PREDICTION_RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ ML PREDICTION SUCCESS!"
    echo ""
    
    # Extract key metrics
    RISK_SCORE=$(echo "$PREDICTION_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('risk_score', 'N/A'))" 2>/dev/null || echo "N/A")
    RISK_CATEGORY=$(echo "$PREDICTION_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('risk_category', 'N/A'))" 2>/dev/null || echo "N/A")
    CONFIDENCE=$(echo "$PREDICTION_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('confidence_score', 'N/A'))" 2>/dev/null || echo "N/A")
    RECOMMENDATION=$(echo "$PREDICTION_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('recommendation', 'N/A'))" 2>/dev/null || echo "N/A")
    
    echo "📈 Prediction Results:"
    echo "   Risk Score:      $RISK_SCORE"
    echo "   Risk Category:   $RISK_CATEGORY"
    echo "   Confidence:      $CONFIDENCE"
    echo "   Recommendation:  $RECOMMENDATION"
    echo ""
    
    # Check if it was a fallback prediction
    if echo "$PREDICTION_RESPONSE" | grep -q '"fallback":true'; then
        echo "⚠️  WARNING: Fallback prediction was used (ML service may be down)"
    else
        echo "✨ Real ML model prediction was used!"
    fi
    
else
    echo ""
    echo "❌ ML PREDICTION FAILED!"
    exit 1
fi

echo ""
echo "=================================="
echo "🎉 All tests passed successfully!"
echo "=================================="
