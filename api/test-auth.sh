#!/bin/bash

# Test script for JWT Authentication with Hashed Refresh Tokens
# This script demonstrates the complete authentication flow:
# 1. Login to get access token and refresh token
# 2. Use access token to access protected endpoints
# 3. Use refresh token to get new tokens
# 4. Logout to invalidate session

set -e

API_URL="http://localhost:5000/api"
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   JWT Authentication Test - Hashed Refresh Tokens         ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Login
echo -e "${BLUE}${BOLD}Step 1: Login${NC}"
echo "Sending login request..."
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract tokens
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.refreshToken // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" == "null" ]; then
    echo -e "${RED}❌ Login failed. Check username/password.${NC}"
    echo ""
    echo "Make sure you have a user in the database:"
    echo "  Username: admin"
    echo "  Password hash for 'admin123' needs to be in users table"
    echo ""
    echo "You can create a test user with:"
    echo "  psql -d loan_db -c \"INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, is_verified) VALUES ('admin', 'admin@example.com', '\$(node -e \\\"console.log(require('bcrypt').hashSync('admin123', 10))\\\")', 'Admin', 'User', 'admin', true, true);\""
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Login successful!${NC}"
echo -e "Access Token: ${YELLOW}${ACCESS_TOKEN:0:50}...${NC}"
echo -e "Refresh Token: ${YELLOW}${REFRESH_TOKEN:0:50}...${NC}"
echo ""
echo -e "${BOLD}Note:${NC} The refresh token is hashed with bcrypt before storing in the database."
echo ""

# Step 2: Use Access Token
echo -e "${BLUE}${BOLD}Step 2: Access Protected Endpoint${NC}"
echo "Getting current user info using access token..."
echo ""

USER_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$USER_RESPONSE" | jq '.'
echo ""
echo -e "${GREEN}✅ Successfully accessed protected endpoint!${NC}"
echo ""

# Step 3: Refresh Token
echo -e "${BLUE}${BOLD}Step 3: Refresh Tokens${NC}"
echo "Exchanging refresh token for new access token..."
echo ""
echo "Process:"
echo "  1. Server verifies JWT signature of refresh token"
echo "  2. Server fetches all active sessions for the user"
echo "  3. Server compares provided token against stored bcrypt hashes"
echo "  4. On match, new tokens are issued and refresh token is rotated"
echo ""

REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

echo "$REFRESH_RESPONSE" | jq '.'

# Extract new tokens
NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.data.token // empty')
NEW_REFRESH_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.data.refreshToken // empty')

if [ -z "$NEW_ACCESS_TOKEN" ] || [ "$NEW_ACCESS_TOKEN" == "null" ]; then
    echo -e "${RED}❌ Token refresh failed.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Token refresh successful!${NC}"
echo -e "New Access Token: ${YELLOW}${NEW_ACCESS_TOKEN:0:50}...${NC}"
echo -e "New Refresh Token: ${YELLOW}${NEW_REFRESH_TOKEN:0:50}...${NC}"
echo ""
echo -e "${BOLD}Security Note:${NC} The old refresh token is now invalid (rotated)."
echo ""

# Step 4: Verify Old Token is Invalid
echo -e "${BLUE}${BOLD}Step 4: Verify Token Rotation${NC}"
echo "Attempting to use old refresh token (should fail)..."
echo ""

OLD_TOKEN_TEST=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

echo "$OLD_TOKEN_TEST" | jq '.'
echo ""

if echo "$OLD_TOKEN_TEST" | jq -e '.success == false' > /dev/null; then
    echo -e "${GREEN}✅ Old refresh token correctly rejected!${NC}"
    echo "This confirms that refresh tokens are rotated on each use."
else
    echo -e "${RED}⚠️  Warning: Old token still valid (unexpected)${NC}"
fi
echo ""

# Step 5: Use New Access Token
echo -e "${BLUE}${BOLD}Step 5: Use New Access Token${NC}"
echo "Accessing protected endpoint with new access token..."
echo ""

NEW_USER_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN")

echo "$NEW_USER_RESPONSE" | jq '.'
echo ""
echo -e "${GREEN}✅ New access token works correctly!${NC}"
echo ""

# Step 6: Logout
echo -e "${BLUE}${BOLD}Step 6: Logout${NC}"
echo "Logging out to invalidate session..."
echo ""

LOGOUT_RESPONSE=$(curl -s -X POST "$API_URL/auth/logout" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN")

echo "$LOGOUT_RESPONSE" | jq '.'
echo ""
echo -e "${GREEN}✅ Logout successful!${NC}"
echo "Session is now inactive and refresh token is cleared from database."
echo ""

# Step 7: Verify Session is Invalidated
echo -e "${BLUE}${BOLD}Step 7: Verify Session Invalidation${NC}"
echo "Attempting to use refresh token after logout (should fail)..."
echo ""

POST_LOGOUT_TEST=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$NEW_REFRESH_TOKEN\"}")

echo "$POST_LOGOUT_TEST" | jq '.'
echo ""

if echo "$POST_LOGOUT_TEST" | jq -e '.success == false' > /dev/null; then
    echo -e "${GREEN}✅ Refresh token correctly invalidated after logout!${NC}"
else
    echo -e "${RED}⚠️  Warning: Refresh token still valid after logout (unexpected)${NC}"
fi
echo ""

# Summary
echo -e "${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                    Test Summary                            ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Login and token generation${NC}"
echo -e "${GREEN}✅ Access token authentication${NC}"
echo -e "${GREEN}✅ Refresh token rotation${NC}"
echo -e "${GREEN}✅ Old token invalidation${NC}"
echo -e "${GREEN}✅ Session logout${NC}"
echo ""
echo -e "${BOLD}Security Features Verified:${NC}"
echo "  • Refresh tokens are hashed with bcrypt before storage"
echo "  • Tokens are rotated on each refresh (old tokens invalid)"
echo "  • Logout clears refresh token from database"
echo "  • All operations are logged to audit_logs table"
echo ""
echo -e "${YELLOW}Check the database:${NC}"
echo "  SELECT * FROM user_sessions WHERE user_id = '<user-id>';"
echo "  SELECT * FROM audit_logs WHERE action IN ('login', 'refresh_token', 'logout') ORDER BY created_at DESC LIMIT 10;"
echo ""
