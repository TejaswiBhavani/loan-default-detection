#!/bin/bash

# ============================================================================
# Production Deployment Validation Script
# Loan Default Prediction API
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENV_FILE="${ENV_FILE:-.env}"
CHECKLIST_PASSED=0
CHECKLIST_FAILED=0
CHECKLIST_WARNING=0

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC} $1"
    CHECKLIST_PASSED=$((CHECKLIST_PASSED + 1))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC} $1"
    CHECKLIST_FAILED=$((CHECKLIST_FAILED + 1))
}

print_warn() {
    echo -e "${YELLOW}⚠ WARN${NC} $1"
    CHECKLIST_WARNING=$((CHECKLIST_WARNING + 1))
}

print_info() {
    echo -e "${BLUE}ℹ INFO${NC} $1"
}

check_env_var() {
    local var_name=$1
    local min_length=${2:-1}
    local value=$(grep "^$var_name=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$value" ] || [ "$value" = "your_"* ] || [ "$value" = "change_this"* ]; then
        print_fail "$var_name is not set or using default value"
        return 1
    elif [ ${#value} -lt $min_length ]; then
        print_fail "$var_name is too short (minimum $min_length characters)"
        return 1
    else
        print_pass "$var_name is configured (${#value} characters)"
        return 0
    fi
}

check_env_file() {
    print_header "1. Environment File Check"
    
    if [ ! -f "$ENV_FILE" ]; then
        print_fail "Environment file not found: $ENV_FILE"
        print_info "Copy .env.example to .env and configure it"
        return 1
    fi
    
    print_pass "Environment file exists: $ENV_FILE"
}

check_node_env() {
    print_header "2. Node Environment Check"
    
    local node_env=$(grep "^NODE_ENV=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [ "$node_env" = "production" ]; then
        print_pass "NODE_ENV is set to 'production'"
    elif [ "$node_env" = "staging" ]; then
        print_warn "NODE_ENV is set to 'staging' (ensure this is intentional)"
    else
        print_fail "NODE_ENV is set to '$node_env' (should be 'production')"
    fi
}

check_secrets() {
    print_header "3. Security Secrets Check"
    
    check_env_var "JWT_SECRET" 32
    check_env_var "JWT_REFRESH_SECRET" 32
    check_env_var "SESSION_SECRET" 32
    check_env_var "DB_PASSWORD" 16
    
    # Check that secrets are different
    local jwt_secret=$(grep "^JWT_SECRET=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2)
    local refresh_secret=$(grep "^JWT_REFRESH_SECRET=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2)
    
    if [ "$jwt_secret" = "$refresh_secret" ]; then
        print_fail "JWT_SECRET and JWT_REFRESH_SECRET should be different"
    else
        print_pass "JWT secrets are unique"
    fi
}

check_database_config() {
    print_header "4. Database Configuration Check"
    
    check_env_var "DB_HOST"
    check_env_var "DB_NAME"
    check_env_var "DB_USER"
    
    local db_ssl=$(grep "^DB_SSL=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [ "$db_ssl" = "true" ]; then
        print_pass "Database SSL is enabled"
    else
        print_warn "Database SSL is disabled (recommended for production)"
    fi
}

check_cors_config() {
    print_header "5. CORS Configuration Check"
    
    local cors_origin=$(grep "^CORS_ORIGIN=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [ -z "$cors_origin" ]; then
        print_fail "CORS_ORIGIN is not set"
    elif [ "$cors_origin" = "*" ]; then
        print_fail "CORS_ORIGIN is set to '*' (too permissive for production)"
    elif echo "$cors_origin" | grep -q "localhost"; then
        print_warn "CORS_ORIGIN includes localhost (may not be needed in production)"
    else
        print_pass "CORS_ORIGIN is configured with specific domains"
    fi
}

check_rate_limiting() {
    print_header "6. Rate Limiting Configuration Check"
    
    local window_ms=$(grep "^RATE_LIMIT_WINDOW_MS=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2)
    local max_requests=$(grep "^RATE_LIMIT_MAX_REQUESTS=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2)
    
    if [ -n "$window_ms" ] && [ -n "$max_requests" ]; then
        print_pass "Rate limiting is configured ($max_requests requests per $window_ms ms)"
    else
        print_warn "Rate limiting configuration may be incomplete"
    fi
}

check_trust_proxy() {
    print_header "7. Trust Proxy Configuration Check"
    
    local trust_proxy=$(grep "^TRUST_PROXY=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [ "$trust_proxy" = "true" ]; then
        print_pass "TRUST_PROXY is enabled (required when behind reverse proxy)"
    else
        print_warn "TRUST_PROXY is disabled (should be 'true' if behind nginx/ALB)"
    fi
}

check_logging_config() {
    print_header "8. Logging Configuration Check"
    
    local log_level=$(grep "^LOG_LEVEL=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [ "$log_level" = "debug" ]; then
        print_warn "LOG_LEVEL is 'debug' (consider 'info' or 'warn' for production)"
    elif [ "$log_level" = "info" ] || [ "$log_level" = "warn" ] || [ "$log_level" = "error" ]; then
        print_pass "LOG_LEVEL is set to '$log_level'"
    else
        print_warn "LOG_LEVEL is '$log_level' (unexpected value)"
    fi
    
    # Check log directory
    local log_dir=$(grep "^LOG_DIRECTORY=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    log_dir=${log_dir:-./logs}
    
    if [ -d "$log_dir" ]; then
        print_pass "Log directory exists: $log_dir"
    else
        print_warn "Log directory does not exist: $log_dir (will be created on startup)"
    fi
}

check_dependencies() {
    print_header "9. Dependencies Check"
    
    if [ -f "package.json" ]; then
        print_pass "package.json found"
        
        # Check if node_modules exists
        if [ -d "node_modules" ]; then
            print_pass "node_modules directory exists"
        else
            print_fail "node_modules directory not found (run 'npm install')"
        fi
        
        # Check for security vulnerabilities
        print_info "Checking for security vulnerabilities..."
        if npm audit --audit-level=moderate > /dev/null 2>&1; then
            print_pass "No moderate or high severity vulnerabilities found"
        else
            print_warn "Security vulnerabilities detected (run 'npm audit' for details)"
        fi
    else
        print_fail "package.json not found"
    fi
}

check_model_files() {
    print_header "10. ML Model Files Check"
    
    local model_path=$(grep "^ML_MODEL_PATH=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    local scaler_path=$(grep "^ML_SCALER_PATH=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    model_path=${model_path:-./models/loan_default_model.joblib}
    scaler_path=${scaler_path:-./models/scaler.joblib}
    
    if [ -f "$model_path" ]; then
        print_pass "ML model file exists: $model_path"
    else
        print_fail "ML model file not found: $model_path"
    fi
    
    if [ -f "$scaler_path" ]; then
        print_pass "Scaler file exists: $scaler_path"
    else
        print_fail "Scaler file not found: $scaler_path"
    fi
}

check_file_permissions() {
    print_header "11. File Permissions Check"
    
    if [ -f "$ENV_FILE" ]; then
        local perms=$(stat -c "%a" "$ENV_FILE" 2>/dev/null || stat -f "%A" "$ENV_FILE" 2>/dev/null)
        
        if [ "$perms" = "600" ] || [ "$perms" = "400" ]; then
            print_pass ".env file permissions are secure ($perms)"
        else
            print_warn ".env file permissions are $perms (consider chmod 600 .env)"
        fi
    fi
}

check_git_config() {
    print_header "12. Git Configuration Check"
    
    if [ -f ".gitignore" ]; then
        if grep -q "^\.env$" .gitignore; then
            print_pass ".env is in .gitignore"
        else
            print_fail ".env is NOT in .gitignore (SECURITY RISK!)"
        fi
        
        if grep -q "node_modules" .gitignore; then
            print_pass "node_modules is in .gitignore"
        else
            print_warn "node_modules should be in .gitignore"
        fi
    else
        print_warn ".gitignore file not found"
    fi
}

check_ssl_https() {
    print_header "13. SSL/HTTPS Check"
    
    print_info "Ensure SSL/HTTPS is configured in your reverse proxy (nginx/ALB)"
    print_info "The Node.js API should run on HTTP and be proxied through HTTPS"
    print_warn "Manual verification required - check reverse proxy configuration"
}

print_summary() {
    print_header "Deployment Readiness Summary"
    
    echo -e "${GREEN}Passed:${NC}  $CHECKLIST_PASSED"
    echo -e "${YELLOW}Warnings:${NC} $CHECKLIST_WARNING"
    echo -e "${RED}Failed:${NC}  $CHECKLIST_FAILED"
    echo ""
    
    if [ $CHECKLIST_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All critical checks passed!${NC}"
        
        if [ $CHECKLIST_WARNING -gt 0 ]; then
            echo -e "${YELLOW}⚠ However, there are $CHECKLIST_WARNING warnings to review${NC}"
        fi
        
        echo ""
        print_info "Next steps:"
        echo "  1. Review any warnings above"
        echo "  2. Test the API with: npm start"
        echo "  3. Run security tests: ./tests/security-tests.sh"
        echo "  4. Configure reverse proxy (nginx/ALB) with SSL"
        echo "  5. Set up log rotation"
        echo "  6. Configure monitoring and alerts"
        echo "  7. Deploy to production environment"
        return 0
    else
        echo -e "${RED}✗ Deployment readiness check FAILED${NC}"
        echo ""
        print_info "Fix the failed checks above before deploying to production"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║     Loan Default Prediction API - Deployment Validation       ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_env_file
    check_node_env
    check_secrets
    check_database_config
    check_cors_config
    check_rate_limiting
    check_trust_proxy
    check_logging_config
    check_dependencies
    check_model_files
    check_file_permissions
    check_git_config
    check_ssl_https
    
    print_summary
}

# Run validation
cd "$(dirname "$0")/.." || exit 1
main "$@"
