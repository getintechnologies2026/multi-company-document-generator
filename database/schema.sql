-- Multi-Company Document Generator - Database Schema
CREATE DATABASE IF NOT EXISTS doc_software;
USE doc_software;

-- ============== USERS ==============
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin','company_admin','hr','viewer') DEFAULT 'hr',
    company_id INT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============== COMPANIES ==============
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    email VARCHAR(150),
    phone VARCHAR(50),
    website VARCHAR(150),
    gst_no VARCHAR(50),
    pan_no VARCHAR(50),
    logo_path VARCHAR(255),
    signature_path VARCHAR(255),
    stamp_path VARCHAR(255),
    signatory_name VARCHAR(150),
    signatory_designation VARCHAR(150),
    doc_number_prefix VARCHAR(20) DEFAULT 'DOC',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============== EMPLOYEES ==============
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    emp_code VARCHAR(50),
    full_name VARCHAR(200) NOT NULL,
    father_name VARCHAR(200),
    dob DATE,
    gender ENUM('Male','Female','Other'),
    email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    designation VARCHAR(150),
    department VARCHAR(150),
    date_of_joining DATE,
    date_of_leaving DATE,
    employment_type ENUM('Full-Time','Part-Time','Contract','Intern') DEFAULT 'Full-Time',
    -- Salary
    ctc DECIMAL(12,2) DEFAULT 0,
    basic DECIMAL(12,2) DEFAULT 0,
    hra DECIMAL(12,2) DEFAULT 0,
    da DECIMAL(12,2) DEFAULT 0,
    conveyance DECIMAL(12,2) DEFAULT 0,
    medical DECIMAL(12,2) DEFAULT 0,
    special_allowance DECIMAL(12,2) DEFAULT 0,
    pf DECIMAL(12,2) DEFAULT 0,
    esi DECIMAL(12,2) DEFAULT 0,
    professional_tax DECIMAL(12,2) DEFAULT 0,
    tds DECIMAL(12,2) DEFAULT 0,
    -- Bank
    bank_name VARCHAR(150),
    bank_account VARCHAR(50),
    ifsc_code VARCHAR(20),
    pan VARCHAR(20),
    aadhaar VARCHAR(20),
    uan VARCHAR(30),
    pf_no VARCHAR(30),
    status ENUM('Active','Resigned','Terminated') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ============== DOCUMENTS ==============
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doc_number VARCHAR(100) UNIQUE,
    doc_type ENUM('offer_letter','payslip','experience_letter','relieving_letter') NOT NULL,
    company_id INT NOT NULL,
    employee_id INT,
    employee_name VARCHAR(200),
    issue_date DATE,
    -- Payslip-specific
    pay_month VARCHAR(20),
    pay_year VARCHAR(10),
    working_days INT,
    paid_days INT,
    lop_days INT DEFAULT 0,
    gross_earnings DECIMAL(12,2),
    total_deductions DECIMAL(12,2),
    net_pay DECIMAL(12,2),
    -- Offer-specific
    joining_date DATE,
    offered_designation VARCHAR(150),
    offered_ctc DECIMAL(12,2),
    -- Experience/Relieving
    relieving_date DATE,
    -- Storage
    pdf_path VARCHAR(255),
    extra_data JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ============== TEMPLATES (custom per company - optional) ==============
CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NULL,
    doc_type ENUM('offer_letter','payslip','experience_letter','relieving_letter') NOT NULL,
    name VARCHAR(150),
    html_content LONGTEXT,
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ============== AUDIT LOG ==============
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100),
    entity VARCHAR(100),
    entity_id INT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============== SEED DATA ==============
-- Default super admin (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Super Admin', 'admin@docsoft.com', '$2a$10$rXqVJYqL8nKp5wK3Xz.GSeDqQGqVqVqVqVqVqVqVqVqVqVqVqVqVq', 'super_admin');

-- Sample company
INSERT INTO companies (name, address, city, state, pincode, email, phone, website, signatory_name, signatory_designation, doc_number_prefix)
VALUES ('Demo Tech Pvt Ltd', '123 MG Road', 'Bangalore', 'Karnataka', '560001', 'hr@demotech.com', '+91-9876543210', 'www.demotech.com', 'John Doe', 'HR Manager', 'DTPL');
