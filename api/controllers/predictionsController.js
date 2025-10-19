/**
 * Predictions Controller
 * Handles ML prediction requests and results storage
 */

const axios = require('axios');
const { query } = require('../config/database');
const mlPredictionService = require('../services/mlPredictionService');

/**
 * Create Prediction for Loan Application
 * POST /api/predictions
 */
const createPrediction = async (req, res, next) => {
  try {
    const { loan_application_id, features } = req.body;

    // Verify loan application exists
    const appCheck = await query(
      `SELECT la.*, a.* 
       FROM loan_applications la
       JOIN applicants a ON la.applicant_id = a.id
       WHERE la.id = $1`,
      [loan_application_id]
    );

    if (appCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Loan application not found.',
      });
    }

    const application = appCheck.rows[0];

    // Get active model version
    const modelResult = await query(
      `SELECT id, version_number FROM model_versions 
       WHERE is_active = true AND is_production = true 
       ORDER BY created_at DESC LIMIT 1`
    );

    if (modelResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'No active model version found.',
      });
    }

    const modelVersion = modelResult.rows[0];
    const startTime = Date.now();

    // Call Python ML service with real trained model
    let prediction_result;
    
    try {
      // Transform applicant data to ML service format
      const mlInput = mlPredictionService.transformApplicantData(application);
      
      console.log('📊 Calling ML prediction service...');
      
      // Make prediction using ML service
      prediction_result = await mlPredictionService.predict(mlInput);
      
      console.log(`✓ Prediction completed: risk_score=${prediction_result.risk_score.toFixed(3)}, category=${prediction_result.risk_category}`);
      
      // Check if fallback was used
      if (prediction_result.fallback) {
        console.warn('⚠️ Fallback prediction was used');
      }
      
    } catch (mlError) {
      console.error('ML Service Error:', mlError.message);
      
      // Save failed prediction
      await query(
        `INSERT INTO predictions (
          loan_application_id, model_version_id, status, error_message, created_by
        ) VALUES ($1, $2, $3, $4, $5)`,
        [loan_application_id, modelVersion.id, 'failed', mlError.message, req.user.id]
      );

      return res.status(500).json({
        success: false,
        error: 'ML prediction service failed.',
        details: process.env.NODE_ENV === 'development' ? mlError.message : undefined,
      });
    }

    const processingTime = Date.now() - startTime;

    // Use risk category from ML service (already calculated there)
    const risk_category = prediction_result.risk_category;

    // Determine recommendation based on risk category
    let recommendation;
    if (risk_category === 'low') {
      recommendation = 'approve';
    } else if (risk_category === 'high') {
      recommendation = 'reject';
    } else {
      recommendation = 'review';
    }

    // Save prediction to database
    const predictionResult = await query(
      `INSERT INTO predictions (
        loan_application_id, model_version_id, risk_score, risk_category,
        confidence_score, recommendation, feature_importance, input_features,
        status, processing_time_ms, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        loan_application_id,
        modelVersion.id,
        prediction_result.risk_score,
        risk_category,
        prediction_result.confidence_score,
        recommendation,
        JSON.stringify(prediction_result.feature_importance || []),
        JSON.stringify(prediction_result.prediction !== undefined ? {
          model_input: prediction_result.model_input || {},
          prediction: prediction_result.prediction,
          fallback_used: prediction_result.fallback || false
        } : features),
        'completed',
        processingTime,
        req.user.id,
      ]
    );

    // Save feature importance details
    if (prediction_result.feature_importance && Array.isArray(prediction_result.feature_importance)) {
      for (const feature of prediction_result.feature_importance) {
        await query(
          `INSERT INTO prediction_features (
            prediction_id, feature_name, feature_value, importance_score,
            impact_direction, display_name
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            predictionResult.rows[0].id,
            feature.feature || feature.name || feature.feature_name,  // Handle multiple formats
            feature.value || null,
            feature.importance || feature.importance_score,
            feature.impact || feature.impact_direction || 'neutral',
            feature.display_name || feature.feature || feature.name,
          ]
        );
      }
    }

    // Log the action
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values, ip_address, user_agent, request_method, request_path, response_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        req.user.id,
        'predict',
        'predictions',
        predictionResult.rows[0].id,
        JSON.stringify({ risk_score: prediction_result.risk_score, recommendation }),
        req.ip,
        req.get('user-agent'),
        'POST',
        '/api/predictions',
        201,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Prediction created successfully',
      data: {
        prediction: predictionResult.rows[0],
        modelVersion: modelVersion.version_number,
        processingTime: `${processingTime}ms`,
        fallbackUsed: prediction_result.fallback || false,
        mlServiceAvailable: !prediction_result.fallback,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Prediction by ID
 * GET /api/predictions/:id
 */
const getPredictionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        p.*,
        la.loan_amount, la.loan_purpose, la.loan_term_months,
        a.first_name, a.last_name, a.application_number,
        mv.version_number as model_version
       FROM predictions p
       JOIN loan_applications la ON p.loan_application_id = la.id
       JOIN applicants a ON la.applicant_id = a.id
       JOIN model_versions mv ON p.model_version_id = mv.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prediction not found.',
      });
    }

    // Get feature importance details
    const featuresResult = await query(
      'SELECT * FROM prediction_features WHERE prediction_id = $1 ORDER BY importance_score DESC',
      [id]
    );

    res.json({
      success: true,
      data: {
        prediction: result.rows[0],
        features: featuresResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Predictions for Loan Application
 * GET /api/predictions/application/:applicationId
 */
const getPredictionsByApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const result = await query(
      `SELECT p.*, mv.version_number as model_version
       FROM predictions p
       JOIN model_versions mv ON p.model_version_id = mv.id
       WHERE p.loan_application_id = $1
       ORDER BY p.created_at DESC`,
      [applicationId]
    );

    res.json({
      success: true,
      data: {
        predictions: result.rows,
        count: result.rows.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Recent Predictions
 * GET /api/predictions/recent
 */
const getRecentPredictions = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await query(
      `SELECT 
        p.id, p.risk_score, p.risk_category, p.confidence_score, 
        p.recommendation, p.created_at, p.processing_time_ms,
        la.loan_amount, la.loan_purpose,
        a.first_name, a.last_name, a.application_number
       FROM predictions p
       JOIN loan_applications la ON p.loan_application_id = la.id
       JOIN applicants a ON la.applicant_id = a.id
       WHERE p.status = 'completed'
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: {
        predictions: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrediction,
  getPredictionById,
  getPredictionsByApplication,
  getRecentPredictions,
};
