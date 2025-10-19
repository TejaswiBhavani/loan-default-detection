CREATE TYPE user_role AS ENUM (
    'admin',
    'loan_officer', 
    'underwriter',
    'analyst',
    'viewer'
);

CREATE TYPE employment_status AS ENUM (
    'employed',
    'self_employed',
    'unemployed',
    'retired',
    'student'
);

CREATE TYPE education_level AS ENUM (
    'high_school',
    'associate',
    'bachelor',
    'master',
    'phd',
    'other'
);

CREATE TYPE loan_purpose AS ENUM (
    'debt_consolidation',
    'home_improvement',
    'car_purchase',
    'business',
    'medical',
    'vacation',
    'other'
);

CREATE TYPE home_ownership AS ENUM (
    'own',
    'rent',
    'mortgage',
    'other'
);

CREATE TYPE application_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'cancelled'
);

CREATE TYPE risk_category AS ENUM (
    'low',
    'medium',
    'high'
);

CREATE TYPE prediction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled'
);

CREATE TYPE audit_action AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'predict',
    'approve',
    'reject',
    'export'
);
