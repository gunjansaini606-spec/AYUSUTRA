/**
 * AyurSutra Advanced Single Page Application State Engine Core
 */
class AyurSutraApp {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.aiBase = 'http://localhost:5001/api/ai';
        this.token = localStorage.getItem('ayur_token') || null;
        this.user = JSON.parse(localStorage.getItem('ayur_user')) || null;
        this.activeChart = null;
    }

    init() {
        this.syncNavigationState();
        this.navigate(this.user ? 'dashboard' : 'home');
        
        // Populate standard master drops continuously in parallel
        if(this.token && this.user.role === 'patient') {
            this.loadBookingFormPrerequisites();
        }
    }

    showToast(msg, isError = false) {
        const tEl = document.getElementById('sysToast');
        tEl.className = `toast align-items-center text-white border-0 ${isError ? 'bg-danger' : 'bg-success'}`;
        document.getElementById('toastMsg').innerText = msg;
        const bsToast = new bootstrap.Toast(tEl);
        bsToast.show();
    }

    navigate(viewId) {
        if (viewId === 'dashboard') {
            this.routeDashboard();
            return;
        }

        document.querySelectorAll('.view-panel').forEach(el => el.classList.add('d-none'));
        const target = document.getElementById(`view-${viewId}`);
        if(target) target.classList.remove('d-none');
    }

    syncNavigationState() {
        const loginBtn = document.getElementById('nav-login-btn');
        const dashBtn = document.getElementById('nav-dash-btn');
        const logoutBtn = document.getElementById('nav-logout-btn');

        if (this.token) {
            if(loginBtn) loginBtn.classList.add('d-none');
            if(dashBtn) dashBtn.classList.remove('d-none');
            if(logoutBtn) logoutBtn.classList.remove('d-none');
            document.querySelectorAll('.client-name-placeholder').forEach(el => el.innerText = this.user.name);
        } else {
            if(loginBtn) loginBtn.classList.remove('d-none');
            if(dashBtn) dashBtn.classList.add('d-none');
            if(logoutBtn) logoutBtn.classList.add('d-none');
        }
    }

    routeDashboard() {
        if (!this.token) return this.navigate('auth');
        
        document.querySelectorAll('.view-panel').forEach(el => el.classList.add('d-none'));
        const targetView = document.getElementById(`view-dashboard-${this.user.role}`);
        if(targetView) targetView.classList.remove('d-none');

        // Contextual workflow data routers initialization
        if (this.user.role === 'patient') this.loadPatientDashboardData();
        if (this.user.role === 'doctor') this.loadDoctorDashboardData();
        if (this.user.role === 'admin') this.loadAdminDashboardData();
    }

    switchDashTab(tabId) {
        document.querySelectorAll('.dash-tab').forEach(el => el.classList.add('d-none'));
        document.getElementById(tabId).classList.remove('d-none');
    }

    toggleRegFields(role) {
        if(role === 'doctor') {
            document.getElementById('doctor-extra-fields').classList.remove('d-none');
            document.getElementById('patient-extra-fields').classList.add('d-none');
        } else {
            document.getElementById('doctor-extra-fields').classList.add('d-none');
            document.getElementById('patient-extra-fields').classList.remove('d-none');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('ayur_token', this.token);
                localStorage.setItem('ayur_user', JSON.stringify(this.user));
                this.syncNavigationState();
                this.showToast("Cryptographic Session successfully established.");
                this.routeDashboard();
            } else {
                this.showToast(data.message || "Authorization fault.", true);
            }
        } catch (err) {
            this.showToast("Network edge infrastructure error.", true);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;

        let payload = { name, email, password, role };

        if(role === 'patient') {
            payload.dob = document.getElementById('reg-dob').value;
            payload.gender = document.getElementById('reg-gender').value;
            payload.phone = document.getElementById('reg-phone').value;
        } else {
            payload.specialization = document.getElementById('reg-spec').value;
            payload.license_no = document.getElementById('reg-license').value;
        }

        try {
            const res = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if(res.ok) {
                this.showToast("Registration completed. Proceed with Authorization.");
                document.getElementById('form-register').reset();
                bootstrap.Tab.getInstance(document.querySelector('#authTabs button[data-bs-target="#login-pane"]')).show();
            } else {
                this.showToast(data.message, true);
            }
        } catch(err) {
            this.showToast("Server mutation error.", true);
        }
    }

    logout() {
        localStorage.clear();
        this.token = null;
        this.user = null;
        this.syncNavigationState();
        this.navigate('home');
        this.showToast("Session cleared successfully.");
    }

    // --- Patient Processing Layer Engine ---
    async loadPatientDashboardData() {
        try {
            const headers = { 'Authorization': `Bearer ${this.token}` };
            
            // 1. Recover Appointments History
            const apptRes = await fetch(`${this.apiBase}/appointments/patient`, { headers });
            const appts = await apptRes.json();
            
            const tbody = document.getElementById('patient-appts-body');
            tbody.innerHTML = '';
            if(appts.data && appts.data.length > 0) {
                appts.data.forEach(a => {
                    tbody.innerHTML += `
                        <tr>
                            <td><strong>${a.therapy_name}</strong></td>
                            <td>Dr. ${a.doctor_name}</td>
                            <td>${a.appointment_date} <small class="text-muted">(${a.time_slot})</small></td>
                            <td><span class="badge ${a.status==='confirmed'?'bg-success':'bg-secondary'}">${a.status}</span></td>
                        </tr>`;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No operational historical sessions registered.</td></tr>';
            }

            // 2. Fetch Vitals Frame Data
            const pRes = await fetch(`${this.apiBase}/clinical/profile/me`, { headers });
            const pData = await pRes.json();
            const vDiv = document.getElementById('patient-vitals-display');
            if(pData.data) {
                const d = pData.data;
                vDiv.innerHTML = `
                    <div class="col-6"><strong>BMI Parameter:</strong><br><span class="text-primary">${d.bmi || 'Not Processed'}</span></div>
                    <div class="col-6"><strong>Blood Pressure:</strong><br><span class="text-primary">${d.blood_pressure || 'Not Measured'}</span></div>
                    <div class="col-12"><strong>Allergies Trace:</strong><br><span class="text-danger">${d.allergies || 'None Detected'}</span></div>
                    <div class="col-12"><strong>Pathological Baseline Conditions:</strong><br><p class="small text-muted mb-0">${d.medical_conditions || 'None'}</p></div>`;
            }
            this.loadBookingFormPrerequisites();
        } catch(err) {
            console.error(err);
        }
    }

    async loadBookingFormPrerequisites() {
        const docSelect = document.getElementById('book-doc');
        const thSelect = document.getElementById('book-therapy');
        if (!docSelect || !thSelect) return;

        try {
            const [dRes, tRes] = await Promise.all([
                fetch(`${this.apiBase}/doctors`),
                fetch(`${this.apiBase}/therapies`)
            ]);
            const docs = await dRes.json();
            const ths = await tRes.json();

            docSelect.innerHTML = '';
            docs.data.forEach(d => docSelect.innerHTML += `<option value="${d.id}">Dr. ${d.name} (${d.specialization})</option>`);

            thSelect.innerHTML = '';
            ths.data.forEach(t => thSelect.innerHTML += `<option value="${t.id}">${t.name} [₹${t.cost}]</option>`);
        } catch(e) { console.error("Error loading clinical options metadata templates.", e); }
    }

    async executeBooking(e) {
        e.preventDefault();
        const payload = {
            doctor_id: document.getElementById('book-doc').value,
            therapy_id: document.getElementById('book-therapy').value,
            appointment_date: document.getElementById('book-date').value,
            time_slot: document.getElementById('book-slot').value,
            notes: 'Self Scheduled Online Booking Interface'
        };

        try {
            const res = await fetch(`${this.apiBase}/appointments/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body: JSON.stringify(payload)
            });
            if(res.ok) {
                this.showToast("Therapy session operation queued.");
                document.getElementById('form-booking').reset();
                this.switchDashTab('p-home');
                this.loadPatientDashboardData();
            } else {
                const d = await res.json();
                this.showToast(d.message || "Scheduling error.", true);
            }
        } catch(err) { this.showToast("Edge communications failure.", true); }
    }

    async runDiagnostics(e) {
        e.preventDefault();
        const symptoms = document.getElementById('ai-symptoms').value;
        const bp = document.getElementById('v-bp').value;
        const bmi = document.getElementById('v-bmi').value;
        const stress = document.getElementById('v-stress').value;

        const container = document.getElementById('ai-results-render');
        container.classList.remove('d-none');
        container.innerHTML = `<div class="text-center py-3"><div class="spinner-border text-success" role="status"></div><br><small class="text-muted mt-2 d-block">Parsing pathophysiological profiles across classic text metrics...</small></div>`;

        try {
            const res = await fetch(`${this.aiBase}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms, bp, bmi, stress_level: stress })
            });
            const wrapper = await res.json();
            if(res.ok && wrapper.status === 'success') {
                const r = wrapper.data;
                
                let therapyHTML = '';
                r.suggested_therapies.forEach(t => {
                    therapyHTML += `<li><strong>${t.therapy}:</strong> ${t.rationale}</li>`;
                });

                container.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="text-success mb-0">Diagnostic Assessment Complete</h4>
                        <span class="badge badge-dosha">${r.dominant_dosha} Dominant Profile</span>
                    </div>
                    <p><strong>Calculated Systemic Stress Index Score:</strong> V:${r.diagnostic_scores.Vata} | P:${r.diagnostic_scores.Pitta} | K:${r.diagnostic_scores.Kapha}</p>
                    <h6 class="text-warning fw-bold mt-3">Target Clinical Interventions:</h6>
                    <ul>${therapyHTML}</ul>
                    <h6 class="text-success fw-bold">Prescribed Dietary Alterations:</h6>
                    <p class="small">${r.dietary_regimen.join(', ')}</p>
                    <h6 class="text-success fw-bold">Clinical Yoga & Physical Asanas:</h6>
                    <p class="small mb-0">${r.yoga_asanas.join(' → ')}</p>
                `;
            } else {
                container.innerHTML = `<div class="alert alert-danger">Error processing diagnostics analysis: ${wrapper.message}</div>`;
            }
        } catch(err) { container.innerHTML = `<div class="alert alert-danger">AI Service connection timed out. Check microservice availability.</div>`; }
    }

    // --- Doctor Module Logic ---
    async loadDoctorDashboardData() {
        try {
            const res = await fetch(`${this.apiBase}/appointments/doctor`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const wrapper = await res.json();
            const tbody = document.getElementById('doctor-appts-body');
            tbody.innerHTML = '';

            if(wrapper.data && wrapper.data.length > 0) {
                wrapper.data.forEach(a => {
                    tbody.innerHTML += `
                        <tr>
                            <td><strong>${a.patient_name}</strong><br><small class="text-muted">BP: ${a.blood_pressure || 'N/A'} | BMI: ${a.bmi || 'N/A'}</small></td>
                            <td><span class="badge bg-dark">${a.therapy_name}</span></td>
                            <td>${a.appointment_date} [${a.time_slot}]</td>
                            <td><em class="small">${a.notes || 'None'}</em></td>
                            <td>
                                ${a.status === 'pending' ? `
                                    <button class="btn btn-sm btn-success py-1" onclick="app.updateApptStatus(${a.id}, 'confirmed')">Confirm</button>
                                    <button class="btn btn-sm btn-danger py-1" onclick="app.updateApptStatus(${a.id}, 'cancelled')">Cancel</button>
                                ` : `<span class="text-capitalize text-muted small fw-bold">${a.status}</span>`}
                            </td>
                        </tr>`;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No current active cases in pool.</td></tr>';
            }
        } catch(e) { console.error(e); }
    }

    async updateApptStatus(id, targetStatus) {
        try {
            const res = await fetch(`${this.apiBase}/appointments/status/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body: JSON.stringify({ status: targetStatus })
            });
            if(res.ok) {
                this.showToast("Clinical ledger record status synchronized.");
                this.routeDashboard();
            }
        } catch(e) { this.showToast("Mutation processing fault.", true); }
    }

    // --- Admin Module Analytics Integration ---
    async loadAdminDashboardData() {
        try {
            const res = await fetch(`${this.apiBase}/admin/metrics`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const wrapper = await res.json();
            if(!res.ok) return;

            const m = wrapper.metrics;
            document.getElementById('metric-patients').innerText = m.patients;
            document.getElementById('metric-doctors').innerText = m.doctors;
            document.getElementById('metric-appts').innerText = m.appointments;
            document.getElementById('metric-revenue').innerText = `₹${parseFloat(m.revenue).toLocaleString('en-IN')}`;

            // Inject dynamic charting visualization processing using ChartJS
            const ctx = document.getElementById('chartAdminDistribution').getContext('2d');
            
            const labels = wrapper.distribution.map(item => item.name);
            const dataValues = wrapper.distribution.map(item => item.volumes);

            if(this.activeChart) this.activeChart.destroy();

            this.activeChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels.length ? labels : ['No Data'],
                    datasets: [{
                        label: 'Total Sessions Conducted',
                        data: dataValues.length ? dataValues : [0],
                        backgroundColor: '#2d6a4f',
                        borderColor: '#d4af37',
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });

        } catch(e) { console.error("Analytics rendering process fault:", e); }
    }
}

// Global scope encapsulation initialization trigger
const app = new AyurSutraApp();
window.addEventListener('DOMContentLoaded', () => app.init());