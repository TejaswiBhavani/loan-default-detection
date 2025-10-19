/**
 * Dashboard Controller
 * Handles analytics and dashboard metrics
 */

const { query } = require('../config/database');

/**
 * Get Dashboard Overview
 * GET /api/dashboard
 */
const getDashboardOverview = async (req, res, next) => {
  try {
    // Get metrics from the database view
    const metricsResult = await query('SELECT * FROM dashboard_metrics');
    const metrics = metricsResult.rows[0] || {};

    // Get risk analysis
    const riskResult = await query('SELECT * FROM risk_analysis ORDER BY risk_category');
    
    // Get recent applications
    const recentAppsResult = await query(
      `SELECT 
        la.id, la.status, la.loan_amount, la.created_at,
        a.first_name, a.last_name, a.application_number
       FROM loan_applications la
       JOIN applicants a ON la.applicant_id = a.id
       ORDER BY la.created_at DESC
       LIMIT 10`
    );

    // Get status distribution
    const statusDistResult = await query(
      `SELECT status, COUNT(*) as count
       FROM loan_applications
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY status`
    );

    // Get daily application trends (last 7 days)
    const trendsResult = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as applications,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM loan_applications
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );

    // Get top loan officers by applications processed
    const topOfficersResult = await query(
      `SELECT 
        u.first_name, u.last_name, u.id,
        COUNT(la.id) as applications_handled,
        COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approved_count
       FROM users u
       LEFT JOIN loan_applications la ON u.id = la.assigned_loan_officer
       WHERE u.role = 'loan_officer' 
         AND la.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY u.id, u.first_name, u.last_name
       ORDER BY applications_handled DESC
       LIMIT 5`
    );

    // Get average processing time
    const processingTimeResult = await query(
      `SELECT AVG(processing_time_ms) as avg_processing_time
       FROM predictions
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
         AND status = 'completed'`
    );

    res.json({
      success: true,
      data: {
        overview: {
          total_applications: metrics.total_applications || 0,
          approved_count: metrics.approved_count || 0,
          rejected_count: metrics.rejected_count || 0,
          pending_count: metrics.pending_count || 0,
          approval_rate: metrics.approval_rate_percent || 0,
          avg_loan_amount: metrics.avg_loan_amount || 0,
          total_approved_amount: metrics.total_approved_amount || 0,
        },
        risk_distribution: riskResult.rows,
        status_distribution: statusDistResult.rows,
        recent_applications: recentAppsResult.rows,
        trends: trendsResult.rows,
        top_loan_officers: topOfficersResult.rows,
        avg_processing_time_ms: processingTimeResult.rows[0]?.avg_processing_time || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Risk Analytics
 * GET /api/dashboard/risk-analytics
 */
const getRiskAnalytics = async (req, res, next) => {
  try {
    const timeRange = req.query.range || '30'; // days

    // Get risk distribution over time
    const riskTrendsResult = await query(
      `SELECT 
        DATE(p.created_at) as date,
        p.risk_category,
        COUNT(*) as count,
        AVG(p.risk_score) as avg_risk_score
       FROM predictions p
       WHERE p.created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeRange)} days'
         AND p.status = 'completed'
       GROUP BY DATE(p.created_at), p.risk_category
       ORDER BY date DESC, risk_category`
    );

    // Get risk score distribution
    const scoreDistResult = await query(
      `SELECT 
        CASE 
          WHEN risk_score < 0.2 THEN '0.0-0.2'
          WHEN risk_score < 0.4 THEN '0.2-0.4'
          WHEN risk_score < 0.6 THEN '0.4-0.6'
          WHEN risk_score < 0.8 THEN '0.6-0.8'
          ELSE '0.8-1.0'
        END as score_range,
        COUNT(*) as count
       FROM predictions
       WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeRange)} days'
         AND status = 'completed'
       GROUP BY score_range
       ORDER BY score_range`
    );

    // Get most important features
    const topFeaturesResult = await query(
      `SELECT 
        feature_name,
        display_name,
        AVG(importance_score) as avg_importance,
        COUNT(*) as frequency
       FROM prediction_features
       WHERE prediction_id IN (
         SELECT id FROM predictions 
         WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeRange)} days'
       )
       GROUP BY feature_name, display_name
       ORDER BY avg_importance DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        risk_trends: riskTrendsResult.rows,
        score_distribution: scoreDistResult.rows,
        top_features: topFeaturesResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Loan Purpose Analytics
 * GET /api/dashboard/loan-purpose-analytics
 */
const getLoanPurposeAnalytics = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
        la.loan_purpose,
        COUNT(*) as total_applications,
        AVG(la.loan_amount) as avg_loan_amount,
        SUM(CASE WHEN la.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN la.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        ROUND(
          SUM(CASE WHEN la.status = 'approved' THEN 1 ELSE 0 END)::DECIMAL / 
          NULLIF(COUNT(*), 0) * 100, 
          2
        ) as approval_rate
       FROM loan_applications la
       WHERE la.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY la.loan_purpose
       ORDER BY total_applications DESC`
    );

    res.json({
      success: true,
      data: {
        loan_purposes: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get User Activity Stats
 * GET /api/dashboard/user-activity
 */
const getUserActivityStats = async (req, res, next) => {
  try {
    // Get login activity
    const loginActivityResult = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as login_count,
        COUNT(DISTINCT user_id) as unique_users
       FROM audit_logs
       WHERE action = 'login'
         AND created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );

    // Get action distribution
    const actionDistResult = await query(
      `SELECT 
        action,
        COUNT(*) as count
       FROM audit_logs
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY action
       ORDER BY count DESC`
    );

    // Get most active users
    const activeUsersResult = await query(
      `SELECT 
        u.first_name, u.last_name, u.role,
        COUNT(al.id) as action_count
       FROM users u
       JOIN audit_logs al ON u.id = al.user_id
       WHERE al.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY u.id, u.first_name, u.last_name, u.role
       ORDER BY action_count DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        login_activity: loginActivityResult.rows,
        action_distribution: actionDistResult.rows,
        active_users: activeUsersResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Dashboard Data
 * GET /api/dashboard/export
 */
const exportDashboardData = async (req, res, next) => {
  try {
    const format = req.query.format || 'json';
    const dataType = req.query.type || 'applications';

    let result;

    switch (dataType) {
      case 'applications':
        result = await query(
          `SELECT 
            la.*,
            a.first_name, a.last_name, a.email, a.application_number
           FROM loan_applications la
           JOIN applicants a ON la.applicant_id = a.id
           WHERE la.created_at >= CURRENT_DATE - INTERVAL '30 days'
           ORDER BY la.created_at DESC`
        );
        break;
      
      case 'predictions':
        result = await query(
          `SELECT 
            p.*, la.loan_amount, a.application_number
           FROM predictions p
           JOIN loan_applications la ON p.loan_application_id = la.id
           JOIN applicants a ON la.applicant_id = a.id
           WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days'
           ORDER BY p.created_at DESC`
        );
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid data type.',
        });
    }

    // Log export action
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, request_method, request_path, response_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [req.user.id, 'export', dataType, req.ip, req.get('user-agent'), 'GET', '/api/dashboard/export', 200]
    );

    if (format === 'csv') {
      // Convert to CSV (simplified)
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No data to export.',
        });
      }

      const headers = Object.keys(result.rows[0]);
      const csvRows = [headers.join(',')];
      
      result.rows.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
      });

      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', `attachment; filename="${dataType}_export_${Date.now()}.csv"`);
      res.send(csvRows.join('\n'));
    } else {
      // Return JSON
      res.json({
        success: true,
        data: {
          records: result.rows,
          count: result.rows.length,
          exported_at: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardOverview,
  getRiskAnalytics,
  getLoanPurposeAnalytics,
  getUserActivityStats,
  exportDashboardData,
};
