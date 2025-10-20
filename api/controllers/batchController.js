/**
 * Batch Processing Controller
 * Handles batch file uploads and prediction processing
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');
const { query, getPool } = require('../config/database');
const mlPredictionService = require('../services/mlPredictionService');

/**
 * Process a batch file upload and create predictions
 */
const uploadBatchFile = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a CSV file'
      });
    }

    const { filename, path: filepath, mimetype, size } = req.file;
    const userId = req.user.id;
    const jobId = uuidv4();

    // Validate file type
    if (!mimetype.includes('csv') && !filename.endsWith('.csv')) {
      // Clean up uploaded file
      fs.unlinkSync(filepath);
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: 'Only CSV files are supported'
      });
    }

    // Validate file size (max 10MB)
    if (size > 10 * 1024 * 1024) {
      fs.unlinkSync(filepath);
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 10MB'
      });
    }

    // Create batch job record
    const jobResult = await query(
      `INSERT INTO batch_jobs 
        (id, user_id, filename, status, total_records) 
       VALUES ($1, $2, $3, 'processing', 0) 
       RETURNING *`,
      [jobId, userId, filename]
    );

    const job = jobResult.rows[0];

    // Start processing file in background
    processBatchFile(jobId, filepath, userId).catch(error => {
      console.error('Batch processing error:', error);
    });

    res.status(202).json({
      success: true,
      message: 'File uploaded successfully. Processing started.',
      data: {
        id: job.id,
        filename: job.filename,
        status: job.status,
        created_at: job.created_at
      }
    });

  } catch (error) {
    console.error('Upload batch file error:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process upload',
      message: error.message
    });
  }
};

/**
 * Process batch file asynchronously
 */
async function processBatchFile(jobId, filepath, userId) {
  const results = [];
  let totalRecords = 0;
  let successCount = 0;
  let errorCount = 0;

  try {
    // Get active model version
    const modelResult = await query(
      `SELECT id, version_number FROM model_versions 
       WHERE is_active = true AND is_production = true 
       ORDER BY created_at DESC LIMIT 1`
    );

    if (modelResult.rows.length === 0) {
      throw new Error('No active model version found');
    }

    const modelVersion = modelResult.rows[0];

    // Parse CSV file
    const parser = fs.createReadStream(filepath).pipe(csv());

    for await (const row of parser) {
      totalRecords++;
      
      try {
        // Generate unique application number
        const applicationNumber = `APP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}${String(totalRecords).padStart(3, '0')}`;
        
        // Create applicant record
        const applicantResult = await query(
          `INSERT INTO applicants 
            (application_number, first_name, last_name, email, phone, annual_income, credit_score, 
             address_line_1, city, state, zip_code, country, employment_status, date_of_birth, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id`,
          [
            applicationNumber,
            row.first_name || 'Unknown',
            row.last_name || 'Unknown',
            row.email || `batch_${jobId}_${totalRecords}@example.com`,
            row.phone || '000-000-0000',
            parseFloat(row.annual_income) || 50000,
            parseInt(row.credit_score) || 650,
            row.address || '123 Main St',
            row.city || 'New York',
            row.state || 'NY',
            row.zip_code || '10001',
            row.country || 'United States',
            row.employment_status || 'employed',
            row.date_of_birth || '1990-01-01',
            userId  // Use the authenticated user's ID
          ]
        );

        const applicantId = applicantResult.rows[0].id;

        // Create loan application
        const loanAppResult = await query(
          `INSERT INTO loan_applications 
            (applicant_id, loan_amount, loan_purpose, loan_term_months, status, created_by)
           VALUES ($1, $2, $3, $4, 'submitted', $5)
           RETURNING id`,
          [
            applicantId,
            parseFloat(row.loan_amount) || 10000,
            row.loan_purpose || 'other',
            parseInt(row.loan_term_months) || 36,
            userId
          ]
        );

        const loanAppId = loanAppResult.rows[0].id;

        // Fetch the full application data for ML prediction
        const appDataResult = await query(
          `SELECT 
            la.*,
            a.first_name, a.last_name, a.date_of_birth, a.email, a.phone,
            a.address_line_1, a.city, a.state, a.zip_code,
            a.employment_status, a.annual_income, a.credit_score,
            a.employment_length_years, a.existing_debts, a.savings_account_balance,
            a.credit_history_length_years, a.number_of_credit_inquiries,
            a.number_of_open_accounts, a.payment_history_score,
            a.home_ownership, a.years_at_current_address
          FROM loan_applications la
          JOIN applicants a ON la.applicant_id = a.id
          WHERE la.id = $1`,
          [loanAppId]
        );

        const applicationData = appDataResult.rows[0];

        // Transform applicant data to ML service format
        const mlInput = mlPredictionService.transformApplicantData(applicationData);

        // Get prediction from ML service
        const prediction = await mlPredictionService.predict(mlInput);

        // Determine recommendation based on risk category
        let recommendation;
        if (prediction.risk_category === 'low') {
          recommendation = 'approve';
        } else if (prediction.risk_category === 'high') {
          recommendation = 'reject';
        } else {
          recommendation = 'review';
        }

        // Store prediction
        await query(
          `INSERT INTO predictions 
            (loan_application_id, model_version_id, risk_score, risk_category, confidence_score, 
             recommendation, feature_importance, input_features, status, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', $9)`,
          [
            loanAppId,
            modelVersion.id,
            prediction.risk_score,
            prediction.risk_category,
            prediction.confidence_score,
            recommendation,
            JSON.stringify(prediction.feature_importance || []),
            JSON.stringify({
              model_input: prediction.model_input || row,
              prediction: prediction.prediction,
              fallback_used: prediction.fallback || false
            }),
            userId
          ]
        );

        successCount++;
        results.push({
          row: totalRecords,
          status: 'success',
          applicant_id: applicantId,
          loan_application_id: loanAppId
        });

      } catch (error) {
        errorCount++;
        results.push({
          row: totalRecords,
          status: 'error',
          error: error.message
        });
        console.error(`Error processing row ${totalRecords}:`, error);
      }
    }

    // Update job status
    await query(
      `UPDATE batch_jobs 
       SET status = 'completed', 
           total_records = $1, 
           processed_records = $2,
           failed_records = $3,
           completed_at = NOW()
       WHERE id = $4`,
      [totalRecords, successCount, errorCount, jobId]
    );

    // Clean up uploaded file
    try {
      fs.unlinkSync(filepath);
    } catch (cleanupError) {
      console.error('File cleanup error:', cleanupError);
    }

    console.log(`Batch job ${jobId} completed: ${successCount}/${totalRecords} successful`);

  } catch (error) {
    console.error('Batch processing error:', error);

    // Update job status to failed
    try {
      await query(
        `UPDATE batch_jobs 
         SET status = 'failed', 
             error_message = $1,
             completed_at = NOW()
         WHERE id = $2`,
        [error.message, jobId]
      );
    } catch (updateError) {
      console.error('Failed to update job status:', updateError);
    }
  }
}

/**
 * Get batch job status
 */
const getBatchJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await query(
      `SELECT id, filename, status, total_records, processed_records, 
              failed_records, created_at, completed_at, error_message
       FROM batch_jobs 
       WHERE id = $1 AND user_id = $2`,
      [jobId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Batch job not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get batch job status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status',
      message: error.message
    });
  }
};

/**
 * Get user's batch jobs
 */
const getUserBatchJobs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, filename, status, total_records, processed_records, 
              failed_records, created_at, completed_at
       FROM batch_jobs 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM batch_jobs WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        jobs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count)
        }
      }
    });

  } catch (error) {
    console.error('Get user batch jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch jobs',
      message: error.message
    });
  }
};

module.exports = {
  uploadBatchFile,
  getBatchJobStatus,
  getUserBatchJobs
};
