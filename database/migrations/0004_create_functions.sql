CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_financial_ratios()
RETURNS TRIGGER AS $$
DECLARE
    applicant_income DECIMAL(12,2);
BEGIN
    IF TG_TABLE_NAME = 'applicants' THEN
        NEW.age = EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.date_of_birth))::INTEGER;
        IF NEW.annual_income > 0 THEN
            NEW.debt_to_income_ratio = NEW.existing_debts / NEW.annual_income;
            NEW.monthly_income = NEW.annual_income / 12;
        END IF;
    END IF;
    IF TG_TABLE_NAME = 'loan_applications' THEN
        SELECT annual_income INTO applicant_income 
        FROM applicants 
        WHERE id = NEW.applicant_id;
        IF applicant_income IS NOT NULL AND applicant_income > 0 THEN
            NEW.loan_to_income_ratio = NEW.loan_amount / applicant_income;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_prediction_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.predicted_default_probability = NEW.risk_score;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
