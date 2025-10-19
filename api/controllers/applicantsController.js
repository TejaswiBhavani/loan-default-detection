/**
 * Applicants Controller
 * Handles loan applicant operations
 */

const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

/**
 * Create New Applicant
 * POST /api/applicants
 */
const createApplicant = async (req, res, next) => {
  try {
    const applicantData = req.body;

    // Generate unique application number
    const applicationNumber = `APP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const result = await query(
      `INSERT INTO applicants (
        application_number, first_name, last_name, date_of_birth, email, phone,
        address_line_1, address_line_2, city, state, zip_code, country,
        employment_status, employer_name, job_title, employment_length_years,
        annual_income, education_level, existing_debts, assets_value,
        savings_account_balance, credit_score, credit_history_length_years,
        number_of_credit_inquiries, number_of_open_accounts, payment_history_score,
        home_ownership, years_at_current_address, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *`,
      [
        applicationNumber,
        applicantData.first_name,
        applicantData.last_name,
        applicantData.date_of_birth,
        applicantData.email,
        applicantData.phone,
        applicantData.address_line_1,
        applicantData.address_line_2 || null,
        applicantData.city,
        applicantData.state,
        applicantData.zip_code,
        applicantData.country || 'United States',
        applicantData.employment_status,
        applicantData.employer_name || null,
        applicantData.job_title || null,
        applicantData.employment_length_years || null,
        applicantData.annual_income,
        applicantData.education_level || null,
        applicantData.existing_debts || 0,
        applicantData.assets_value || 0,
        applicantData.savings_account_balance || 0,
        applicantData.credit_score || null,
        applicantData.credit_history_length_years || null,
        applicantData.number_of_credit_inquiries || 0,
        applicantData.number_of_open_accounts || 0,
        applicantData.payment_history_score || null,
        applicantData.home_ownership || null,
        applicantData.years_at_current_address || null,
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
        'applicants',
        result.rows[0].id,
        JSON.stringify({ first_name: applicantData.first_name, last_name: applicantData.last_name }),
        req.ip,
        req.get('user-agent'),
        'POST',
        '/api/applicants',
        201,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Applicant created successfully',
      data: {
        applicant: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Applicant by ID
 * GET /api/applicants/:id
 */
const getApplicantById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM applicants WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Applicant not found.',
      });
    }

    res.json({
      success: true,
      data: {
        applicant: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Applicants with Pagination
 * GET /api/applicants
 */
const getAllApplicants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query('SELECT COUNT(*) FROM applicants');
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated results
    const result = await query(
      `SELECT * FROM applicants 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: {
        applicants: result.rows,
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
 * Update Applicant
 * PUT /api/applicants/:id
 */
const updateApplicant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if applicant exists
    const checkResult = await query(
      'SELECT * FROM applicants WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Applicant not found.',
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at' && key !== 'created_by') {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update.',
      });
    }

    updateValues.push(id);
    const updateQuery = `UPDATE applicants SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;

    const result = await query(updateQuery, updateValues);

    // Log the action
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, request_method, request_path, response_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        req.user.id,
        'update',
        'applicants',
        id,
        JSON.stringify(checkResult.rows[0]),
        JSON.stringify(updates),
        req.ip,
        req.get('user-agent'),
        'PUT',
        `/api/applicants/${id}`,
        200,
      ]
    );

    res.json({
      success: true,
      message: 'Applicant updated successfully',
      data: {
        applicant: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search Applicants
 * GET /api/applicants/search
 */
const searchApplicants = async (req, res, next) => {
  try {
    const { query: searchQuery, field } = req.query;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required.',
      });
    }

    let sqlQuery;
    let params;

    if (field === 'email') {
      sqlQuery = 'SELECT * FROM applicants WHERE email ILIKE $1 LIMIT 20';
      params = [`%${searchQuery}%`];
    } else if (field === 'phone') {
      sqlQuery = 'SELECT * FROM applicants WHERE phone LIKE $1 LIMIT 20';
      params = [`%${searchQuery}%`];
    } else if (field === 'application_number') {
      sqlQuery = 'SELECT * FROM applicants WHERE application_number ILIKE $1 LIMIT 20';
      params = [`%${searchQuery}%`];
    } else {
      // Default: search by name
      sqlQuery = 'SELECT * FROM applicants WHERE first_name ILIKE $1 OR last_name ILIKE $2 LIMIT 20';
      params = [`%${searchQuery}%`, `%${searchQuery}%`];
    }

    const result = await query(sqlQuery, params);

    res.json({
      success: true,
      data: {
        applicants: result.rows,
        count: result.rows.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplicant,
  getApplicantById,
  getAllApplicants,
  updateApplicant,
  searchApplicants,
};
