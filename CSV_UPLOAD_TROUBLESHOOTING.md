# CSV Upload Troubleshooting Guide

## Current Status ✅
- ✅ API Server: Running on http://localhost:5000
- ✅ Frontend: Running on http://localhost:3000  
- ✅ Database: PostgreSQL is running
- ✅ Authentication: Working through frontend proxy
- ✅ Batch Upload API: Working through frontend proxy

## Test Results 🧪

### Direct API Test (✅ WORKING)
```bash
# This worked successfully:
TOKEN=$(curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' 2>/dev/null | jq -r '.data.token') && \
curl -X POST "http://localhost:3000/api/batch/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test_batch.csv" 2>/dev/null | jq .

# Response:
{
  "success": true,
  "message": "File uploaded successfully. Processing started.",
  "data": {
    "id": "5793d4e7-4059-4086-ad24-2ee76badddef",
    "filename": "file-1761054412102-871221704.csv",
    "status": "processing",
    "created_at": "2025-10-21T13:46:52.103Z"
  }
}
```

## Troubleshooting Steps 🔍

### Step 1: Access the Batch Upload Page
1. Open browser to: http://localhost:3000
2. Login with: username=`admin`, password=`admin123`
3. Navigate to: **Batch Processing** (should be in the menu)
4. URL should be: http://localhost:3000/assess/batch

### Step 2: Test File Upload
1. Create a test CSV file with this content:
```csv
annual_income,debt_to_income_ratio,credit_score,loan_amount,loan_purpose,employment_length
60000,0.35,720,15000,debt_consolidation,5
```

2. Try uploading via:
   - **Drag & Drop**: Drag the CSV file to the upload area
   - **File Picker**: Click "Browse Files" button

### Step 3: Check Browser Console
1. Open Browser Developer Tools (F12)
2. Go to **Console** tab
3. Look for any error messages during upload
4. Go to **Network** tab
5. Try uploading again and check for failed requests

### Step 4: Common Issues to Check

#### Issue A: Authentication
- **Symptom**: "Unauthorized" or "No token provided" 
- **Solution**: Make sure you're logged in first

#### Issue B: File Format
- **Symptom**: "Please upload a CSV file"
- **Solution**: Ensure file has .csv extension and proper CSV format

#### Issue C: File Size
- **Symptom**: "File size must be less than 10MB"
- **Solution**: Use smaller test file

#### Issue D: CORS/Proxy Issues
- **Symptom**: Network errors in console
- **Solution**: Backend/frontend proxy is working (verified above)

## What to Report Back 📝

Please tell me:

1. **What happens when you navigate to http://localhost:3000/assess/batch?**
   - Do you see the batch upload page?
   - Are there any error messages?

2. **What happens when you try to upload a CSV file?**
   - What exact error message do you see?
   - Where does the error appear (popup, console, etc.)?

3. **Browser Console Messages:**
   - Open F12 → Console tab
   - Try uploading
   - Copy any red error messages

4. **Network Tab:**
   - Open F12 → Network tab
   - Try uploading  
   - Look for any failed requests (red status codes)

## Quick Fixes to Try 🔧

### Fix 1: Clear Browser Cache
```bash
# Hard refresh in browser
Ctrl+F5 (or Cmd+Shift+R on Mac)
```

### Fix 2: Check Authentication
1. Log out and log back in
2. Verify you're logged in as admin user

### Fix 3: Try Different Browser
- Test in Chrome, Firefox, or Edge
- Use incognito/private mode

### Fix 4: Restart Services (if needed)
```bash
# Restart backend
cd /workspaces/loan-default-detection/api
npm start

# Restart frontend  
cd /workspaces/loan-default-detection/loan-prediction-frontend
npm start
```

## Server Status Check 🔍
```bash
# Check if servers are running:
curl http://localhost:5000/health  # Should return healthy status
curl http://localhost:3000/        # Should return HTML page
```

The backend API is confirmed working. The issue is likely in the frontend UI interaction.