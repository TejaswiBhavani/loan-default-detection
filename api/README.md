# Loan Default Prediction API

A complete Node.js/Express REST API for the Loan Default Prediction system with JWT authentication, input validation, and PostgreSQL integration.

## 🚀 Features

- **JWT Authentication** - Secure user authentication with access tokens
- **Role-Based Authorization** - Different access levels (admin, loan_officer, underwriter, analyst, viewer)
- **Input Validation** - Comprehensive validation using Joi
- **Database Connection Pooling** - Efficient PostgreSQL connection management
- **Error Handling** - Centralized error handling with detailed error responses
- **Rate Limiting** - Protection against abuse
- **Security** - Helmet.js for security headers
- **CORS Support** - Cross-origin resource sharing enabled
- **Audit Logging** - Complete action tracking
- **API Documentation** - Well-documented endpoints

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL 12+
- Database schema set up (see database/migrations)

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loan_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8501
```

### 3. Set Up Database

Ensure your PostgreSQL database is running and the schema is created:

```bash
cd ../database/migrations
psql -h localhost -U postgres -d loan_db -f 0000_drop_all.sql
psql -h localhost -U postgres -d loan_db -f 0001_create_types.sql
psql -h localhost -U postgres -d loan_db -f 0002_create_tables.sql
# ... run all migration files in order
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Authentication

#### POST /api/auth/login
Login with username and password to get JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "username": "admin",
      "email": "admin@loanbank.com",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "role": "admin"
    }
  }
}
```

#### GET /api/auth/me
Get current authenticated user details.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /api/auth/refresh
Exchange refresh token for new access token and rotated refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Security Notes:**
- Refresh tokens are hashed with bcrypt before storage
- Each refresh rotates the token (old token becomes invalid)
- Tokens expire after 7 days by default

#### POST /api/auth/logout
Logout and invalidate session.

### Applicants

#### POST /api/applicants
Create a new loan applicant.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1988-05-15",
  "email": "john.doe@email.com",
  "phone": "+1-555-1001",
  "address_line_1": "123 Main Street",
  "city": "Springfield",
  "state": "IL",
  "zip_code": "62701",
  "employment_status": "employed",
  "employer_name": "Tech Solutions Inc",
  "job_title": "Software Engineer",
  "employment_length_years": 5.2,
  "annual_income": 85000,
  "credit_score": 720,
  "home_ownership": "mortgage"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Applicant created successfully",
  "data": {
    "applicant": {
      "id": "uuid",
      "application_number": "APP-2025-123456",
      ...
    }
  }
}
```

#### GET /api/applicants
Get all applicants with pagination.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

#### GET /api/applicants/:id
Get a specific applicant by ID.

#### GET /api/applicants/search
Search applicants.

**Query Parameters:**
- `query` - Search term
- `field` - Field to search (name, email, phone, application_number)

### Loan Applications

#### POST /api/loan-applications
Submit a new loan application.

**Request:**
```json
{
  "applicant_id": "uuid",
  "loan_amount": 50000,
  "loan_purpose": "home_improvement",
  "loan_term_months": 60,
  "requested_interest_rate": 0.12,
  "priority_level": 2,
  "applicant_notes": "Need funds for kitchen renovation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Loan application created successfully",
  "data": {
    "application": {
      "id": "uuid",
      "status": "submitted",
      "submitted_at": "2025-10-19T...",
      ...
    }
  }
}
```

#### GET /api/loan-applications
Get all loan applications with filtering.

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `status` - Filter by status (submitted, under_review, approved, rejected)
- `priority` - Filter by priority level (1-4)

#### GET /api/loan-applications/:id
Get a specific loan application.

#### PATCH /api/loan-applications/:id/status
Update application status.

**Request:**
```json
{
  "status": "approved",
  "decision_reason": "Good credit history and stable income",
  "assigned_underwriter": "uuid"
}
```

### Predictions

#### POST /api/predictions
Create a risk prediction for a loan application.

**Request:**
```json
{
  "loan_application_id": "uuid",
  "features": {
    "InterestRate": 0.12,
    "AnnualIncome": 85000,
    "Experience": 10,
    "LengthOfCreditHistory": 8,
    "LoanPurpose": "Home",
    "LoanAmount": 50000,
    "HomeOwnershipStatus": "Mortgage",
    "Age": 37,
    "LoanToIncomeRatio": 0.588,
    "ExperienceToAgeRatio": 0.270
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Prediction created successfully",
  "data": {
    "prediction": {
      "id": "uuid",
      "risk_score": 0.35,
      "risk_category": "medium",
      "confidence_score": 0.89,
      "recommendation": "review",
      "processing_time_ms": 250,
      ...
    },
    "modelVersion": "v1.0.0",
    "processingTime": "250ms"
  }
}
```

#### GET /api/predictions/:id
Get a specific prediction.

#### GET /api/predictions/application/:applicationId
Get all predictions for a specific application.

#### GET /api/predictions/recent
Get recent predictions.

**Query Parameters:**
- `limit` - Number of results (default: 20)

### Dashboard

#### GET /api/dashboard
Get comprehensive dashboard overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_applications": 150,
      "approved_count": 45,
      "rejected_count": 20,
      "pending_count": 85,
      "approval_rate": 69.23,
      "avg_loan_amount": 42500,
      "total_approved_amount": 1912500
    },
    "risk_distribution": [...],
    "status_distribution": [...],
    "recent_applications": [...],
    "trends": [...],
    "top_loan_officers": [...],
    "avg_processing_time_ms": 245
  }
}
```

#### GET /api/dashboard/risk-analytics
Get detailed risk analytics.

**Query Parameters:**
- `range` - Time range in days (default: 30)

#### GET /api/dashboard/loan-purpose-analytics
Get analytics by loan purpose.

#### GET /api/dashboard/user-activity
Get user activity statistics (admin/analyst only).

#### GET /api/dashboard/export
Export dashboard data.

**Query Parameters:**
- `type` - Data type (applications, predictions)
- `format` - Export format (json, csv)

## 🔒 Authentication & Authorization

### Using JWT Tokens

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Roles

- **admin** - Full system access
- **loan_officer** - Create applicants and applications, update statuses
- **underwriter** - Review and update application statuses, create predictions
- **analyst** - View data, create predictions, access analytics
- **viewer** - Read-only access

## 🛡️ Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## 🧪 Testing

### Test Login Credentials

Use the sample data from the database migrations:

```
Username: admin
Password: (Use the hashed password from migrations or create a test user)
```

### Example cURL Requests

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

**Create Applicant:**
```bash
curl -X POST http://localhost:5000/api/applicants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1988-05-15",
    "email": "john@example.com",
    ...
  }'
```

**Get Dashboard:**
```bash
curl http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Database Connection

The API uses connection pooling for efficient database management:

- **Max Connections:** 20 (configurable)
- **Idle Timeout:** 30 seconds
- **Connection Timeout:** 2 seconds

Connection pool is automatically managed and handles reconnections.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_NAME | Database name | loan_db |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | - |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | Token expiration | 24h |
| CORS_ORIGIN | Allowed origins | * |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 900000 |
| RATE_LIMIT_MAX_REQUESTS | Max requests | 100 |

## 🚦 Health Check

Check if the API is running:

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-19T...",
  "environment": "development"
}
```

## 📝 Logging

- **Development:** Console logging with detailed information
- **Production:** Combined format logging

All API actions are logged to the `audit_logs` table in the database.

## 🔐 Security Features

- Helmet.js for security headers
- Rate limiting per IP
- Input validation and sanitization
- SQL injection protection (parameterized queries)
- JWT token expiration
- CORS configuration
- Password hashing with bcrypt

## 📞 Support

For issues or questions:
1. Check the error message and status code
2. Verify database connection
3. Check authentication token
4. Review API documentation

## 📜 License

MIT
