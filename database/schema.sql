-- PART B — FULL SQL SCHEMA (CORE TABLES)
-- Organization Structure
CREATE TABLE companies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE campuses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT,
    name VARCHAR(255),
    location VARCHAR(255),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    campus_id BIGINT,
    name VARCHAR(255),
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
);

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50),
    level INT
);

-- Users & Employees
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE employees (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    department_id BIGINT,
    employee_code VARCHAR(50),
    full_name VARCHAR(255),
    gender VARCHAR(10),
    date_of_birth DATE,
    join_date DATE,
    employment_status VARCHAR(50),
    basic_salary DECIMAL(12,2),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Attendance
CREATE TABLE attendance_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT,
    check_in DATETIME,
    check_out DATETIME,
    source VARCHAR(50),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Leave Management
CREATE TABLE leave_types (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50),
    annual_quota INT
);

CREATE TABLE leave_balances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT,
    leave_type_id BIGINT,
    balance INT,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
);

CREATE TABLE leave_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT,
    leave_type_id BIGINT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Payroll & Tax
CREATE TABLE payroll_runs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    month VARCHAR(7),
    status VARCHAR(50)
);

CREATE TABLE payroll_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    payroll_run_id BIGINT,
    employee_id BIGINT,
    gross_salary DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    net_salary DECIMAL(12,2),
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE tax_brackets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    min_salary DECIMAL(12,2),
    max_salary DECIMAL(12,2),
    rate DECIMAL(5,2)
);
