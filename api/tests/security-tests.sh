#!/bin/bash

# ============================================================================
# Security Features Testing Script
# Loan Default Prediction API
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:5000}"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="Test123!@#"

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if server is running
check_server() {
    print_header "Checking Server Status"
    
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" | grep -q "200"; then
        print_success "Server is running at $API_URL"
        return 0
    else
        print_error "Server is not responding at $API_URL"
        print_info "Start the server with: npm start"
        exit 1
    fi
}

# Test 1: Security Headers (Helmet)
test_security_headers() {
    print_header "Test 1: Security Headers (Helmet)"
    
    echo "Checking security headers..."
    HEADERS=$(curl -s -I "$API_URL/health")
    
    # Check for important security headers
    if echo "$HEADERS" | grep -qi "x-content-type-options: nosniff"; then
        print_success "X-Content-Type-Options header present"
    else
        print_error "X-Content-Type-Options header missing"
    fi
    
    if echo "$HEADERS" | grep -qi "x-frame-options"; then
        print_success "X-Frame-Options header present"
    else
        print_error "X-Frame-Options header missing"
    fi
    
    if echo "$HEADERS" | grep -qi "strict-transport-security"; then
        print_success "Strict-Transport-Security (HSTS) header present"
    else
        print_warning "HSTS header missing (normal for HTTP, required for HTTPS)"
    fi
    
    if echo "$HEADERS" | grep -qi "content-security-policy"; then
        print_success "Content-Security-Policy header present"
    else
        print_error "Content-Security-Policy header missing"
    fi
    
    if echo "$HEADERS" | grep -qi "x-powered-by"; then
        print_error "X-Powered-By header should be removed"
    else
        print_success "X-Powered-By header removed"
    fi
}

# Test 2: CORS Configuration
test_cors() {
    print_header "Test 2: CORS Configuration"
    
    echo "Testing CORS headers..."
    
    # Test allowed origin
    RESPONSE=$(curl -s -I -H "Origin: http://localhost:3000" "$API_URL/api")
    
    if echo "$RESPONSE" | grep -qi "access-control-allow-origin"; then
        print_success "CORS headers present"
    else
        print_error "CORS headers missing"
    fi
    
    # Test blocked origin
    RESPONSE=$(curl -s -I -H "Origin: http://malicious-site.com" "$API_URL/api")
    
    if echo "$RESPONSE" | grep -qi "access-control-allow-origin: http://malicious-site.com"; then
        print_warning "CORS may be allowing unauthorized origins"
    else
        print_success "Unauthorized origins are blocked"
    fi
}

# Test 3: Rate Limiting
test_rate_limiting() {
    print_header "Test 3: Rate Limiting"
    
    echo "Testing general rate limiter (100 requests per 15 minutes)..."
    
    SUCCESS_COUNT=0
    RATE_LIMITED=false
    
    for i in {1..120}; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api")
        
        if [ "$STATUS" = "429" ]; then
            RATE_LIMITED=true
            print_success "Rate limit triggered after $i requests"
            break
        elif [ "$STATUS" = "200" ]; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        fi
        
        # Show progress every 10 requests
        if [ $((i % 10)) -eq 0 ]; then
            print_info "Sent $i requests..."
        fi
    done
    
    if [ "$RATE_LIMITED" = true ]; then
        print_success "Rate limiting is working correctly"
    else
        print_warning "Rate limit not reached in 120 requests (limit may be higher)"
    fi
}

# Test 4: XSS Protection
test_xss_protection() {
    print_header "Test 4: XSS Protection"
    
    echo "Testing XSS detection and blocking..."
    
    # Test various XSS payloads
    XSS_PAYLOADS=(
        "<script>alert('XSS')</script>"
        "<img src=x onerror=alert('XSS')>"
        "javascript:alert('XSS')"
        "<svg/onload=alert('XSS')>"
    )
    
    BLOCKED=0
    
    for payload in "${XSS_PAYLOADS[@]}"; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d "{\"test\": \"$payload\"}" \
            "$API_URL/api")
        
        if [ "$STATUS" = "400" ]; then
            BLOCKED=$((BLOCKED + 1))
            print_success "Blocked XSS payload: ${payload:0:30}..."
        else
            print_warning "XSS payload not blocked: ${payload:0:30}..."
        fi
    done
    
    if [ $BLOCKED -gt 0 ]; then
        print_success "XSS protection is working ($BLOCKED/$((${#XSS_PAYLOADS[@]})) payloads blocked)"
    else
        print_error "XSS protection may not be working"
    fi
}

# Test 5: SQL Injection Detection
test_sql_injection() {
    print_header "Test 5: SQL Injection Detection"
    
    echo "Testing SQL injection detection..."
    
    SQL_PAYLOADS=(
        "' OR '1'='1"
        "1; DROP TABLE users--"
        "' UNION SELECT * FROM users--"
        "admin'--"
    )
    
    BLOCKED=0
    
    for payload in "${SQL_PAYLOADS[@]}"; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d "{\"username\": \"$payload\"}" \
            "$API_URL/api")
        
        if [ "$STATUS" = "400" ]; then
            BLOCKED=$((BLOCKED + 1))
            print_success "Blocked SQL injection: ${payload:0:30}..."
        else
            print_warning "SQL injection not blocked: ${payload:0:30}..."
        fi
    done
    
    if [ $BLOCKED -gt 0 ]; then
        print_success "SQL injection detection is working ($BLOCKED/$((${#SQL_PAYLOADS[@]})) payloads blocked)"
    else
        print_error "SQL injection detection may not be working"
    fi
}

# Test 6: Path Traversal Protection
test_path_traversal() {
    print_header "Test 6: Path Traversal Protection"
    
    echo "Testing path traversal detection..."
    
    TRAVERSAL_PAYLOADS=(
        "../../../etc/passwd"
        "..\\..\\windows\\system32"
        "....//....//etc/passwd"
    )
    
    BLOCKED=0
    
    for payload in "${TRAVERSAL_PAYLOADS[@]}"; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -d "{\"file\": \"$payload\"}" \
            "$API_URL/api")
        
        if [ "$STATUS" = "400" ]; then
            BLOCKED=$((BLOCKED + 1))
            print_success "Blocked path traversal: $payload"
        else
            print_warning "Path traversal not blocked: $payload"
        fi
    done
    
    if [ $BLOCKED -gt 0 ]; then
        print_success "Path traversal protection is working ($BLOCKED/$((${#TRAVERSAL_PAYLOADS[@]})) payloads blocked)"
    else
        print_error "Path traversal protection may not be working"
    fi
}

# Test 7: Request Logging
test_request_logging() {
    print_header "Test 7: Request Logging"
    
    echo "Testing request logging..."
    
    # Make a request
    curl -s -o /dev/null "$API_URL/health"
    
    # Check if log file exists and has recent entries
    if [ -f "./logs/access.log" ]; then
        RECENT_LOGS=$(tail -n 5 "./logs/access.log")
        if [ -n "$RECENT_LOGS" ]; then
            print_success "Request logging is working"
            print_info "Recent log entries found in logs/access.log"
        else
            print_warning "Log file exists but may be empty"
        fi
    else
        print_warning "Log file not found at ./logs/access.log"
        print_info "Logs may be configured to output to console only"
    fi
}

# Test 8: Metrics Collection
test_metrics() {
    print_header "Test 8: Metrics Collection"
    
    echo "Testing metrics collection..."
    
    # Make some requests to generate metrics
    for i in {1..5}; do
        curl -s -o /dev/null "$API_URL/health" &
    done
    wait
    
    sleep 1
    
    # Check health endpoint for metrics
    HEALTH_RESPONSE=$(curl -s "$API_URL/health")
    
    if echo "$HEALTH_RESPONSE" | grep -q "metrics"; then
        print_success "Metrics are being collected"
        echo "$HEALTH_RESPONSE" | grep -E "(totalRequests|averageResponseTime)" || true
    else
        print_warning "Metrics not found in health endpoint"
    fi
}

# Test 9: Environment Configuration
test_environment_config() {
    print_header "Test 9: Environment Configuration"
    
    echo "Checking environment configuration..."
    
    # Try to access security config endpoint (should only work in development)
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/security-config")
    
    if [ "$STATUS" = "404" ]; then
        print_success "Security config endpoint is disabled (production mode)"
    elif [ "$STATUS" = "200" ]; then
        print_warning "Security config endpoint is accessible (development mode)"
    else
        print_info "Could not determine environment configuration"
    fi
}

# Test 10: Content-Type Validation
test_content_type() {
    print_header "Test 10: Content-Type Validation"
    
    echo "Testing content-type validation..."
    
    # Send request without proper content-type
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -d '{"test": "data"}' \
        "$API_URL/api")
    
    if [ "$STATUS" = "400" ] || [ "$STATUS" = "415" ]; then
        print_success "Invalid content-type is rejected"
    else
        print_warning "Content-type validation may not be strict"
    fi
    
    # Send request with proper content-type
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"test": "data"}' \
        "$API_URL/api")
    
    if [ "$STATUS" != "400" ] && [ "$STATUS" != "415" ]; then
        print_success "Valid content-type is accepted"
    fi
}

# Summary
print_summary() {
    print_header "Security Test Summary"
    
    echo "All security tests completed!"
    echo ""
    print_info "Review the results above to ensure all security features are working correctly."
    echo ""
    print_info "Additional manual testing recommended:"
    echo "  1. Test rate limiting with actual user accounts"
    echo "  2. Test CORS from actual frontend application"
    echo "  3. Review logs in ./logs/access.log"
    echo "  4. Monitor metrics via /health endpoint"
    echo "  5. Test with production SSL/TLS configuration"
    echo ""
    print_info "For production deployment, ensure:"
    echo "  - All environment variables are set correctly"
    echo "  - HTTPS is configured in reverse proxy"
    echo "  - Log rotation is set up"
    echo "  - Monitoring alerts are configured"
    echo "  - Database SSL is enabled"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║       Loan Default Prediction API - Security Test Suite       ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_server
    
    test_security_headers
    test_cors
    test_rate_limiting
    test_xss_protection
    test_sql_injection
    test_path_traversal
    test_request_logging
    test_metrics
    test_environment_config
    test_content_type
    
    print_summary
}

# Run tests
main "$@"
