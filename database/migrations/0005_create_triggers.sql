CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applicants_updated_at 
    BEFORE UPDATE ON applicants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER calculate_applicant_ratios
    BEFORE INSERT OR UPDATE ON applicants
    FOR EACH ROW EXECUTE FUNCTION calculate_financial_ratios();

CREATE TRIGGER update_loan_applications_updated_at 
    BEFORE UPDATE ON loan_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER calculate_loan_ratios
    BEFORE INSERT OR UPDATE ON loan_applications
    FOR EACH ROW EXECUTE FUNCTION calculate_financial_ratios();

CREATE TRIGGER set_prediction_computed_fields
    BEFORE INSERT OR UPDATE ON predictions
    FOR EACH ROW EXECUTE FUNCTION set_prediction_fields();
