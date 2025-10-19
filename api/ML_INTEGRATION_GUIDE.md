# ML Model Integration Guide

## Overview

The loan default prediction system now uses a **real pre-trained machine learning model** loaded from joblib files. This guide explains the ML service architecture, how to use it, and how to troubleshoot issues.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Application                        │
│                    (React Frontend / API Consumer)               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ HTTP/REST
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express.js Backend                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │       predictionsController.js                         │    │
│  │  - Receives prediction requests                        │    │
│  │  - Calls mlPredictionService                           │    │
│  │  - Saves results to database                           │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │       mlPredictionService.js (Node.js Wrapper)         │    │
│  │  - Manages Python ML service as child process          │    │
│  │  - Transforms applicant data to ML format              │    │
│  │  - Handles timeouts and errors                         │    │
│  │  - Provides fallback predictions                       │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
└───────────────────┼──────────────────────────────────────────────┘
                    │ HTTP (localhost:5001)
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Python Flask ML Service                        │
│                      (ml_service.py)                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Model Components:                                      │    │
│  │  • loan_default_model_20251006.joblib                  │    │
│  │  • scaler_20251006.joblib                              │    │
│  │  • model_columns.json                                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Endpoints:                                                       │
│  • POST /predict        - Make predictions                       │
│  • GET  /health         - Health check                          │
│  • GET  /model/info     - Model metadata                        │
│  • POST /model/reload   - Reload model components               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Python ML Service (`api/services/ml_service.py`)

**Purpose**: Flask-based service that loads and uses the pre-trained ML model.

**Key Functions**:
- `load_model_components()` - Loads model, scaler, and feature columns from joblib files
- `transform_applicant_to_features()` - Transforms backend data format to model input (10 features)
- `estimate_interest_rate()` - Calculates interest rate based on credit score and loan purpose
- `calculate_feature_importance()` - Returns top contributing features

**Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/predict` | POST | Main prediction endpoint |
| `/model/info` | GET | Model metadata and version |
| `/model/reload` | POST | Reload model components |

**Input Format** (POST `/predict`):
```json
{
  "personal_info": {
    "age": 35,
    "employment_length": 5,
    "employment_status": "employed",
    "income": 75000
  },
  "financial_info": {
    "loan_amount": 25000,
    "loan_purpose": "debt-consolidation"
  },
  "credit_info": {
    "credit_score": 720,
    "credit_history_length": 8
  }
}
```

**Output Format**:
```json
{
  "success": true,
  "data": {
    "risk_score": 0.23,
    "risk_category": "low",
    "confidence_score": 0.89,
    "prediction": 0,
    "feature_importance": [
      {
        "name": "CreditScore",
        "value": 720,
        "importance": 0.25,
        "impact": "positive",
        "display_name": "Credit Score"
      }
    ]
  }
}
```

### 2. Node.js ML Service Wrapper (`api/services/mlPredictionService.js`)

**Purpose**: Manages the Python ML service and provides a JavaScript interface.

**Key Features**:
- Spawns Python Flask service as a child process
- Automatically starts ML service on first prediction request
- Implements timeout handling (30 seconds default)
- Provides rule-based fallback when ML service is unavailable
- Transforms applicant data to match Python service expectations
- Graceful shutdown and cleanup

**Methods**:

```javascript
// Singleton instance
const mlService = require('./services/mlPredictionService');

// Make a prediction
const result = await mlService.predict(applicantData);
// Returns: { risk_score, risk_category, confidence_score, feature_importance, fallback }

// Check service health
const isHealthy = await mlService.checkHealth();

// Get model information
const info = await mlService.getModelInfo();

// Reload model (admin operation)
await mlService.reloadModel();

// Manual service control
await mlService.startMLService();
await mlService.stopMLService();
```

**Configuration** (Environment Variables):
```bash
ML_SERVICE_URL=http://localhost:5001
ML_SERVICE_PORT=5001
PYTHON_PATH=python3
PREDICTION_TIMEOUT=30000
ML_FALLBACK_ENABLED=true
```

### 3. Predictions Controller Updates

The `predictionsController.js` now:
1. Imports `mlPredictionService`
2. Calls `mlService.predict()` instead of simulated predictions
3. Uses actual ML-computed risk categories
4. Stores fallback flag in database
5. Returns ML service availability status to clients

---

## Feature Engineering

The ML model expects **10 specific features** in exact order:

| Feature | Source | Calculation |
|---------|--------|-------------|
| `InterestRate` | Estimated | Based on credit score + loan purpose |
| `AnnualIncome` | Direct | `personal.income` |
| `Experience` | Direct | `personal.employment_length` |
| `LengthOfCreditHistory` | Direct | `credit.credit_history_length` |
| `LoanPurpose` | Mapped | Category mapping (see below) |
| `LoanAmount` | Direct | `financial.loan_amount` |
| `HomeOwnershipStatus` | Mapped | From employment status |
| `Age` | Direct | `personal.age` |
| `LoanToIncomeRatio` | Calculated | `loan_amount / annual_income` |
| `ExperienceToAgeRatio` | Calculated | `experience / age` |

### Interest Rate Estimation

```python
def estimate_interest_rate(credit_score, loan_purpose):
    base_rate = 0.08  # 8%
    
    # Credit score adjustment
    if credit_score >= 750:
        base_rate -= 0.02  # 6%
    elif credit_score >= 700:
        base_rate -= 0.01  # 7%
    elif credit_score < 600:
        base_rate += 0.07  # 15%
    elif credit_score < 650:
        base_rate += 0.04  # 12%
    
    # Purpose adjustment
    if loan_purpose in ['home-improvement', 'major-purchase']:
        base_rate -= 0.005
    elif loan_purpose in ['small-business', 'other']:
        base_rate += 0.01
    
    return max(0.01, min(0.30, base_rate))
```

### Categorical Mappings

**Loan Purpose**:
```python
PURPOSE_MAPPING = {
    'debt-consolidation': 'Debt Consolidation',
    'home-improvement': 'Home Improvement',
    'small-business': 'Business',
    'education': 'Education',
    'major-purchase': 'Purchase',
    'medical': 'Medical',
    'car': 'Auto',
    'vacation': 'Personal',
    'other': 'Other'
}
```

**Home Ownership Status** (derived from employment):
```python
EMPLOYMENT_TO_HOME = {
    'employed': 'Mortgage',
    'self-employed': 'Own',
    'unemployed': 'Rent',
    'student': 'Rent'
}
```

---

## Fallback Mechanism

When the ML service is unavailable, the Node.js service uses a **rule-based fallback** algorithm:

**Risk Score Calculation**:
```javascript
riskScore = (
  loanToIncomeWeight * loanToIncomeRisk +
  creditScoreWeight * creditRisk +
  ageWeight * ageRisk +
  employmentWeight * employmentRisk +
  creditHistoryWeight * creditHistoryRisk
)
```

**Weights**:
- Loan-to-Income Ratio: 30%
- Credit Score: 35%
- Age: 10%
- Employment: 15%
- Credit History: 10%

**Risk Thresholds**:
- Low: < 0.3
- Medium: 0.3 - 0.6
- High: > 0.6

**Indicators**:
- `fallback: true` in prediction result
- Lower `confidence_score` (0.65)
- Logged warnings in console

---

## Setup & Installation

### Prerequisites

1. **Python 3.8+** with pip
2. **Node.js 16+** with npm
3. **Required Python packages**:
   ```bash
   pip install flask flask-cors joblib scikit-learn numpy pandas
   ```

### Quick Start

#### Option 1: Automatic Start (Recommended)

The ML service starts automatically when you make your first prediction. No manual setup required!

```bash
# Start the Express API (ML service starts on-demand)
cd api
npm run dev
```

#### Option 2: Manual Start

Start ML service separately for debugging:

```bash
# Terminal 1: Start ML service
cd api
npm run ml-service

# Terminal 2: Start Express API
npm run dev
```

#### Option 3: Development Mode (Both Services)

Use concurrently to run both services:

```bash
cd api
npm run dev:all
```

### Verify Installation

1. **Check ML Service Health**:
   ```bash
   curl http://localhost:5001/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "model_loaded": true,
     "model_version": "v2.1.3_20251006"
   }
   ```

2. **Check Model Info**:
   ```bash
   curl http://localhost:5001/model/info
   ```

3. **Test Prediction**:
   ```bash
   curl -X POST http://localhost:5001/predict \
     -H "Content-Type: application/json" \
     -d '{
       "personal_info": {
         "age": 35,
         "employment_length": 5,
         "employment_status": "employed",
         "income": 75000
       },
       "financial_info": {
         "loan_amount": 25000,
         "loan_purpose": "debt-consolidation"
       },
       "credit_info": {
         "credit_score": 720,
         "credit_history_length": 8
       }
     }'
   ```

---

## Environment Configuration

### ML Service Environment Variables

Create `api/.env` with:

```bash
# ML Service Configuration
ML_SERVICE_URL=http://localhost:5001
ML_SERVICE_PORT=5001
PYTHON_PATH=python3

# Model Paths (relative to project root)
MODEL_PATH=./loan_default_model_20251006.joblib
SCALER_PATH=./scaler_20251006.joblib
COLUMNS_PATH=./model_columns.json

# Service Settings
PREDICTION_TIMEOUT=30000
ML_FALLBACK_ENABLED=true
FLASK_ENV=development

# Model Metadata
MODEL_VERSION=v2.1.3_20251006
MODEL_TRAINING_DATE=2025-10-06
```

---

## Troubleshooting

### Issue: ML Service Not Starting

**Symptoms**:
- Predictions use fallback mechanism
- Console shows: "Failed to start ML service"

**Solutions**:
1. Check Python installation:
   ```bash
   python3 --version
   ```

2. Verify required packages:
   ```bash
   python3 -c "import flask, joblib, sklearn, numpy, pandas"
   ```

3. Check model files exist:
   ```bash
   ls -la loan_default_model_20251006.joblib scaler_20251006.joblib model_columns.json
   ```

4. Manually start ML service:
   ```bash
   cd api/services
   python3 ml_service.py
   ```

5. Check port availability:
   ```bash
   lsof -i :5001
   ```

### Issue: Model Loading Errors

**Symptoms**:
- ML service starts but crashes
- Error: "Failed to load model components"

**Solutions**:
1. Verify joblib version compatibility:
   ```bash
   python3 -c "import joblib; print(joblib.__version__)"
   ```

2. Check scikit-learn version:
   ```bash
   python3 -c "import sklearn; print(sklearn.__version__)"
   ```

3. Re-save model with current versions:
   ```python
   import joblib
   model = joblib.load('loan_default_model_20251006.joblib')
   joblib.dump(model, 'loan_default_model_20251006_new.joblib')
   ```

### Issue: Timeout Errors

**Symptoms**:
- Predictions take > 30 seconds
- Error: "Prediction request timed out"

**Solutions**:
1. Increase timeout in `.env`:
   ```bash
   PREDICTION_TIMEOUT=60000
   ```

2. Check model file size:
   ```bash
   ls -lh *.joblib
   ```

3. Profile prediction performance:
   ```python
   import time
   start = time.time()
   prediction = model.predict(features)
   print(f"Prediction took {time.time() - start:.2f}s")
   ```

### Issue: Feature Transformation Errors

**Symptoms**:
- Error: "Missing required fields"
- Error: "Feature shape mismatch"

**Solutions**:
1. Validate input data structure:
   ```javascript
   console.log(JSON.stringify(applicantData, null, 2));
   ```

2. Check feature order:
   ```bash
   cat model_columns.json
   ```

3. Verify transformation logic in `ml_service.py` line 70-120

### Issue: Low Confidence Scores

**Symptoms**:
- All predictions have confidence < 0.7
- Fallback flag is always true

**Solutions**:
1. Check ML service connectivity:
   ```bash
   curl http://localhost:5001/health
   ```

2. Review Node.js logs for ML service errors

3. Restart ML service:
   ```bash
   # Find and kill process
   ps aux | grep ml_service
   kill <PID>
   
   # Restart
   npm run ml-service
   ```

### Issue: Inconsistent Predictions

**Symptoms**:
- Same input gives different results
- Predictions don't match training expectations

**Solutions**:
1. Verify model version:
   ```bash
   curl http://localhost:5001/model/info
   ```

2. Check if scaler is applied:
   ```python
   # In ml_service.py
   print(f"Raw features: {features}")
   features_scaled = scaler.transform([features])
   print(f"Scaled features: {features_scaled}")
   ```

3. Reload model:
   ```bash
   curl -X POST http://localhost:5001/model/reload
   ```

---

## Monitoring & Logging

### ML Service Logs

The Python Flask service logs to stdout/stderr. Monitor with:

```bash
# If running with npm
npm run ml-service

# If running manually
cd api/services
python3 ml_service.py 2>&1 | tee ml_service.log
```

### Node.js Service Logs

Check Express logs for ML service interactions:

```bash
# Development
npm run dev

# Production
pm2 logs loan-api
```

### Key Metrics to Monitor

1. **Prediction Success Rate**:
   ```sql
   SELECT 
     COUNT(*) as total,
     SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful
   FROM predictions
   WHERE created_at > NOW() - INTERVAL '1 day';
   ```

2. **Fallback Usage**:
   ```sql
   SELECT 
     COUNT(*) as fallback_predictions
   FROM predictions
   WHERE input_features->>'fallback_used' = 'true'
   AND created_at > NOW() - INTERVAL '1 day';
   ```

3. **Average Processing Time**:
   ```sql
   SELECT AVG(processing_time_ms) as avg_time_ms
   FROM predictions
   WHERE status = 'completed'
   AND created_at > NOW() - INTERVAL '1 hour';
   ```

4. **ML Service Availability**:
   ```bash
   # Create a cron job
   */5 * * * * curl -sf http://localhost:5001/health || echo "ML service down!"
   ```

---

## Performance Optimization

### 1. Model Caching

The model is loaded once on startup and cached in memory. To reload:

```bash
curl -X POST http://localhost:5001/model/reload
```

### 2. Feature Pre-computation

Pre-compute static features when saving applicant data to reduce prediction time.

### 3. Batch Predictions

For bulk processing, consider implementing batch endpoint:

```python
@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    applicants = request.json.get('applicants', [])
    predictions = []
    
    for applicant in applicants:
        try:
            prediction = predict_single(applicant)
            predictions.append(prediction)
        except Exception as e:
            predictions.append({'error': str(e)})
    
    return jsonify({'predictions': predictions})
```

### 4. Response Caching

Implement Redis caching for identical prediction requests:

```javascript
// In mlPredictionService.js
const redis = require('redis');
const client = redis.createClient();

async predict(applicantData) {
  const cacheKey = `prediction:${JSON.stringify(applicantData)}`;
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const result = await this.callMLService(applicantData);
  await client.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hour cache
  
  return result;
}
```

---

## Security Considerations

### 1. API Authentication

ML service endpoints should require authentication:

```python
from functools import wraps

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if api_key != os.getenv('ML_API_KEY'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/predict', methods=['POST'])
@require_api_key
def predict():
    # ... prediction logic
```

### 2. Input Validation

Always validate input data before prediction:

```python
def validate_input(data):
    required_fields = ['personal_info', 'financial_info', 'credit_info']
    
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
    
    # Range checks
    if not (18 <= data['personal_info']['age'] <= 100):
        raise ValueError("Age must be between 18 and 100")
    
    if not (300 <= data['credit_info']['credit_score'] <= 850):
        raise ValueError("Credit score must be between 300 and 850")
    
    return True
```

### 3. Rate Limiting

Protect ML service from abuse:

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.remote_addr)

@app.route('/predict', methods=['POST'])
@limiter.limit("100 per hour")
def predict():
    # ... prediction logic
```

### 4. Network Security

- Run ML service on localhost only (not exposed to public)
- Use internal network communication between Node.js and Python
- Implement firewall rules to block external access to port 5001

---

## Model Versioning

### Current Version: v2.1.3_20251006

**Model Information**:
- Training Date: October 6, 2025
- Algorithm: Ensemble (Random Forest + Gradient Boosting)
- Features: 10 engineered features
- Accuracy: 89.5% (on test set)
- Precision: 0.87 (default class)
- Recall: 0.82 (default class)

### Version Management

1. **Database Tracking**:
   ```sql
   SELECT * FROM model_versions ORDER BY created_at DESC;
   ```

2. **File Naming Convention**:
   - Model: `loan_default_model_YYYYMMDD.joblib`
   - Scaler: `scaler_YYYYMMDD.joblib`
   - Columns: `model_columns.json` (update version field)

3. **Deployment Process**:
   ```bash
   # 1. Save new model files
   # 2. Update MODEL_PATH in .env
   # 3. Reload ML service
   curl -X POST http://localhost:5001/model/reload
   
   # 4. Create new model version in database
   INSERT INTO model_versions (...) VALUES (...);
   ```

### A/B Testing

To test new model versions:

```javascript
// In mlPredictionService.js
async predict(applicantData) {
  const useModelB = Math.random() < 0.1; // 10% traffic to model B
  
  if (useModelB) {
    return await this.predictWithModelB(applicantData);
  }
  
  return await this.predictWithModelA(applicantData);
}
```

---

## API Reference

### POST /api/predictions

**Description**: Create a new prediction using ML model.

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "loan_application_id": "uuid-string"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Prediction created successfully",
  "data": {
    "prediction": {
      "id": "uuid",
      "risk_score": 0.23,
      "risk_category": "low",
      "confidence_score": 0.89,
      "recommendation": "approve",
      "feature_importance": [...],
      "status": "completed",
      "processing_time_ms": 245
    },
    "modelVersion": "v2.1.3_20251006",
    "processingTime": "245ms",
    "fallbackUsed": false,
    "mlServiceAvailable": true
  }
}
```

**Error Responses**:

- **404 Not Found**: Loan application not found
- **409 Conflict**: Prediction already exists for this application
- **500 Internal Server Error**: ML service failed (with fallback result if enabled)

---

## Testing

### Unit Tests

```javascript
// tests/mlPredictionService.test.js
const mlService = require('../services/mlPredictionService');

describe('ML Prediction Service', () => {
  test('should make successful prediction', async () => {
    const applicantData = {
      personal: { age: 35, employment_length: 5, income: 75000 },
      financial: { loan_amount: 25000, loan_purpose: 'debt-consolidation' },
      credit: { credit_score: 720, credit_history_length: 8 }
    };
    
    const result = await mlService.predict(applicantData);
    
    expect(result).toHaveProperty('risk_score');
    expect(result.risk_score).toBeGreaterThanOrEqual(0);
    expect(result.risk_score).toBeLessThanOrEqual(1);
    expect(['low', 'medium', 'high']).toContain(result.risk_category);
  });
  
  test('should use fallback when ML service unavailable', async () => {
    await mlService.stopMLService();
    
    const result = await mlService.predict(testData);
    
    expect(result.fallback).toBe(true);
    expect(result.confidence_score).toBeLessThan(0.7);
  });
});
```

### Integration Tests

```bash
# Test full prediction flow
npm test -- --testPathPattern=predictions.integration.test.js
```

---

## Deployment

### Production Checklist

- [ ] Install Python dependencies on production server
- [ ] Set `FLASK_ENV=production`
- [ ] Configure firewall to block external access to port 5001
- [ ] Set up process manager (PM2) for Node.js and Python services
- [ ] Enable production logging and monitoring
- [ ] Configure backup ML service for high availability
- [ ] Set up health check monitoring (every 5 minutes)
- [ ] Enable model performance logging to database
- [ ] Configure alerts for ML service failures
- [ ] Test fallback mechanism thoroughly

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'loan-api',
      script: './server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'ml-service',
      script: 'python3',
      args: 'services/ml_service.py',
      interpreter: 'none',
      env: {
        FLASK_ENV: 'production',
        ML_SERVICE_PORT: 5001
      }
    }
  ]
};
```

```bash
# Start both services
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs
```

---

## Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly**:
   - Review prediction accuracy metrics
   - Check ML service uptime
   - Review error logs

2. **Monthly**:
   - Retrain model with new data
   - Update model version
   - Review and optimize feature engineering

3. **Quarterly**:
   - Perform A/B testing with new models
   - Update Python dependencies
   - Review and update fallback algorithm

### Getting Help

- Check logs: `pm2 logs ml-service` or `npm run ml-service`
- Review this documentation
- Contact ML team for model-specific issues
- Open GitHub issue for bugs

---

## Changelog

### v2.1.3 - October 6, 2025
- Initial ML service integration
- Real joblib model loading
- Feature transformation pipeline
- Fallback mechanism implementation
- Comprehensive error handling

---

## Next Steps

1. **Test the integration**: Run a full end-to-end test with real applicant data
2. **Monitor performance**: Set up logging and monitoring for ML service
3. **Optimize**: Implement caching and batch predictions if needed
4. **Scale**: Consider load balancing multiple ML service instances
5. **Improve**: Collect feedback and retrain model with new data

For questions or issues, please refer to the [Project README](../README.md) or contact the development team.
