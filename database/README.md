# Database Configuration for Loan Default Prediction System

## 📋 Overview

This directory contains the complete PostgreSQL database schema and setup scripts for the loan default prediction system. The database is designed to replace the current mock data implementation with a robust, production-ready data layer.

## 🗄️ Database Architecture

### Core Tables

#### 👥 **Users & Authentication**
- **`users`** - System users (loan officers, underwriters, admins)
- **`user_sessions`** - Session management and security tracking

#### 👤 **Applicant Management** 
- **`applicants`** - Comprehensive applicant profiles
- **`loan_applications`** - Loan application details and workflow

#### 🤖 **ML Predictions**
- **`predictions`** - Model predictions and risk assessments  
- **`prediction_features`** - Detailed feature importance analysis
- **`model_versions`** - ML model versioning and performance tracking

#### 📋 **Audit & Compliance**
- **`audit_logs`** - Complete audit trail for compliance

### Key Features

✅ **Enterprise Security**
- UUID primary keys for all tables
- Password hashing support
- Session-based authentication
- Complete audit logging
- IP address and user agent tracking

✅ **Financial Data Integrity**
- Proper decimal types for financial calculations
- Generated columns for computed ratios
- Comprehensive constraints and validations
- Risk categorization (low/medium/high)

✅ **ML Model Management**
- Model versioning with performance metrics
- Feature importance tracking
- Prediction confidence scoring
- Model deployment lifecycle

✅ **Performance Optimization**
- Strategic indexes on all query columns
- Efficient foreign key relationships
- Optimized views for common queries
- Connection pooling configuration

## 🚀 Quick Setup

### Prerequisites
```bash
# Ensure PostgreSQL is installed and running
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Automated Setup
```bash
# Navigate to database directory
cd database

# Run setup script (creates database, schema, and sample data)
./setup_database.sh dev    # for development
./setup_database.sh test   # for testing  
./setup_database.sh prod   # for production
```

### Manual Setup
```bash
# 1. Create database and user
sudo -u postgres createdb loan_prediction_dev
sudo -u postgres createuser loan_app_user

# 2. Run schema creation
psql -U loan_app_user -d loan_prediction_dev -f schema.sql

# 3. Insert sample data (optional)
psql -U loan_app_user -d loan_prediction_dev -f sample_data.sql
```

## 📁 Files Structure

```
database/
├── 📄 schema.sql              # Complete database schema
├── 📄 sample_data.sql         # Sample data for testing
├── 🔧 setup_database.sh      # Automated setup script
├── 📋 README.md              # This file
├── 📄 migrations/            # Future database migrations
└── 📄 backups/              # Database backup scripts
```

## 🔧 Configuration

After running the setup script, you'll get an environment file (`.env.dev`, `.env.test`, or `.env.prod`) with:

```env
# Database Connection
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loan_prediction_dev
DB_USER=loan_app_user
DB_PASSWORD=generated_secure_password

# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000

# Application Settings
NODE_ENV=development
JWT_SECRET=generated_jwt_secret
SESSION_SECRET=generated_session_secret
```

## 🔗 Integration with Existing Code

### Backend API Updates Needed

Replace your current `mock-api.js` with database-connected endpoints:

```javascript
// Example: Updated prediction endpoint
app.post('/api/predict/single', async (req, res) => {
  const client = await pool.connect();
  try {
    // 1. Insert/update applicant data
    const applicant = await client.query(`
      INSERT INTO applicants (...) VALUES (...)
      RETURNING id
    `);
    
    // 2. Create loan application  
    const application = await client.query(`
      INSERT INTO loan_applications (...) VALUES (...)
      RETURNING id
    `);
    
    // 3. Run ML prediction (existing model code)
    const prediction = await runMLModel(applicationData);
    
    // 4. Store prediction results
    await client.query(`
      INSERT INTO predictions (...) VALUES (...)
    `);
    
    res.json({ success: true, data: prediction });
  } finally {
    client.release();
  }
});
```

### Frontend Updates

Your existing React frontend can remain largely unchanged. Just update the API service layer to handle the new data structure:

```typescript
// src/types/index.ts - Update interfaces to match database schema
interface Applicant {
  id: string;
  application_number: string;
  first_name: string;
  last_name: string;
  // ... other fields from database schema
}
```

## 📊 Sample Data

The setup includes realistic sample data:
- **5 users** (admin, loan officers, underwriters)
- **5 applicants** with complete financial profiles  
- **5 loan applications** in various stages
- **5 ML predictions** with feature importance
- **Audit logs** showing system activity

## 🔍 Database Views

Pre-built views for common queries:

```sql
-- Complete application overview
SELECT * FROM loan_applications_complete 
WHERE status = 'submitted';

-- Real-time dashboard metrics  
SELECT * FROM dashboard_metrics;
```

## 🛡️ Security Features

- **Password Hashing**: Support for bcrypt password storage
- **Session Management**: Secure session tokens with expiration
- **Audit Trail**: Complete action logging for compliance
- **Data Validation**: Constraints and checks on all inputs
- **Access Control**: Role-based user permissions

## 📈 Performance Considerations

- **Indexes**: Strategic indexing on query columns
- **Connection Pooling**: Configured for concurrent users
- **Generated Columns**: Automatic ratio calculations
- **Partitioning Ready**: Schema supports future partitioning

## 🔄 Migration Strategy

### From Mock Data to Database

1. **Phase 1**: Set up database alongside existing mock API
2. **Phase 2**: Update API endpoints one by one to use database
3. **Phase 3**: Remove mock data and update frontend
4. **Phase 4**: Add authentication and user management

### Database Migrations

Future schema changes can be managed through migration files:

```bash
# Create new migration
./create_migration.sh "add_user_preferences_table"

# Run pending migrations  
./run_migrations.sh
```

## 🧪 Testing

### Connection Test
```bash
# Test database connectivity
node test_db_connection.js
```

### Data Validation
```bash
# Run validation queries
psql -U loan_app_user -d loan_prediction_dev -c "
  SELECT COUNT(*) as total_users FROM users;
  SELECT COUNT(*) as total_predictions FROM predictions;
"
```

## 🔧 Maintenance

### Backup
```bash
# Create backup
pg_dump -U loan_app_user loan_prediction_dev > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U loan_app_user -d loan_prediction_dev < backup_20241019.sql
```

### Performance Monitoring
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

## 📞 Support

For database setup issues:
1. Check PostgreSQL service status: `sudo systemctl status postgresql`
2. Verify connection: `pg_isready -h localhost -p 5432`
3. Check logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
4. Test connection: `node test_db_connection.js`

---

**Next Steps**: Run `./setup_database.sh dev` to create your database and start integrating with your existing loan prediction system!