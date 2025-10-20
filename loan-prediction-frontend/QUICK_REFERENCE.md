# Quick Reference - Frontend Integration & Components

## 🚀 Quick Start - New Dashboard Components

### Import Components
```tsx
import { SmartDashboard } from './components/dashboard/SmartDashboard';
import { ApplicationWorkflow } from './components/workflow/ApplicationWorkflow';
import { AIAnalysisPanel } from './components/analysis/AIAnalysisPanel';
import { BatchProcessor } from './components/batch/BatchProcessor';
import { DecisionAnalytics } from './components/analytics/DecisionAnalytics';
import { MobileSwipeInterface } from './components/mobile/MobileSwipeInterface';
```

### Import Hooks
```tsx
import {
  useLoanDashboard,
  useApplicationFilter,
  useAnalytics,
  useApplicationDecision,
  useBatchProcessing,
  useAlerts,
} from './hooks/useLoanDashboard';
```

### Dashboard Example
```tsx
const DashboardPage = () => {
  const { applications, metrics, alerts, loading } = useLoanDashboard();
  
  return (
    <SmartDashboard
      metrics={metrics}
      alerts={alerts}
      recentApplications={applications}
      loading={loading}
    />
  );
};
```

---

## 🚀 Original Quick Start

### 1. Start Backend (Terminal 1)
```bash
cd /workspaces/loan-default-detection/api
npm start
# Runs on http://localhost:5000
```

### 2. Start Frontend (Terminal 2)
```bash
cd /workspaces/loan-default-detection/loan-prediction-frontend
npm start
# Runs on http://localhost:3000
```

### 3. Login
- URL: http://localhost:3000
- Demo: admin@example.com / admin123

## 🔑 Authentication

### Login
```typescript
import { useAuth } from '../contexts/AppContext';

const { login } = useAuth();
await login({ email: 'user@example.com', password: 'password123' });
```

### Logout
```typescript
const { logout } = useAuth();
await logout();
```

### Check Auth
```typescript
const { isAuthenticated, user, hasRole } = useAuth();

if (isAuthenticated) {
  console.log('Logged in as:', user.email);
}

if (hasRole('admin')) {
  // Admin-only actions
}
```

## 📡 API Calls

### Import
```typescript
import apiService from '../services/api';
```

### Create Prediction
```typescript
const response = await apiService.predictSingle(applicantData);
if (response.success) {
  const prediction = response.data;
}
```

### Get Predictions
```typescript
const response = await apiService.getPredictions(filters, page, perPage);
const predictions = response.data?.data || [];
```

### Get Dashboard Metrics
```typescript
const response = await apiService.getDashboardMetrics();
const metrics = response.data;
```

### Get Applicants
```typescript
const response = await apiService.getApplicants(page, perPage, filters);
const applicants = response.data?.data || [];
```

## ✅ Form Validation

### Import
```typescript
import { 
  validateApplicantForm, 
  VALIDATION_RULES,
  EMPLOYMENT_STATUS,
  LOAN_PURPOSE 
} from '../utils/formValidation';
```

### Validate Form
```typescript
const validation = validateApplicantForm(formData);
if (!validation.isValid) {
  setErrors(validation.errors);
  return;
}
```

### Validate Sections
```typescript
import { 
  validatePersonalInfo,
  validateFinancialInfo,
  validateCreditInfo 
} from '../utils/formValidation';

const personalValidation = validatePersonalInfo(formData);
const financialValidation = validateFinancialInfo(formData);
const creditValidation = validateCreditInfo(formData);
```

### Auto-Calculate DTI
```typescript
import { autoCalculateDTI } from '../utils/formValidation';

const dti = autoCalculateDTI(
  annualIncome,
  loanAmount,
  loanTermMonths,
  existingDebts
);
```

## 🛡️ Protected Routes

```typescript
import PrivateRoute from '../components/common/PrivateRoute';

// Require authentication
<Route path="/dashboard" element={
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
} />

// Require specific roles
<Route path="/analytics" element={
  <PrivateRoute requiredRoles={['admin', 'analyst']}>
    <Analytics />
  </PrivateRoute>
} />
```

## 🎨 Component Patterns

### Loading State
```typescript
import LoadingSpinner from '../components/common/LoadingSpinner';

{loading && <LoadingSpinner size="lg" />}
```

### Error Handling
```typescript
const [error, setError] = useState('');

try {
  const response = await apiService.something();
} catch (err: any) {
  setError(err.message || 'An error occurred');
}

{error && (
  <div className="bg-red-50 text-red-800 p-4 rounded">
    {error}
  </div>
)}
```

### Form Submission
```typescript
const [submitting, setSubmitting] = useState(false);
const [errors, setErrors] = useState({});

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setErrors({});
  
  // Validate
  const validation = validateApplicantForm(formData);
  if (!validation.isValid) {
    setErrors(validation.errors);
    return;
  }
  
  setSubmitting(true);
  try {
    const response = await apiService.createApplicant(formData);
    if (response.success) {
      // Success handling
    }
  } catch (err: any) {
    setErrors({ general: err.message });
  } finally {
    setSubmitting(false);
  }
};
```

## 📋 Validation Rules

### Personal Info
- Age: 18-100
- Income: $0-$10M
- Employment: 0-50 years
- Email: valid format
- Phone: 10-15 digits

### Financial Info
- Loan Amount: $1,000-$1,000,000
- Loan Term: 6-360 months
- Debts: $0-$5M
- Assets: $0-$50M
- DTI: 0-1 (auto-calc)

### Credit Info
- Credit Score: 300-850
- Credit History: 0-50 years
- Inquiries: 0-50
- Open Accounts: 0-50
- Payment Score: 0-100

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Predictions
- `POST /api/predictions` - Create prediction
- `GET /api/predictions/recent` - List predictions
- `GET /api/predictions/:id` - Get prediction
- `GET /api/predictions/application/:id` - Get by application

### Dashboard
- `GET /api/dashboard/metrics` - Dashboard metrics
- `GET /api/dashboard/model-metrics` - Model metrics

### Applicants
- `GET /api/applicants` - List applicants
- `POST /api/applicants` - Create applicant
- `GET /api/applicants/:id` - Get applicant
- `PUT /api/applicants/:id` - Update applicant

### Loan Applications
- `GET /api/loan-applications` - List applications
- `POST /api/loan-applications` - Create application
- `GET /api/loan-applications/:id` - Get application

### Health
- `GET /health` - Health check

## 🎯 User Roles

- **admin** - Full access
- **loan_officer** - Create predictions, view apps
- **underwriter** - Create predictions, review apps
- **analyst** - View analytics, reports
- **viewer** - Read-only access

## ⚠️ Rate Limits

- General API: 100 req/15min
- Auth: 5 req/15min
- Predictions: 10 req/min

## 🔧 Environment Variables

### .env.development
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

### .env.production
```bash
REACT_APP_API_URL=https://api.yourdomain.com/api
```

## 🐛 Common Errors

### 401 Unauthorized
→ Not logged in or token expired
→ Login again

### 403 Forbidden
→ Insufficient permissions
→ Check user role

### 429 Too Many Requests
→ Rate limit exceeded
→ Wait and retry

### 400 Bad Request
→ Validation error
→ Check request body

### 500 Server Error
→ Backend issue
→ Check backend logs

## 📞 Debugging

### Check Backend Status
```bash
curl http://localhost:5000/health
```

### Check Auth Token
```javascript
// In browser console
localStorage.getItem('auth_token')
```

### View API Requests
- Open DevTools → Network tab
- Filter by "Fetch/XHR"
- Check request/response

### Clear Auth Data
```javascript
// In browser console
localStorage.removeItem('auth_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('user_data');
location.reload();
```

## 📚 Documentation

- **Full Guide:** `INTEGRATION_GUIDE.md`
- **Summary:** `FRONTEND_INTEGRATION_SUMMARY.md`
- **Backend API:** `/api/docs/`
- **Backend Security:** `/api/SECURITY.md`

## ✅ Checklist

Before deployment:
- [ ] Backend running on correct port
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Login flow tested
- [ ] Protected routes tested
- [ ] API calls working
- [ ] Error handling tested
- [ ] Validation working
- [ ] Rate limiting handled
- [ ] HTTPS configured (production)

---

**Quick Ref Version:** 1.0
**Last Updated:** October 19, 2025
