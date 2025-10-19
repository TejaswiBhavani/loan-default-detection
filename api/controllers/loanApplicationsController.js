/**
 * Loan Applications Controller
 * Handles loan application submissions and management
 */

const { query, transaction } = require('../config/database');

/**
 * Create Loan Application
 * POST /api/loan-applications
 */
const createLoanApplication = async (req, res, next) => {
  try {
    const { applicant_id, loan_amount, loan_purpose, loan_term_months, requested_interest_rate, priority_level, applicant_notes } = req.body;

    // Verify applicant exists
    const applicantCheck = await query(
      'SELECT id, annual_income FROM applicants WHERE id = $1',
      [applicant_id]
    );

    if (applicantCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Applicant not found.',
      });
    }

    const result = await query(
      `INSERT INTO loan_applications (
        applicant_id, loan_amount, loan_purpose, loan_term_months,
        requested_interest_rate, priority_level, applicant_notes,
        status, submitted_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      RETURNING *`,
      [
        applicant_id,
        loan_amount,
        loan_purpose,
        loan_term_months,
        requested_interest_rate || null,
        priority_level || 3,
        applicant_notes || null,
        'submitted',
        req.user.id,
      ]
    );

    // Log the action
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values, ip_address, user_agent, request_method, request_path, response_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        req.user.id,
        'create',
        'loan_applications',
        result.rows[0].id,
        JSON.stringify({ loan_amount, loan_purpose }),
        req.ip,
        req.get('user-agent'),
        'POST',
        '/api/loan-applications',
        201,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Loan application created successfully',
      data: {
        application: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Loan Application by ID
 * GET /api/loan-applications/:id
 */
const getLoanApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        la.*,
        a.first_name, a.last_name, a.email, a.application_number,
        a.annual_income, a.credit_score, a.employment_status,
        lo.first_name as loan_officer_first_name,
        lo.last_name as loan_officer_last_name,
        uw.first_name as underwriter_first_name,
        uw.last_name as underwriter_last_name
       FROM loan_applications la
       JOIN applicants a ON la.applicant_id = a.id
       LEFT JOIN users lo ON la.assigned_loan_officer = lo.id
       LEFT JOIN users uw ON la.assigned_underwriter = uw.id
       WHERE la.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Loan application not found.',
      });
    }

    res.json({
      success: true,
      data: {
        application: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Loan Applications with Filtering
 * GET /api/loan-applications
 */
const getAllLoanApplications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const priority = req.query.priority;

    let whereClause = [];
    let params = [];
    let paramCount = 1;

    if (status) {
      whereClause.push(`la.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (priority) {
      whereClause.push(`la.priority_level = $${paramCount}`);
      params.push(priority);
      paramCount++;
    }

    const whereString = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM loan_applications la ${whereString}`;
    const countResult = await query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated results
    params.push(limit, offset);
    const dataQuery = `
      SELECT 
        la.*,
        a.first_name, a.last_name, a.application_number, a.credit_score
      FROM loan_applications la
      JOIN applicants a ON la.applicant_id = a.id
      ${whereString}
      ORDER BY la.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const result = await query(dataQuery, params);

    res.json({
      success: true,
      data: {
        applications: result.rows,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Loan Application Status
 * PATCH /api/loan-applications/:id/status
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, decision_reason, assigned_loan_officer, assigned_underwriter } = req.body;

    // Check if application exists
    const checkResult = await query(
      'SELECT * FROM loan_applications WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Loan application not found.',
      });
    }

    const oldStatus = checkResult.rows[0].status;
    let updateQuery = 'UPDATE loan_applications SET status = $1, updated_at = NOW()';
    const params = [status];
    let paramCount = 2;

    if (decision_reason) {
      updateQuery += `, decision_reason = $${paramCount}`;
      params.push(decision_reason);
      paramCount++;
    }

    if (assigned_loan_officer) {
      updateQuery += `, assigned_loan_officer = $${paramCount}`;
      params.push(assigned_loan_officer);
      paramCount++;
    }

    if (assigned_underwriter) {
      updateQuery += `, assigned_underwriter = $${paramCount}`;
      params.push(assigned_underwriter);
      paramCount++;
    }

    if (status === 'approved' || status === 'rejected') {
      updateQuery += `, decision_at = NOW()`;
    }

    if (status === 'under_review') {
      updateQuery += `, reviewed_at = NOW()`;
    }

    params.push(id);
    updateQuery += ` WHERE id = $${paramCount} RETURNING *`;

    const result = await query(updateQuery, params);

    // Log the action
    const action = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'update';
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, request_method, request_path, response_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        req.user.id,
        action,
        'loan_applications',
        id,
        JSON.stringify({ status: oldStatus }),
        JSON.stringify({ status }),
        req.ip,
        req.get('user-agent'),
        'PATCH',
        `/api/loan-applications/${id}/status`,
        200,
      ]
    );

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        application: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Loan Application
 * DELETE /api/loan-applications/:id
 */
const deleteLoanApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if application exists
    const checkResult = await query(
      'SELECT * FROM loan_applications WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Loan application not found.',
      });
    }

    // Only allow deletion of draft or cancelled applications
    if (!['draft', 'cancelled'].includes(checkResult.rows[0].status)) {
      return res.status(400).json({
        success: false,
        error: 'Only draft or cancelled applications can be deleted.',
      });
    }

    await query('DELETE FROM loan_applications WHERE id = $1', [id]);

    // Log the action
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, ip_address, user_agent, request_method, request_path, response_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        req.user.id,
        'delete',
        'loan_applications',
        id,
        JSON.stringify(checkResult.rows[0]),
        req.ip,
        req.get('user-agent'),
        'DELETE',
        `/api/loan-applications/${id}`,
        200,
      ]
    );

    res.json({
      success: true,
      message: 'Loan application deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLoanApplication,
  getLoanApplicationById,
  getAllLoanApplications,
  updateApplicationStatus,
  deleteLoanApplication,
};
