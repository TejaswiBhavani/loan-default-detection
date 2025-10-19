SELECT 'LOAN PREDICTION DATABASE SETUP COMPLETE!' as status;

SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 
    'applicants' as table_name, COUNT(*) as record_count FROM applicants
UNION ALL
SELECT 
    'loan_applications' as table_name, COUNT(*) as record_count FROM loan_applications
UNION ALL
SELECT 
    'predictions' as table_name, COUNT(*) as record_count FROM predictions
UNION ALL
SELECT 
    'prediction_features' as table_name, COUNT(*) as record_count FROM prediction_features
UNION ALL
SELECT 
    'audit_logs' as table_name, COUNT(*) as record_count FROM audit_logs
UNION ALL
SELECT 
    'user_sessions' as table_name, COUNT(*) as record_count FROM user_sessions;

SELECT 'Testing loan_applications_complete view' as test;
SELECT COUNT(*) as complete_applications_count FROM loan_applications_complete;

SELECT 'Testing dashboard_metrics view' as test;
SELECT * FROM dashboard_metrics;

SELECT 'Testing risk_analysis view' as test;
SELECT * FROM risk_analysis;
