const API_URL = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm')) initLogin();
    if (document.getElementById('sidebarMenu')) initDashboard();

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW Registered', reg))
            .catch(err => console.log('SW Failed', err));
    }
});

function initLogin() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const alertBox = document.getElementById('alertBox');

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('ems_token', data.access_token);
                localStorage.setItem('ems_user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                alertBox.textContent = data.message || 'Login failed';
                alertBox.classList.remove('d-none');
            }
        } catch (error) {
            console.error(error);
            alertBox.textContent = 'Server error.';
            alertBox.classList.remove('d-none');
        }
    });
}

function initDashboard() {
    const token = localStorage.getItem('ems_token');
    if (!token) { window.location.href = 'login.html'; return; }

    loadUserProfile(token);
    loadEmployeeList(token);

    // Clock Pulse and Date
    const clock = document.getElementById('clockDisplay');
    const dateEl = document.getElementById('currentDate');

    if (clock && dateEl) {
        // Set date once
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);

        setInterval(() => {
            const now = new Date();
            // Use 2-digit format for HH:MM:SS
            clock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
        }, 1000);
    }

    // Real-Time Dashboard (Polling every 15s)
    setInterval(() => {
        const token = localStorage.getItem('ems_token');
        if (!token) return;

        const viewDashboard = document.getElementById('view-dashboard');
        const viewAttendance = document.getElementById('view-attendance');
        const viewPayroll = document.getElementById('view-payroll');

        // If Dashboard is visible, maybe refresh stats (not implemented yet)

        // If Attendance View is visible, refresh list
        if (viewAttendance && viewAttendance.classList.contains('d-block')) {
            // We need a function to refresh attendance. 
            // Currently myAttendance() is in app.js? No, checking...
            // It's not. Let's add window.loadAttendanceList if we had it.
            // For now, let's refresh Employee List as a proxy for activity?
            loadEmployeeList(token);
        }

        // If Payroll View is visible (no real-time need there usually)
    }, 15000);
}

// Global scope for polling
window.refreshAttendance = async function () {
    // Re-fetch attendance logic if check-in/out happens
}

// Navigation
window.switchView = function (viewName) {
    // Update Sidebar Active State
    document.querySelectorAll('#sidebarMenu a').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Hide all views
    document.getElementById('view-dashboard').classList.add('d-none');
    document.getElementById('view-dashboard').classList.remove('d-block');
    document.getElementById('view-attendance').classList.add('d-none');
    document.getElementById('view-attendance').classList.remove('d-block');
    document.getElementById('view-leaves').classList.add('d-none');
    document.getElementById('view-leaves').classList.remove('d-block');
    document.getElementById('view-payroll').classList.add('d-none');
    document.getElementById('view-payroll').classList.remove('d-block');

    // Show selected view
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.classList.remove('d-none');
        target.classList.add('d-block');
    }
}

async function loadUserProfile(token) {
    try {
        const response = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Auth failed');
        const user = await response.json();
        document.getElementById('userName').textContent = user.employee ? user.employee.full_name : user.name;
        document.getElementById('userRole').textContent = user.role ? user.role.name : 'User';

        // RBAC: Hide elements if not Admin
        if (user.role && user.role.name !== 'Admin') {
            // Hide Payroll Menu
            const payrollLink = document.querySelector('a[onclick="switchView(\'payroll\')"]');
            if (payrollLink) payrollLink.classList.add('d-none');

            // Hide New Employee Button
            const newEmpBtn = document.querySelector('button[onclick*="Create Employee"]');
            if (newEmpBtn) newEmpBtn.classList.add('d-none');
        }
    } catch (e) {
        logout();
    }
}

async function loadEmployeeList(token) {
    try {
        const response = await fetch(`${API_URL}/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const tbody = document.getElementById('employeeTableBody');
        tbody.innerHTML = '';

        const currentUser = JSON.parse(localStorage.getItem('ems_user') || '{}');
        const isAdmin = currentUser.role && currentUser.role.name === 'Admin';

        data.data.forEach(emp => {
            const editBtn = isAdmin ? `
                <button class="btn btn-sm btn-outline-primary shadow-sm" style="border-radius: 20px; padding: 4px 12px;" 
                    onclick="openEditModal(${emp.id}, '${emp.full_name}', '${emp.biometric_enroll_number || ''}')">
                    ✏️ Edit
                </button>` : '';

            // Generate Avatar Initials
            const initials = emp.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const statusBadge = emp.employment_status === 'Probation'
                ? '<span class="badge bg-warning text-dark">Probation</span>'
                : '<span class="badge bg-success">Active</span>';

            tbody.innerHTML += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle">${initials}</div>
                            <div>
                                <div class="fw-bold text-dark">${emp.full_name}</div>
                                <div class="small text-muted">${emp.job_title || 'Employee'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="text-secondary fw-bold small">${emp.employee_code}</td>
                    <td><span class="badge-dept">${emp.department ? emp.department.name : 'General'}</span></td>
                    <td>${statusBadge}</td>
                    <td>${editBtn}</td>
                </tr>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

window.openEditModal = function (id, name, bioId) {
    document.getElementById('editEmpId').value = id;
    document.getElementById('editFullName').value = name;
    document.getElementById('editBioId').value = bioId === 'null' ? '' : bioId;

    const modal = new bootstrap.Modal(document.getElementById('editEmployeeModal'));
    modal.show();
}

window.saveEmployeeChanges = async function () {
    const id = document.getElementById('editEmpId').value;
    const name = document.getElementById('editFullName').value;
    const bioId = document.getElementById('editBioId').value;
    const token = localStorage.getItem('ems_token');

    try {
        const response = await fetch(`${API_URL}/employees/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: name,
                biometric_enroll_number: bioId
            })
        });

        if (response.ok) {
            alert('Updated Successfully');
            loadEmployeeList(token);
            // Hide modal (simple reload or find instance)
            const modalEl = document.getElementById('editEmployeeModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
        } else {
            const err = await response.json();
            alert('Update failed: ' + (err.message || 'Unknown error'));
        }
    } catch (e) {
        console.error(e);
        alert('Server Error');
    }
}

window.markAttendance = async function (type) {
    const token = localStorage.getItem('ems_token');
    const endpoint = type === 'check-in' ? 'attendance/check-in' : 'attendance/check-out';

    if (!confirm(`Are you sure you want to ${type}?`)) return;

    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        alert(data.message);

        // Log to UI (Simple Append)
        const list = document.getElementById('attendanceList');
        const item = document.createElement('li');
        item.className = 'list-group-item';
        item.textContent = `${type.toUpperCase()} at ${new Date().toLocaleTimeString()}`;
        list.prepend(item);

    } catch (e) {
        alert('Action failed.');
    }
}

window.runPayroll = async function () {
    const token = localStorage.getItem('ems_token');
    const month = document.getElementById('payrollMonth').value;

    if (!month) return alert('Please select a month');

    try {
        const response = await fetch(`${API_URL}/payroll/run`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ month })
        });
        const data = await response.json();

        if (response.ok) {
            alert('Payroll Generated Successfully!');
            // Simple display of results
            const container = document.getElementById('payrollResult');
            let html = '<ul class="list-group">';
            data.data.items.forEach(item => {
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>
                        <strong>${item.employee.full_name} (${item.employee.employee_code})</strong><br>
                        Net: $${item.net_salary} (Tax: $${item.tax_amount})
                    </span>
                    <button class="btn btn-sm btn-outline-danger" onclick="downloadPayslip(${item.id})">
                        <i class="bi bi-file-pdf"></i> PDF
                    </button>
                </li>`;
            });
            html += '</ul>';
            container.innerHTML = html;
        } else {
            alert(data.message);
        }
    } catch (e) {
        alert('Run failed.');
    }
}

// Check Lock on Month Change
document.getElementById('payrollMonth').addEventListener('change', checkLockStatus);

async function checkLockStatus() {
    const month = document.getElementById('payrollMonth').value;
    const token = localStorage.getItem('ems_token');
    const badge = document.getElementById('lockStatus');

    if (!month) {
        badge.classList.add('d-none');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/attendance/lock/${month}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.locked) {
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    } catch (e) {
        console.error("Lock check failed", e);
    }
}

window.lockAttendance = async function () {
    const month = document.getElementById('payrollMonth').value;
    const token = localStorage.getItem('ems_token');

    if (!month) return alert("Select a month first.");
    if (!confirm(`Are you sure you want to LOCK attendance for ${month}? This cannot be undone.`)) return;

    try {
        const response = await fetch(`${API_URL}/attendance/lock`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ month })
        });
        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            checkLockStatus(); // Refresh badge
        } else {
            alert(data.message || 'Lock failed');
        }
    } catch (e) {
        alert("Server Error");
    }
}

window.downloadPayslip = async function (id) {
    const token = localStorage.getItem('ems_token');
    try {
        const response = await fetch(`${API_URL}/payroll/item/${id}/download`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payslip-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            alert("Failed to download Payslip");
        }
    } catch (e) {
        console.error(e);
        alert("Error downloading file");
    }
}

window.logout = function () {
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_user');
    window.location.href = 'login.html';
}
