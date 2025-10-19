#!/bin/bash

# ==============================================================================
# PostgreSQL Database Setup Script for Loan Default Prediction System
# ==============================================================================
# This script automates the database creation, schema setup, and sample data insertion
# Usage: ./setup_database.sh [environment]
# Environments: dev, test, prod
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-dev}

# Database configuration based on environment
case $ENVIRONMENT in
    "dev")
        DB_NAME="loan_prediction_dev"
        DB_USER="loan_app_user"
        DB_HOST="localhost"
        DB_PORT="5432"
        ;;
    "test")
        DB_NAME="loan_prediction_test"
        DB_USER="loan_app_test_user"
        DB_HOST="localhost"
        DB_PORT="5432"
        ;;
    "prod")
        DB_NAME="loan_prediction_prod"
        DB_USER="loan_app_prod_user"
        DB_HOST=${PROD_DB_HOST:-"localhost"}
        DB_PORT=${PROD_DB_PORT:-"5432"}
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo "Valid options: dev, test, prod"
        exit 1
        ;;
esac

echo -e "${BLUE}🗄️  PostgreSQL Database Setup for Loan Default Prediction System${NC}"
echo "=============================================================="
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Database: $DB_NAME${NC}"
echo -e "${YELLOW}User: $DB_USER${NC}"
echo -e "${YELLOW}Host: $DB_HOST:$DB_PORT${NC}"
echo ""

# Function to print status messages
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if PostgreSQL is running
print_info "Checking PostgreSQL status..."
if ! pg_isready -h $DB_HOST -p $DB_PORT; then
    print_error "PostgreSQL is not running or not accessible at $DB_HOST:$DB_PORT"
    print_info "Please start PostgreSQL and try again"
    exit 1
fi
print_status "PostgreSQL is running"

# Generate random password for database user
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Check if database already exists
print_info "Checking if database '$DB_NAME' exists..."
if psql -h $DB_HOST -p $DB_PORT -U postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_warning "Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Dropping existing database..."
        psql -h $DB_HOST -p $DB_PORT -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
        psql -h $DB_HOST -p $DB_PORT -U postgres -c "DROP USER IF EXISTS $DB_USER;"
        print_status "Existing database dropped"
    else
        print_info "Keeping existing database. Exiting..."
        exit 0
    fi
fi

# Create database user
print_info "Creating database user '$DB_USER'..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "
CREATE USER $DB_USER WITH 
    CREATEDB 
    PASSWORD '$DB_PASSWORD'
    CONNECTION LIMIT 20;
"
print_status "Database user created"

# Create database
print_info "Creating database '$DB_NAME'..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "
CREATE DATABASE $DB_NAME 
    WITH OWNER = $DB_USER
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0
    CONNECTION LIMIT = -1;
"
print_status "Database created"

# Grant privileges
print_info "Setting up database privileges..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT CONNECT ON DATABASE $DB_NAME TO $DB_USER;
"
print_status "Database privileges configured"

# Run schema creation
print_info "Creating database schema..."
export PGPASSWORD=$DB_PASSWORD
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f schema.sql > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Database schema created successfully"
else
    print_error "Failed to create database schema"
    exit 1
fi

# Insert sample data (only for dev and test environments)
if [[ "$ENVIRONMENT" == "dev" || "$ENVIRONMENT" == "test" ]]; then
    print_info "Inserting sample data..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f sample_data.sql > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "Sample data inserted successfully"
    else
        print_warning "Failed to insert sample data (schema is still valid)"
    fi
else
    print_warning "Skipping sample data insertion for production environment"
fi

# Create .env file with database configuration
ENV_FILE="../.env.${ENVIRONMENT}"
print_info "Creating environment configuration file: $ENV_FILE"

cat > $ENV_FILE << EOF
# Database Configuration for $ENVIRONMENT environment
# Generated on $(date)

# PostgreSQL Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# SSL Configuration
DB_SSL_MODE=prefer
DB_SSL_CERT=
DB_SSL_KEY=
DB_SSL_CA=

# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=60000

# Application Settings
NODE_ENV=$ENVIRONMENT
LOG_LEVEL=info
JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
SESSION_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# API Configuration
API_PORT=8000
API_HOST=localhost
CORS_ORIGIN=http://localhost:3000

# Model Configuration
MODEL_PATH=./models/loan_default_model_20251006.joblib
SCALER_PATH=./models/scaler_20251006.joblib
MODEL_COLUMNS_PATH=./models/model_columns.json

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Monitoring and Analytics
SENTRY_DSN=
ANALYTICS_ENABLED=false
EOF

print_status "Environment file created: $ENV_FILE"

# Create database connection test script
TEST_SCRIPT="../test_db_connection.js"
print_info "Creating database connection test script..."

cat > $TEST_SCRIPT << 'EOF'
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testConnection() {
    try {
        console.log('🔍 Testing database connection...');
        
        const client = await pool.connect();
        console.log('✅ Database connection successful!');
        
        // Test basic query
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('📅 Current Time:', result.rows[0].current_time);
        console.log('🗄️  PostgreSQL Version:', result.rows[0].postgres_version.split(',')[0]);
        
        // Test table existence
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('📊 Tables created:', tables.rows.length);
        tables.rows.forEach(row => console.log('  -', row.table_name));
        
        // Test sample data
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        const applicantCount = await client.query('SELECT COUNT(*) FROM applicants');
        const applicationCount = await client.query('SELECT COUNT(*) FROM loan_applications');
        
        console.log('👥 Sample Users:', userCount.rows[0].count);
        console.log('👤 Sample Applicants:', applicantCount.rows[0].count);
        console.log('📄 Sample Applications:', applicationCount.rows[0].count);
        
        client.release();
        console.log('🎉 Database setup verification complete!');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

testConnection();
EOF

print_status "Database test script created: $TEST_SCRIPT"

# Show connection information
echo ""
echo -e "${GREEN}🎉 Database Setup Complete!${NC}"
echo "=========================================="
echo -e "${YELLOW}Connection Information:${NC}"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Environment File: $ENV_FILE"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Install Node.js PostgreSQL client: npm install pg dotenv"
echo "2. Test connection: node test_db_connection.js"
echo "3. Update your application to use the new database"
echo ""
echo -e "${YELLOW}Security Notes:${NC}"
echo "⚠️  Database password has been generated and saved in $ENV_FILE"
echo "⚠️  Keep the .env file secure and do not commit it to version control"
echo "⚠️  For production, consider using environment variables or secrets management"
echo ""

# Cleanup
unset PGPASSWORD

print_status "Setup completed successfully!"