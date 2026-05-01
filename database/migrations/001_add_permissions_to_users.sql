-- Migration: Add permissions JSON column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSON DEFAULT NULL;

-- Give existing super_admin users all permissions
UPDATE users SET permissions = '{"view_dashboard":true,"manage_companies":true,"manage_employees":true,"generate_documents":true,"generate_all":true,"salary_increment":true,"bulk_payslips":true,"tn_salary":true,"internship_cert":true,"view_documents":true}'
WHERE role = 'super_admin' AND permissions IS NULL;

-- Give other existing users default permissions (all enabled for backward compat)
UPDATE users SET permissions = '{"view_dashboard":true,"manage_companies":true,"manage_employees":true,"generate_documents":true,"generate_all":true,"salary_increment":true,"bulk_payslips":true,"tn_salary":true,"internship_cert":true,"view_documents":true}'
WHERE role != 'super_admin' AND permissions IS NULL;
