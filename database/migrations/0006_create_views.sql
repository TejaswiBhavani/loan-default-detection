CREATE VIEW loan_applications_complete AS
SELECT 
    la.id as application_id,
    la.status as application_status,
    la.loan_amount,
    la.loan_purpose,
    la.loan_term_months,
    la.loan_to_income_ratio,
    la.created_at as application_date,
    la.submitted_at,
    la.decision_at,
    la.decision_reason,
    a.id as applicant_id,
    a.application_number,
    a.first_name,
    a.last_name,
    a.email,
    a.age,
    a.annual_income,
    a.credit_score,
    a.employment_status,
    a.home_ownership,
    a.debt_to_income_ratio,
    latest_p.risk_score,
    latest_p.risk_category,
    latest_p.confidence_score,
    latest_p.recommendation,
    latest_p.created_at as prediction_date,
    lo.first_name as loan_officer_first_name,
    lo.last_name as loan_officer_last_name,
    uw.first_name as underwriter_first_name,
    uw.last_name as underwriter_last_name
FROM loan_applications la
JOIN applicants a ON la.applicant_id = a.id
LEFT JOIN (
    SELECT DISTINCT ON (loan_application_id) 
           loan_application_id,
           risk_score,
           risk_category,
           confidence_score,
           recommendation,
           created_at
    FROM predictions 
    ORDER BY loan_application_id, created_at DESC
) latest_p ON latest_p.loan_application_id = la.id
LEFT JOIN users lo ON la.assigned_loan_officer = lo.id
LEFT JOIN users uw ON la.assigned_underwriter = uw.id;

CREATE VIEW dashboard_metrics AS
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN status IN ('submitted', 'under_review') THEN 1 END) as pending_count,
    ROUND(
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(CASE WHEN status IN ('approved', 'rejected') THEN 1 END), 0) * 100, 
        2
    ) as approval_rate_percent,
    AVG(loan_amount) as avg_loan_amount,
    SUM(CASE WHEN status = 'approved' THEN loan_amount ELSE 0 END) as total_approved_amount,
    MIN(created_at) as first_application_date,
    MAX(created_at) as latest_application_date
FROM loan_applications
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

CREATE VIEW risk_analysis AS
SELECT 
    p.risk_category,
    COUNT(*) as prediction_count,
    AVG(p.risk_score) as avg_risk_score,
    AVG(p.confidence_score) as avg_confidence,
    COUNT(CASE WHEN p.recommendation = 'approve' THEN 1 END) as approve_count,
    COUNT(CASE WHEN p.recommendation = 'review' THEN 1 END) as review_count,
    COUNT(CASE WHEN p.recommendation = 'reject' THEN 1 END) as reject_count
FROM predictions p
WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.risk_category;
