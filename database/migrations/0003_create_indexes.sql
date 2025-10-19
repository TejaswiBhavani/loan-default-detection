CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_model_versions_active ON model_versions(is_active);
CREATE INDEX idx_model_versions_production ON model_versions(is_production);
CREATE INDEX idx_model_versions_created_at ON model_versions(created_at);

CREATE INDEX idx_applicants_application_number ON applicants(application_number);
CREATE INDEX idx_applicants_name ON applicants(last_name, first_name);
CREATE INDEX idx_applicants_email ON applicants(email);
CREATE INDEX idx_applicants_created_at ON applicants(created_at);
CREATE INDEX idx_applicants_credit_score ON applicants(credit_score);
CREATE INDEX idx_applicants_income ON applicants(annual_income);

CREATE INDEX idx_loan_applications_applicant_id ON loan_applications(applicant_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_loan_applications_created_at ON loan_applications(created_at);
CREATE INDEX idx_loan_applications_submitted_at ON loan_applications(submitted_at);
CREATE INDEX idx_loan_applications_loan_officer ON loan_applications(assigned_loan_officer);
CREATE INDEX idx_loan_applications_underwriter ON loan_applications(assigned_underwriter);
CREATE INDEX idx_loan_applications_amount ON loan_applications(loan_amount);

CREATE INDEX idx_predictions_loan_application_id ON predictions(loan_application_id);
CREATE INDEX idx_predictions_model_version_id ON predictions(model_version_id);
CREATE INDEX idx_predictions_created_at ON predictions(created_at);
CREATE INDEX idx_predictions_risk_category ON predictions(risk_category);
CREATE INDEX idx_predictions_recommendation ON predictions(recommendation);
CREATE INDEX idx_predictions_status ON predictions(status);

CREATE INDEX idx_prediction_features_prediction_id ON prediction_features(prediction_id);
CREATE INDEX idx_prediction_features_feature_name ON prediction_features(feature_name);
CREATE INDEX idx_prediction_features_importance ON prediction_features(importance_score);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);
