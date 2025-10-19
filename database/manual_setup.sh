#!/bin/bash

# Manual Database Setup - Run these commands step by step

echo "🗄️ Manual PostgreSQL Setup Instructions"
echo "======================================="
echo ""
echo "Since we're in a codespace, let's set up the database manually."
echo "Please run these commands one by one:"
echo ""

echo "1. First, let's configure PostgreSQL to allow local connections:"
echo "   sudo sed -i \"s/#local   all             all                                     peer/local   all             all                                     trust/\" /etc/postgresql/16/main/pg_hba.conf"
echo ""

echo "2. Restart PostgreSQL:"
echo "   sudo service postgresql restart"
echo ""

echo "3. Now you can connect without a password:"
echo "   psql -U postgres postgres"
echo ""

echo "4. In the PostgreSQL prompt, run these commands:"
echo "   CREATE USER loan_app_user WITH PASSWORD 'root123' CREATEDB;"
echo "   CREATE DATABASE loan_prediction_dev OWNER loan_app_user;"
echo "   GRANT ALL PRIVILEGES ON DATABASE loan_prediction_dev TO loan_app_user;"
echo "   \\q"
echo ""

echo "5. Test the connection:"
echo "   psql -h localhost -U loan_app_user -d loan_prediction_dev"
echo "   (use password: root123)"
echo ""

echo "6. If that works, run our schema:"
echo "   export PGPASSWORD='root123'"
echo "   psql -h localhost -U loan_app_user -d loan_prediction_dev -f schema.sql"
echo "   psql -h localhost -U loan_app_user -d loan_prediction_dev -f sample_data.sql"
echo ""

echo "Alternatively, I can create a simple script to do all this..."

# Let's try to do it automatically
echo ""
echo "🤖 Attempting automatic setup..."

# First, let's try to modify pg_hba.conf to allow trust authentication
if [ -w /etc/postgresql/16/main/pg_hba.conf ]; then
    echo "Modifying PostgreSQL authentication..."
    sudo sed -i 's/local   all             all                                     peer/local   all             all                                     trust/' /etc/postgresql/16/main/pg_hba.conf
    sudo service postgresql restart
    sleep 2
    
    echo "Creating database and user..."
    psql -U postgres postgres <<EOF
CREATE USER loan_app_user WITH PASSWORD 'root123' CREATEDB;
CREATE DATABASE loan_prediction_dev OWNER loan_app_user;
GRANT ALL PRIVILEGES ON DATABASE loan_prediction_dev TO loan_app_user;
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ Database setup successful!"
        
        # Run schema
        export PGPASSWORD='root123'
        psql -h localhost -U loan_app_user -d loan_prediction_dev -f schema.sql
        psql -h localhost -U loan_app_user -d loan_prediction_dev -f sample_data.sql
        
        # Create .env file
        cat > ../.env.dev <<EOF
DATABASE_URL=postgresql://loan_app_user:root123@localhost:5432/loan_prediction_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loan_prediction_dev
DB_USER=loan_app_user
DB_PASSWORD=root123
NODE_ENV=development
API_PORT=8000
EOF
        
        echo "🎉 Complete! Your database is ready to use."
        echo "Connection: postgresql://loan_app_user:root123@localhost:5432/loan_prediction_dev"
    else
        echo "❌ Automatic setup failed. Please follow the manual steps above."
    fi
else
    echo "ℹ️ Need to run manual steps. Copy and paste the commands above."
fi