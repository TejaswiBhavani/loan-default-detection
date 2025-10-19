#!/bin/bash

# Simple Database Setup for Codespace Environment
# This creates the database using peer authentication which should work in codespaces

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🗄️  Simple PostgreSQL Setup for Codespace${NC}"
echo "================================================"

# Try to connect as the current user first
echo -e "${YELLOW}Attempting to connect to PostgreSQL...${NC}"

# Method 1: Try connecting as current user to postgres database
if psql postgres -c "SELECT version();" 2>/dev/null; then
    echo -e "${GREEN}✅ Connected successfully as current user${NC}"
    
    # Create our database and user
    echo -e "${YELLOW}Creating database and user...${NC}"
    
    psql postgres <<EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'loan_app_user') THEN
        CREATE USER loan_app_user WITH PASSWORD 'root123' CREATEDB;
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE loan_prediction_dev OWNER loan_app_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'loan_prediction_dev')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE loan_prediction_dev TO loan_app_user;
EOF

else
    # Method 2: Try with trust authentication
    echo -e "${YELLOW}Trying alternative connection method...${NC}"
    
    # Create a temporary script for postgres user
    cat > /tmp/setup_db.sql <<EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'loan_app_user') THEN
        CREATE USER loan_app_user WITH PASSWORD 'root123' CREATEDB;
    END IF;
END
\$\$;

-- Create database if not exists  
SELECT 'CREATE DATABASE loan_prediction_dev OWNER loan_app_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'loan_prediction_dev')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE loan_prediction_dev TO loan_app_user;
EOF

    # Try to run as postgres user via different methods
    if command -v runuser >/dev/null 2>&1; then
        runuser -l postgres -c "psql -f /tmp/setup_db.sql"
    elif [ -f /var/lib/postgresql/.psql_history ] || [ -d /var/lib/postgresql ]; then
        # PostgreSQL is installed, try peer authentication
        PGUSER=postgres psql -f /tmp/setup_db.sql
    else
        echo -e "${RED}❌ Cannot connect to PostgreSQL${NC}"
        echo "Please run: sudo -u postgres psql"
        echo "Then manually create the database and user"
        exit 1
    fi
    
    rm -f /tmp/setup_db.sql
fi

echo -e "${GREEN}✅ Database user and database created${NC}"

# Now run our schema
echo -e "${YELLOW}Creating database schema...${NC}"
export PGPASSWORD='root123'
if psql -h localhost -U loan_app_user -d loan_prediction_dev -f schema.sql; then
    echo -e "${GREEN}✅ Schema created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create schema${NC}"
    exit 1
fi

# Insert sample data
echo -e "${YELLOW}Inserting sample data...${NC}"
if psql -h localhost -U loan_app_user -d loan_prediction_dev -f sample_data.sql; then
    echo -e "${GREEN}✅ Sample data inserted${NC}"
else
    echo -e "${YELLOW}⚠️ Sample data insertion failed (schema is still valid)${NC}"
fi

# Create .env file
echo -e "${YELLOW}Creating .env.dev file...${NC}"
cat > ../.env.dev <<EOF
# Database Configuration for dev environment
DATABASE_URL=postgresql://loan_app_user:root123@localhost:5432/loan_prediction_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loan_prediction_dev
DB_USER=loan_app_user
DB_PASSWORD=root123

# Application Settings
NODE_ENV=development
JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
SESSION_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# API Configuration
API_PORT=8000
API_HOST=localhost
CORS_ORIGIN=http://localhost:3000
EOF

echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo "=========================================="
echo -e "${YELLOW}Connection Info:${NC}"
echo "  Database: loan_prediction_dev"
echo "  User: loan_app_user"
echo "  Password: root123"
echo "  Connection: postgresql://loan_app_user:root123@localhost:5432/loan_prediction_dev"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Install Node.js dependencies: npm install pg bcrypt jsonwebtoken dotenv"
echo "2. Test connection with: psql -h localhost -U loan_app_user -d loan_prediction_dev"
echo "3. Use the .env.dev file in your application"

unset PGPASSWORD