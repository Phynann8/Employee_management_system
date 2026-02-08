# 📘 Technical Manual: Employee Management System (EMS)

## 1. System Overview
**Type**: Full-Stack Web Application (PWA)
**Stack**: Laravel 12 (Backend) + Vanilla JS/Bootstrap 5 (Frontend)
**Purpose**: Corporate HR management handling multi-campus structures, biometric attendance syncing, and automated payroll with tax calculation.

## 2. Directory Structure & Key Files
```bash
/
├── backend/                   # Laravel Core
│   ├── app/                   # Business Logic
│   │   ├── Models/            # Eloquent ORM Entities (Employee.php, PayrollRun.php...)
│   │   └── Http/Controllers/  # API Controllers (Api/AttendanceController.php...)
│   ├── database/              # Schema & Seeds
│   │   └── migrations/        # Database Definitions
│   └── routes/
│       └── api.php            # REST API Endpoints
├── frontend/                  # Static PWA Client
│   ├── js/app.js              # Main SPA Logic (Auth, Fetch Wrappers)
│   ├── sw.js                  # Service Worker (Offline Support)
│   └── dashboard.html         # Main UI
└── database/                  # Project-level Database Resources
    └── migrations_plan.txt    # Schema Blueprint
```

## 3. Database Schema (Data Dictionary)
The system uses a relational database (SQLite/MySQL) with 4 key modules.

### A. Organization
*   **companies**: Top-level entity.
*   **campuses**: Physical locations (linked to Company).
*   **departments**: Functional units (linked to Campus).
*   **roles**: RBAC roles (`Admin`, `HR`, `Employee`).

### B. Employees
*   **users**: Auth credentials (`email`, `password`, `role_id`).
*   **employees**: Profile data (`employee_code`, `salary`, `join_date`).
    *   *Relation*: BelongsTo User, BelongsTo Department.

### C. Attendance
*   **attendance_logs**: Daily punch records.
    *   `check_in` / `check_out` (DateTime)
    *   `source`: 'Biometric' or 'Web'.
*   **leave_balances**: Tracks remaining quota per `leave_type`.
*   **leave_requests**: Employee submissions for time off.

### D. Payroll
*   **payroll_runs**: Monthly batch headers (e.g., "2026-05", Status: Locked).
*   **payroll_items**: Individual slip data.
    *   Calculated fields: `gross_salary`, `tax_amount`, `net_salary`.

## 4. Backend Logic (API)
### Authentication
*   **Endpoint**: `POST /api/login`
*   **Logic**: Returns Sanctum Token + User Object.
*   **Middleware**: `auth:sanctum` protects all other routes.

### Payroll Engine
*   **Controller**: `PayrollController`
*   **Action**: `generatePayroll(month)`
*   **Process**:
    1.  Validates if month is "Locked".
    2.  Iterates all active employees.
    3.  Calculates deductions based on `attendance_logs` (absent days).
    4.  Applies Tax Bracket logic (0-20%).
    5.  Saves snapshot to `payroll_items`.

### Attendance Lock
*   **Controller**: `AttendanceController`
*   **Action**: `lockMonth(month)`
*   **Purpose**: Freezes modification of logs so Payroll can be run safely.

## 5. Frontend Logic
**File**: `frontend/js/app.js`

*   **SPA Architecture**: Uses `initDashboard()` to manage views (`dashboard`, `attendance`, `payroll`) without page reloads.
*   **Polling**: `setInterval` (15s) invokes `loadEmployeeList()` to refresh data near-real-time.
*   **RBAC UI**: `loadUserProfile()` checks `user.role.name`. If not "Admin", it hides Payroll menus and Edit buttons.

## 6. Setup & Deployment
1.  **Backend**:
    *   `cd backend`
    *   `cp .env.example .env` (Set DB Connection)
    *   `php artisan migrate --seed`
    *   `php artisan serve`
2.  **Frontend**:
    *   Serve `frontend/` folder using any static host (e.g., VS Code Live Server) or point web server to it.
