const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000
});

const app = express();
app.use(cors());
app.use(express.json());

// Middleware for authentication
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const client = await pool.connect();
        const result = await client.query(
            'SELECT u.*, s.id as session_id FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE u.id = $1 AND s.session_token = $2 AND s.is_active = true AND s.expires_at > NOW()',
            [decoded.userId, token]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
        
        req.user = result.rows[0];
        client.release();
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({ success: false, message: 'Invalid token' });
    }
};

// Audit logging middleware
const logAudit = async (userId, action, resourceType, resourceId, oldValues, newValues, req) => {
    try {
        const client = await pool.connect();
        await client.query(`
            INSERT INTO audit_logs (
                user_id, action, resource_type, resource_id, 
                old_values, new_values, ip_address, user_agent,
                request_method, request_path, response_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
            userId, action, resourceType, resourceId,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null,
            req.ip, req.get('User-Agent'),
            req.method, req.path, 200
        ]);
        client.release();
    } catch (error) {
        console.error('Audit logging error:', error);
    }
};

// ==============================================================================
// AUTHENTICATION ENDPOINTS
// ==============================================================================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    try {
        const client = await pool.connect();
        
        // Get user by username or email
        const userResult = await client.query(
            'SELECT * FROM users WHERE (username = $1 OR email = $1) AND is_active = true',
            [username]
        );

        if (userResult.rows.length === 0) {
            client.release();
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = userResult.rows[0];
        
        // Verify password (assuming passwords are hashed with bcrypt)
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            client.release();
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Create session
        const sessionResult = await client.query(`
            INSERT INTO user_sessions (
                user_id, session_token, ip_address, user_agent, expires_at
            ) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
            RETURNING id
        `, [user.id, token, req.ip, req.get('User-Agent')]);

        // Update last login
        await client.query(
            'UPDATE users SET last_login_at = NOW() WHERE id = $1',
            [user.id]
        );

        client.release();

        // Log authentication
        await logAudit(user.id, 'login', 'user_sessions', sessionResult.rows[0].id, null, { login_time: new Date() }, req);

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    department: user.department
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ==============================================================================
// DASHBOARD ENDPOINTS
// ==============================================================================

// Get dashboard metrics
app.get('/api/dashboard/metrics', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        
        const metricsResult = await client.query('SELECT * FROM dashboard_metrics');
        const metrics = metricsResult.rows[0] || {};
        
        // Additional real-time metrics
        const additionalMetrics = await client.query(`
            SELECT 
                COUNT(CASE WHEN p.risk_category = 'low' THEN 1 END) as low_risk_count,
                COUNT(CASE WHEN p.risk_category = 'medium' THEN 1 END) as medium_risk_count,
                COUNT(CASE WHEN p.risk_category = 'high' THEN 1 END) as high_risk_count,
                AVG(p.risk_score) as avg_risk_score,
                AVG(p.confidence_score) as avg_confidence
            FROM predictions p
            WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days'
        `);

        client.release();

        res.json({
            success: true,
            data: {
                ...metrics,
                ...additionalMetrics.rows[0],
                last_updated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Dashboard metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard metrics'
        });
    }
});

// ==============================================================================
// APPLICANT ENDPOINTS
// ==============================================================================

// Create new applicant
app.post('/api/applicants', authenticateToken, async (req, res) => {
    const applicantData = req.body;
    
    try {
        const client = await pool.connect();
        
        // Generate application number
        const appNumberResult = await client.query(
            "SELECT 'APP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((COALESCE(MAX(SUBSTRING(application_number FROM 10)::INTEGER), 0) + 1)::TEXT, 3, '0') as app_number FROM applicants WHERE application_number LIKE 'APP-' || TO_CHAR(NOW(), 'YYYY') || '-%'"
        );
        
        const applicationNumber = appNumberResult.rows[0]?.app_number || `APP-${new Date().getFullYear()}-001`;

        // Insert applicant
        const result = await client.query(`
            INSERT INTO applicants (
                application_number, first_name, last_name, date_of_birth,
                email, phone, address_line_1, address_line_2, city, state, zip_code,
                employment_status, employer_name, job_title, employment_length_years,
                annual_income, education_level, existing_debts, assets_value,
                savings_account_balance, credit_score, credit_history_length_years,
                number_of_credit_inquiries, number_of_open_accounts,
                payment_history_score, home_ownership, years_at_current_address,
                created_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
            ) RETURNING *
        `, [
            applicationNumber, applicantData.first_name, applicantData.last_name,
            applicantData.date_of_birth, applicantData.email, applicantData.phone,
            applicantData.address_line_1, applicantData.address_line_2,
            applicantData.city, applicantData.state, applicantData.zip_code,
            applicantData.employment_status, applicantData.employer_name,
            applicantData.job_title, applicantData.employment_length_years,
            applicantData.annual_income, applicantData.education_level,
            applicantData.existing_debts, applicantData.assets_value,
            applicantData.savings_account_balance, applicantData.credit_score,
            applicantData.credit_history_length_years, applicantData.number_of_credit_inquiries,
            applicantData.number_of_open_accounts, applicantData.payment_history_score,
            applicantData.home_ownership, applicantData.years_at_current_address,
            req.user.id
        ]);

        client.release();

        await logAudit(req.user.id, 'create', 'applicants', result.rows[0].id, null, applicantData, req);

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create applicant error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create applicant'
        });
    }
});

// ==============================================================================
// PREDICTION ENDPOINTS
// ==============================================================================

// Single prediction endpoint (integrated with ML model)
app.post('/api/predict/single', authenticateToken, async (req, res) => {
    const { applicantId, loanApplicationId } = req.body;
    
    try {
        const client = await pool.connect();
        
        // Get application data for prediction
        const appResult = await client.query(`
            SELECT 
                a.*, la.loan_amount, la.loan_purpose, la.loan_term_months,
                la.loan_to_income_ratio
            FROM loan_applications la
            JOIN applicants a ON la.applicant_id = a.id
            WHERE la.id = $1
        `, [loanApplicationId]);

        if (appResult.rows.length === 0) {
            client.release();
            return res.status(404).json({
                success: false,
                message: 'Loan application not found'
            });
        }

        const applicationData = appResult.rows[0];
        
        // Get active model version
        const modelResult = await client.query(
            'SELECT * FROM model_versions WHERE is_active = true LIMIT 1'
        );

        if (modelResult.rows.length === 0) {
            client.release();
            return res.status(500).json({
                success: false,
                message: 'No active ML model found'
            });
        }

        const modelVersion = modelResult.rows[0];

        // TODO: Integrate your existing ML model prediction logic here
        // This is where you would call your joblib model
        const startTime = Date.now();
        
        // Simulate ML prediction (replace with actual model call)
        const mockPrediction = {
            risk_score: Math.random() * 0.8 + 0.1, // 0.1 to 0.9
            confidence_score: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
            feature_importance: [
                { feature: 'credit_score', importance: 0.35, impact_direction: 'positive' },
                { feature: 'annual_income', importance: 0.25, impact_direction: 'positive' },
                { feature: 'debt_to_income_ratio', importance: 0.20, impact_direction: 'negative' }
            ]
        };
        
        const processingTime = Date.now() - startTime;
        
        // Determine risk category and recommendation
        let riskCategory, recommendation;
        if (mockPrediction.risk_score <= 0.3) {
            riskCategory = 'low';
            recommendation = 'approve';
        } else if (mockPrediction.risk_score <= 0.7) {
            riskCategory = 'medium'; 
            recommendation = 'review';
        } else {
            riskCategory = 'high';
            recommendation = 'reject';
        }

        // Store prediction in database
        const predictionResult = await client.query(`
            INSERT INTO predictions (
                loan_application_id, model_version_id, risk_score, risk_category,
                confidence_score, recommendation, feature_importance, input_features,
                status, processing_time_ms, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            loanApplicationId, modelVersion.id, mockPrediction.risk_score, riskCategory,
            mockPrediction.confidence_score, recommendation,
            JSON.stringify(mockPrediction.feature_importance),
            JSON.stringify({
                credit_score: applicationData.credit_score,
                annual_income: applicationData.annual_income,
                loan_amount: applicationData.loan_amount,
                debt_to_income_ratio: applicationData.debt_to_income_ratio
            }),
            'completed', processingTime, req.user.id
        ]);

        // Store detailed feature importance
        for (const feature of mockPrediction.feature_importance) {
            await client.query(`
                INSERT INTO prediction_features (
                    prediction_id, feature_name, feature_value, importance_score,
                    impact_direction, display_name
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                predictionResult.rows[0].id, feature.feature, 
                applicationData[feature.feature], feature.importance,
                feature.impact_direction, feature.feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            ]);
        }

        client.release();

        await logAudit(req.user.id, 'predict', 'predictions', predictionResult.rows[0].id, null, { risk_score: mockPrediction.risk_score, recommendation }, req);

        res.json({
            success: true,
            data: {
                ...predictionResult.rows[0],
                feature_details: mockPrediction.feature_importance,
                model_version: modelVersion.version_number
            }
        });

    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate prediction'
        });
    }
});

// ==============================================================================
// HISTORY ENDPOINTS
// ==============================================================================

// Get prediction history with filtering and pagination
app.get('/api/predictions/history', authenticateToken, async (req, res) => {
    const {
        page = 1,
        limit = 20,
        risk_category,
        recommendation,
        date_from,
        date_to,
        search
    } = req.query;

    try {
        const client = await pool.connect();
        
        let whereClause = 'WHERE 1=1';
        let params = [];
        let paramCount = 0;

        // Apply filters
        if (risk_category) {
            whereClause += ` AND p.risk_category = $${++paramCount}`;
            params.push(risk_category);
        }
        
        if (recommendation) {
            whereClause += ` AND p.recommendation = $${++paramCount}`;
            params.push(recommendation);
        }
        
        if (date_from) {
            whereClause += ` AND p.created_at >= $${++paramCount}`;
            params.push(date_from);
        }
        
        if (date_to) {
            whereClause += ` AND p.created_at <= $${++paramCount}`;
            params.push(date_to);
        }

        if (search) {
            whereClause += ` AND (a.first_name ILIKE $${++paramCount} OR a.last_name ILIKE $${++paramCount} OR a.application_number ILIKE $${++paramCount})`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
            paramCount += 2; // We added 3 params but only increment by 2 more
        }

        // Get total count
        const countResult = await client.query(`
            SELECT COUNT(*)
            FROM predictions p
            JOIN loan_applications la ON p.loan_application_id = la.id
            JOIN applicants a ON la.applicant_id = a.id
            ${whereClause}
        `, params);

        const totalCount = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalCount / limit);
        const offset = (page - 1) * limit;

        // Get paginated results
        const dataResult = await client.query(`
            SELECT 
                p.*, 
                a.first_name, a.last_name, a.application_number, a.credit_score,
                la.loan_amount, la.loan_purpose, la.status as application_status,
                mv.version_number as model_version
            FROM predictions p
            JOIN loan_applications la ON p.loan_application_id = la.id
            JOIN applicants a ON la.applicant_id = a.id
            JOIN model_versions mv ON p.model_version_id = mv.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${++paramCount} OFFSET $${++paramCount}
        `, [...params, limit, offset]);

        client.release();

        res.json({
            success: true,
            data: dataResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                total_pages: totalPages,
                has_next: page < totalPages,
                has_prev: page > 1
            }
        });

    } catch (error) {
        console.error('Prediction history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prediction history'
        });
    }
});

// ==============================================================================
// ANALYTICS ENDPOINTS
// ==============================================================================

// Get model analytics and performance metrics
app.get('/api/analytics/model-performance', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        
        // Get current model performance
        const modelResult = await client.query(`
            SELECT 
                mv.*,
                COUNT(p.id) as total_predictions,
                AVG(p.confidence_score) as avg_confidence,
                COUNT(CASE WHEN p.risk_category = 'low' THEN 1 END) as low_risk_predictions,
                COUNT(CASE WHEN p.risk_category = 'medium' THEN 1 END) as medium_risk_predictions,
                COUNT(CASE WHEN p.risk_category = 'high' THEN 1 END) as high_risk_predictions
            FROM model_versions mv
            LEFT JOIN predictions p ON mv.id = p.model_version_id
            WHERE mv.is_active = true
            GROUP BY mv.id
        `);

        // Get prediction trends over time
        const trendsResult = await client.query(`
            SELECT 
                DATE_TRUNC('day', created_at) as date,
                COUNT(*) as prediction_count,
                AVG(risk_score) as avg_risk_score,
                AVG(confidence_score) as avg_confidence
            FROM predictions
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE_TRUNC('day', created_at)
            ORDER BY date
        `);

        client.release();

        res.json({
            success: true,
            data: {
                model_info: modelResult.rows[0] || {},
                prediction_trends: trendsResult.rows,
                last_updated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics data'
        });
    }
});

// ==============================================================================
// SERVER STARTUP
// ==============================================================================

const PORT = process.env.API_PORT || 8000;

app.listen(PORT, () => {
    console.log(`🚀 Loan Prediction API Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME || 'Not configured'}`);
    console.log(`🔗 Base URL: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await pool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
});

module.exports = app;