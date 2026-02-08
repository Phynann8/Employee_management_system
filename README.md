# 🏢 Employee Management System (EMS) - System Architecture

## 1. Overview
The **Employee Management System (EMS)** is a robust, full-stack application designed to streamline HR operations, automate payroll, and synchronize real-time biometric attendance data. It is built to support multi-campus organizations with strict security and role-based access control.

## 2. Technology Stack
*   **Backend**: Laravel 12 (PHP 8.2+) / SQLite
    *   *Key Libraries*: `sanctum` (Auth), `dompdf` (Payslips), `carbon` (Date Logic)
*   **Frontend**: Vanilla JavaScript (ES6+), Bootstrap 5
    *   *Features*: SPA-like navigation, PWA (Service Worker), Real-time Polling
*   **Biometrics**: Integration with ZKTime.Net Database (SQL Server/Access via Laravel)
*   **Environment**: Windows (Localhost/XAMPP)

## 3. Core Modules

### 🔐 A. Security & Authentication
*   **Role-Based Access Control (RBAC)**:
    *   **Admin**: Full access to Payroll, Settings, and Employee Management.
    *   **Employee**: Read-only access to their own Profile, Attendance, and Payslips.
*   **Middleware**: `RoleMiddleware` ensures API endpoints are protected against unauthorized role access.
*   **Token Auth**: Uses Laravel Sanctum for secure API token management.

### 👥 B. Organization & User Management
*   **Structure**: Hierarchical organization mapping:
    *   `Company` -> `Campus` -> `Department` -> `Employee`
*   **Multi-Campus Logic**:
    *   Each Campus has defined `start_time` and `end_time`.
    *   System automatically flags attendance as **"Late"** or **"Early Leave"** based on the employee's assigned campus shift.

### ⏰ C. Attendance & Biometrics
*   **Real-Time Sync**:
    *   The system connects to external Biometric Device databases (`biometric_raw_logs`).
    *   **Automated Job**: `ProcessAttendance` runs on a schedule to convert raw punches into structured `AttendanceLog` records.
    *   **Logic**: Handles Check-in (First Punch) and Check-out (Last Punch) daily.
*   **Locking Mechanism**:
    *   Admins can **Lock** a month (e.g., "May 2026").
    *   Once locked, no attendance logs can be modified or deleted, ensuring payroll integrity.

### 💸 D. Payroll Engine
*   **Automated Calculation**:
    *   Algorithmic calculation of **Gross Salary** based on `basic_salary`.
    *   **Deductions**: Automatically calculates deductions for `unpaid_leave` or `absent` days.
*   **Tax Logic**:
    *   Implements **Cambodian Tax on Salary** brackets (0% to 20%).
*   **Output**:
    *   Generates `PayrollRun` records with detailed `PayrollItems`.
    *   **PDF Payslips**: Employees can download professional PDF payslips via the Mobile ESS or Web Dashboard.

### 📱 E. Frontend & PWA
*   **Progressive Web App (PWA)**:
    *   Installable on Android/iOS via `manifest.json`.
    *   Service Worker (`sw.js`) caches assets for offline resilience.
*   **Real-Time Dashboard**:
    *   Auto-refreshes every 15 seconds to display the latest attendance and system status.

## 4. Data Flow

1.  **Input**: Employee scans finger on Biometric Device.
2.  **Sync**: Laravel Job imports raw log to `biometric_raw_logs`.
3.  **Process**: Console Command processes log -> `attendance_logs` (Calculating Status: Late/Present).
4.  **Admin Review**: Admin locks the month.
5.  **Payroll**: Admin clicks "Run Payroll". System validates attendance, calculates tax, and generates slips.
6.  **Access**: Employee logs in via Mobile PWA to view Dashboard and download PDF.

## 5. Directory Structure
```
/backend
  /app/Console/Commands/ProcessAttendance.php  # Core Biometric Logic
  /app/Http/Controllers/Api/                   # API Endpoints
  /app/Services/PayrollService.php             # Tax & Salary Logic
  /database/migrations/                        # SQL Schema Versioning
  /resources/views/pdfs/                       # Payslip Templates

/frontend
  /js/app.js                                   # Main UI Logic (SPA)
  /sw.js                                       # Service Worker (PWA)
  /manifest.json                               # PWA Config
  /dashboard.html                              # Admin/User Dashboard
```

## 6. Future Extensibility
*   **Leave Management**: The schema supports `leave_requests` and `balances`, ready for a UI build-out.
*   **Bank Export**: Payroll data is structured to easily export ABA/Acleda bank files.
