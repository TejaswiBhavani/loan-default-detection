# Mock API Server

This is a mock backend API server for the Loan Prediction Frontend, designed to simulate a real loan prediction service during development and demonstration.

## Features

### API Endpoints

#### Single Prediction
- **POST** `/api/predict` - Process a single loan application
- Request: `{ applicant: ApplicantData }`
- Response: Complete prediction with risk score and explanation

#### Batch Processing
- **POST** `/api/predict/batch` - Upload CSV file for batch processing
- **GET** `/api/batch/:jobId/status` - Check batch job status
- **GET** `/api/batch/:jobId/results` - Get batch results

#### Analytics & Reporting
- **GET** `/api/predictions` - Get prediction history with pagination
- **GET** `/api/model/metrics` - Get model performance metrics
- **GET** `/api/dashboard/metrics` - Get dashboard statistics

#### System
- **GET** `/api/health` - Health check endpoint

### WebSocket Support
- Real-time batch processing updates
- Live notifications
- Connection: `ws://localhost:8000`

### Mock Data Features
- Realistic prediction scores and risk categories
- Feature importance analysis
- Confidence scores
- Model performance metrics
- Historical data simulation

## Usage

### Development
```bash
npm install
npm run dev  # With nodemon for auto-restart
```

### Production
```bash
npm start
```

### Docker
```bash
docker-compose up loan-api
```

## API Examples

### Single Prediction
```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "applicant": {
      "annual_income": 75000,
      "debt_to_income": 0.2,
      "credit_score": 720,
      "loan_amount": 25000
    }
  }'
```

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Batch Status
```bash
curl http://localhost:8000/api/batch/job123/status
```

## Configuration

Environment variables:
- `PORT` - Server port (default: 8000)
- `NODE_ENV` - Environment mode
- `CORS_ORIGIN` - CORS origin settings

## Integration

This mock server is designed to work seamlessly with the React frontend and can be easily replaced with a real ML-powered backend when ready for production.