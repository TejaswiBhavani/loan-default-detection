ALTER TABLE users ADD CONSTRAINT fk_users_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id);

INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, department, phone, is_verified, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@loanbank.com', '$2b$12$LQv3c1yqBwEHzEw1vDWyDOXuvy5NG9lhWV8sL8bTaZo0o8Y7yvFq2', 'Sarah', 'Johnson', 'admin', 'IT Administration', '+1-555-0100', true, NULL),
('550e8400-e29b-41d4-a716-446655440002', 'lofficer1', 'mary.smith@loanbank.com', '$2b$12$LQv3c1yqBwEHzEw1vDWyDOXuvy5NG9lhWV8sL8bTaZo0o8Y7yvFq2', 'Mary', 'Smith', 'loan_officer', 'Lending Department', '+1-555-0101', true, NULL),
('550e8400-e29b-41d4-a716-446655440003', 'underwriter1', 'david.wilson@loanbank.com', '$2b$12$LQv3c1yqBwEHzEw1vDWyDOXuvy5NG9lhWV8sL8bTaZo0o8Y7yvFq2', 'David', 'Wilson', 'underwriter', 'Risk Assessment', '+1-555-0102', true, NULL),
('550e8400-e29b-41d4-a716-446655440004', 'analyst1', 'lisa.brown@loanbank.com', '$2b$12$LQv3c1yqBwEHzEw1vDWyDOXuvy5NG9lhWV8sL8bTaZo0o8Y7yvFq2', 'Lisa', 'Brown', 'analyst', 'Data Analytics', '+1-555-0103', true, NULL),
('550e8400-e29b-41d4-a716-446655440005', 'lofficer2', 'james.davis@loanbank.com', '$2b$12$LQv3c1yqBwEHzEw1vDWyDOXuvy5NG9lhWV8sL8bTaZo0o8Y7yvFq2', 'James', 'Davis', 'loan_officer', 'Lending Department', '+1-555-0104', true, NULL);

UPDATE users SET created_by = '550e8400-e29b-41d4-a716-446655440001' WHERE id = '550e8400-e29b-41d4-a716-446655440001';
UPDATE users SET created_by = '550e8400-e29b-41d4-a716-446655440001' WHERE id != '550e8400-e29b-41d4-a716-446655440001';

INSERT INTO model_versions (id, version_number, model_name, model_type, file_path, scaler_path, feature_columns, performance_metrics, training_data_info, is_active, is_production, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'v1.0.0', 'LoanDefaultPredictor', 'RandomForestClassifier', '/models/loan_default_model_20251006.joblib', '/models/scaler_20251006.joblib', 
'["InterestRate", "AnnualIncome", "Experience", "LengthOfCreditHistory", "LoanPurpose", "LoanAmount", "HomeOwnershipStatus", "Age", "LoanToIncomeRatio", "ExperienceToAgeRatio"]',
'{"accuracy": 0.89, "precision": 0.87, "recall": 0.91, "f1_score": 0.89, "roc_auc": 0.93}',
'{"dataset_size": 50000, "training_date": "2024-10-06", "features_count": 10}',
true, true, '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO applicants (id, application_number, first_name, last_name, date_of_birth, email, phone, address_line_1, city, state, zip_code, employment_status, employer_name, job_title, employment_length_years, annual_income, education_level, existing_debts, assets_value, savings_account_balance, credit_score, credit_history_length_years, number_of_credit_inquiries, number_of_open_accounts, payment_history_score, home_ownership, years_at_current_address, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'APP-2024-001', 'John', 'Doe', '1988-05-15', 'john.doe@email.com', '+1-555-1001', '123 Main Street', 'Springfield', 'IL', '62701', 'employed', 'Tech Solutions Inc', 'Software Engineer', 5.2, 85000.00, 'bachelor', 25000.00, 150000.00, 15000.00, 720, 10.5, 2, 8, 85.0, 'mortgage', 3.2, '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440021', 'APP-2024-002', 'Jane', 'Smith', '1985-08-22', 'jane.smith@email.com', '+1-555-1002', '456 Oak Avenue', 'Chicago', 'IL', '60601', 'employed', 'Healthcare Partners', 'Registered Nurse', 8.1, 72000.00, 'associate', 18000.00, 95000.00, 8500.00, 680, 8.2, 1, 6, 90.0, 'own', 5.1, '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440022', 'APP-2024-003', 'Michael', 'Johnson', '1992-12-03', 'michael.j@email.com', '+1-555-1003', '789 Pine Street', 'Aurora', 'IL', '60502', 'self_employed', 'Johnson Consulting', 'Business Consultant', 3.0, 95000.00, 'master', 32000.00, 120000.00, 22000.00, 740, 6.8, 3, 10, 78.0, 'rent', 2.0, '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440023', 'APP-2024-004', 'Emily', 'Davis', '1990-03-18', 'emily.davis@email.com', '+1-555-1004', '321 Elm Drive', 'Naperville', 'IL', '60540', 'employed', 'Global Manufacturing', 'Operations Manager', 6.5, 78000.00, 'bachelor', 15000.00, 180000.00, 12000.00, 700, 12.3, 1, 7, 88.0, 'mortgage', 4.5, '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440024', 'APP-2024-005', 'Robert', 'Wilson', '1987-11-07', 'robert.wilson@email.com', '+1-555-1005', '654 Cedar Lane', 'Rockford', 'IL', '61101', 'employed', 'City Government', 'Civil Engineer', 9.2, 68000.00, 'bachelor', 22000.00, 110000.00, 9000.00, 650, 15.1, 2, 9, 82.0, 'own', 7.3, '550e8400-e29b-41d4-a716-446655440005');

INSERT INTO loan_applications (id, applicant_id, loan_amount, loan_purpose, loan_term_months, status, assigned_loan_officer, assigned_underwriter, priority_level, submitted_at, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 50000.00, 'home_improvement', 60, 'submitted', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 2, NOW() - INTERVAL '2 days', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', 25000.00, 'debt_consolidation', 48, 'under_review', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 3, NOW() - INTERVAL '1 day', '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440022', 75000.00, 'business', 84, 'submitted', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 1, NOW() - INTERVAL '3 hours', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440023', 35000.00, 'car_purchase', 60, 'approved', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 3, NOW() - INTERVAL '5 days', '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440024', 15000.00, 'debt_consolidation', 36, 'rejected', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 4, NOW() - INTERVAL '7 days', '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO predictions (id, loan_application_id, model_version_id, risk_score, risk_category, confidence_score, recommendation, feature_importance, input_features, status, processing_time_ms, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440010', 0.35, 'medium', 0.89, 'review', 
'[{"feature": "credit_score", "importance": 0.35}, {"feature": "income", "importance": 0.25}, {"feature": "debt_to_income", "importance": 0.20}]',
'{"credit_score": 720, "annual_income": 85000, "loan_amount": 50000, "debt_to_income_ratio": 0.29}',
'completed', 250, '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440010', 0.25, 'low', 0.92, 'approve',
'[{"feature": "credit_score", "importance": 0.30}, {"feature": "payment_history", "importance": 0.28}, {"feature": "income", "importance": 0.22}]',
'{"credit_score": 680, "annual_income": 72000, "loan_amount": 25000, "payment_history_score": 90}',
'completed', 180, '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440010', 0.45, 'medium', 0.76, 'review',
'[{"feature": "employment_status", "importance": 0.32}, {"feature": "credit_score", "importance": 0.28}, {"feature": "loan_amount", "importance": 0.25}]',
'{"credit_score": 740, "annual_income": 95000, "loan_amount": 75000, "employment_status": "self_employed"}',
'completed', 320, '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440010', 0.18, 'low', 0.94, 'approve',
'[{"feature": "credit_score", "importance": 0.33}, {"feature": "payment_history", "importance": 0.30}, {"feature": "employment_length", "importance": 0.22}]',
'{"credit_score": 700, "annual_income": 78000, "loan_amount": 35000, "payment_history_score": 88}',
'completed', 190, '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440010', 0.75, 'high', 0.88, 'reject',
'[{"feature": "credit_score", "importance": 0.40}, {"feature": "debt_to_income", "importance": 0.35}, {"feature": "income", "importance": 0.15}]',
'{"credit_score": 650, "annual_income": 68000, "loan_amount": 15000, "debt_to_income_ratio": 0.32}',
'completed', 275, '550e8400-e29b-41d4-a716-446655440003');

INSERT INTO prediction_features (prediction_id, feature_name, feature_value, importance_score, impact_direction, display_name) VALUES
('550e8400-e29b-41d4-a716-446655440040', 'credit_score', 720, 0.35, 'positive', 'Credit Score'),
('550e8400-e29b-41d4-a716-446655440040', 'annual_income', 85000, 0.25, 'positive', 'Annual Income'),
('550e8400-e29b-41d4-a716-446655440040', 'debt_to_income_ratio', 0.29, 0.20, 'negative', 'Debt-to-Income Ratio'),
('550e8400-e29b-41d4-a716-446655440040', 'employment_length', 5.2, 0.15, 'positive', 'Employment Length'),
('550e8400-e29b-41d4-a716-446655440040', 'loan_amount', 50000, 0.05, 'negative', 'Loan Amount'),
('550e8400-e29b-41d4-a716-446655440041', 'credit_score', 680, 0.30, 'positive', 'Credit Score'),
('550e8400-e29b-41d4-a716-446655440041', 'payment_history_score', 90, 0.28, 'positive', 'Payment History'),
('550e8400-e29b-41d4-a716-446655440041', 'annual_income', 72000, 0.22, 'positive', 'Annual Income'),
('550e8400-e29b-41d4-a716-446655440041', 'employment_length', 8.1, 0.12, 'positive', 'Employment Length'),
('550e8400-e29b-41d4-a716-446655440041', 'loan_amount', 25000, 0.08, 'neutral', 'Loan Amount');

INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values, ip_address, user_agent, request_method, request_path, response_status) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'create', 'applicants', '550e8400-e29b-41d4-a716-446655440020', '{"first_name": "John", "last_name": "Doe"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'POST', '/api/applicants', 201),
('550e8400-e29b-41d4-a716-446655440003', 'predict', 'predictions', '550e8400-e29b-41d4-a716-446655440040', '{"risk_score": 0.35, "recommendation": "review"}', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'POST', '/api/predictions', 200),
('550e8400-e29b-41d4-a716-446655440001', 'login', 'user_sessions', NULL, '{"login_time": "2024-10-19T10:30:00Z"}', '192.168.1.102', 'Mozilla/5.0 (Linux; Ubuntu)', 'POST', '/api/auth/login', 200);

INSERT INTO user_sessions (user_id, session_token, ip_address, expires_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'sess_admin_550e8400e29b41d4a716446655440099', '192.168.1.100', NOW() + INTERVAL '24 hours'),
('550e8400-e29b-41d4-a716-446655440002', 'sess_lofficer_550e8400e29b41d4a716446655440098', '192.168.1.101', NOW() + INTERVAL '24 hours'),
('550e8400-e29b-41d4-a716-446655440003', 'sess_underwriter_550e8400e29b41d4a716446655440097', '192.168.1.102', NOW() + INTERVAL '24 hours');
