# Frontend to Backend Integration Guide

## Overview

The React frontend has been updated to connect with the real Node.js/Express backend API running on port 5000.

## Key Changes

### 1. Authentication Service (`src/services/authService.ts`)

**Features:**
- JWT token management with automatic refresh
- Secure token storage in localStorage
- Automatic retry on 401 errors
- Role-based access control
- User session management

**Usage:**
```typescript
import authService from '../services/authService';

// Login
const user = await authService.login({ email, password });

// Logout
await authService.logout();

// Check authentication
const isAuth = authService.isAuthenticated();

// Get current user
const user = authService.getUser();

// Check roles
const hasAccess = authService.hasRole('admin');
const canAccess = authService.hasAnyRole(['admin', 'analyst']);
```

### 2. API Service Updates (`src/services/api.ts`)

**Updated Endpoints:**
- `POST /api/predictions` - Create prediction (was `/predict/single`)
- `GET /api/predictions/recent` - Get predictions list
- `GET /api/predictions/:id` - Get single prediction
- `GET /api/predictions/application/:id` - Get predictions by application
- `GET /api/dashboard/metrics` - Dashboard metrics
- `GET /api/dashboard/model-metrics` - Model performance metrics
- `GET /api/applicants` - List applicants with pagination
- `POST /api/applicants` - Create applicant
- `GET /api/loan-applications` - List loan applications
- `GET /health` - Health check

**Authentication:**
All API requests automatically include JWT token from authService.

**Error Handling:**
- 401: Automatically attempts token refresh, redirects to login if fails
- 400: Validation errors returned to component
- 500: Server errors caught and displayed

### 3. Authentication Context (`src/contexts/AppContext.tsx`)

**Provides:**
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}
```

**Usage in Components:**
```typescript
import { useAuth } from '../contexts/AppContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Component logic
}
```

### 4. Form Validation (`src/utils/formValidation.ts`)

**Matches Backend Rules:**
- Age: 18-100
- Income: $0 - $10,000,000
- Credit Score: 300-850
- Loan Amount: $1,000 - $1,000,000
- Loan Term: 6-360 months
- Email, phone number validation
- Enum validation for dropdowns

**Usage:**
```typescript
import { validateApplicantForm, VALIDATION_RULES } from '../utils/formValidation';

const result = validateApplicantForm(formData);
if (!result.isValid) {
  setErrors(result.errors);
}
```

### 5. Protected Routes (`src/components/common/PrivateRoute.tsx`)

**Features:**
- Redirects to login if not authenticated
- Role-based access control
- Loading state handling
- "Access Denied" page for insufficient permissions

**Usage in App.tsx:**
```typescript
<Route
  path="/analytics"
  element={
    <PrivateRoute requiredRoles={['admin', 'analyst']}>
      <Layout><Analytics /></Layout>
    </PrivateRoute>
  }
/>
```

### 6. Login Page (`src/pages/Login.tsx`)

**Features:**
- Email/password authentication
- Client-side validation
- Loading states
- Error handling
- "Remember me" option
- Redirect to previous page after login

### 7. Updated Analytics Page

**Changes:**
- Uses real API calls to `/api/dashboard/metrics` and `/api/dashboard/model-metrics`
- Fallback to demo data if API unavailable
- Loading states
- Error handling with toast notifications
- Automatic data refresh

## Environment Configuration

### Development (.env.development)
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

### Production (.env.production)
```bash
REACT_APP_API_URL=https://your-api-domain.com/api
```

## API Response Format

All API responses follow this structure:

```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  errors?: string[];
}
```

### Example Success Response:
```json
{
  "success": true,
  "data": {
    "id": "123",
    "email": "user@example.com",
    "role": "loan_officer"
  }
}
```

### Example Error Response:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 6 characters"
  ]
}
```

## User Roles

The system supports the following roles:
- `admin` - Full access to all features
- `loan_officer` - Can create predictions, view applications
- `underwriter` - Can create predictions, review applications
- `analyst` - Can view analytics and reports
- `viewer` - Read-only access

## Testing Authentication Flow

### 1. Start Backend Server
```bash
cd api
npm start
# Server runs on http://localhost:5000
```

### 2. Start Frontend
```bash
cd loan-prediction-frontend
npm start
# Frontend runs on http://localhost:3000
```

### 3. Test Login
1. Navigate to http://localhost:3000
2. You'll be redirected to /login
3. Use demo credentials:
   - Email: admin@example.com
   - Password: admin123
4. Upon success, redirected to /dashboard

### 4. Test Protected Routes
- Try accessing /analytics without login → redirects to /login
- Login as 'viewer' → access denied to /analytics
- Login as 'admin' → full access

## Common Issues & Solutions

### Issue: CORS Errors
**Solution:** Ensure backend CORS is configured to allow frontend origin:
```javascript
// In api/.env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Issue: 401 Errors
**Solution:** Check that:
1. JWT_SECRET matches between requests
2. Token is being sent in Authorization header
3. Token hasn't expired

### Issue: API Connection Refused
**Solution:** 
1. Verify backend is running on port 5000
2. Check REACT_APP_API_URL in .env files
3. Ensure no firewall blocking localhost:5000

### Issue: Validation Errors
**Solution:**
1. Check frontend validation matches backend rules
2. Review console for specific field errors
3. Ensure enums match between frontend and backend

## API Rate Limiting

The backend has rate limiting enabled:
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Predictions: 10 requests per minute

Handle 429 (Too Many Requests) errors:
```typescript
if (error.response?.status === 429) {
  showToast('warning', 'Rate limit exceeded. Please try again later.');
}
```

## Security Features

1. **JWT Tokens:**
   - Access token: 1 hour expiration
   - Refresh token: 7 days expiration
   - Automatic refresh on 401

2. **XSS Protection:**
   - Backend sanitizes all inputs
   - Frontend validates before sending

3. **HTTPS:**
   - Required in production
   - Configure reverse proxy (nginx/ALB)

4. **Secure Storage:**
   - Tokens stored in localStorage
   - Consider httpOnly cookies for enhanced security

## Next Steps

1. **Implement Remaining Pages:**
   - Update SingleAssessment.tsx to use real API
   - Update PredictionHistory.tsx with pagination
   - Update Settings.tsx with user preferences API

2. **Add Features:**
   - Password reset functionality
   - User registration (if needed)
   - Real-time notifications via WebSocket
   - Batch prediction uploads

3. **Testing:**
   - Write integration tests for auth flow
   - Test all protected routes
   - Test error scenarios
   - Test rate limiting

4. **Production Deployment:**
   - Set up environment variables
   - Configure HTTPS
   - Set up monitoring
   - Configure error tracking (Sentry)

## Code Examples

### Making an Authenticated API Call

```typescript
import apiService from '../services/api';

const MyComponent: React.FC = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getPredictions();
      if (response.success) {
        setData(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <div className="error">{error}</div>}
      {data && <div>Data: {JSON.stringify(data)}</div>}
    </div>
  );
};
```

### Form Submission with Validation

```typescript
import { validateApplicantForm } from '../utils/formValidation';
import apiService from '../services/api';

const FormComponent: React.FC = () => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const validation = validateApplicantForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiService.createApplicant(formData);
      if (response.success) {
        // Handle success
        showToast('success', 'Applicant created successfully');
      }
    } catch (err: any) {
      // Handle errors
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        showToast('error', err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

## Contact & Support

For issues or questions:
- Check API logs: `api/logs/access.log`
- Check browser console for frontend errors
- Review this documentation
- Contact development team

---

**Last Updated:** October 19, 2025
**Version:** 2.0.0
