// Data Models
let complaints = JSON.parse(localStorage.getItem('complaints')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// DOM Elements
const sections = {
    login: document.getElementById('login-section'),
    student: document.getElementById('student-dashboard'),
    admin: document.getElementById('admin-dashboard')
};

const loginForm = document.getElementById('login-form');
const complaintForm = document.getElementById('complaint-form');
const logoutBtn = document.getElementById('logout-btn');
const toast = document.getElementById('toast');

// Current login role context visually selected
let selectedRole = 'student';

// Initialize App
function init() {
    setupEventListeners();
    checkAuth();
}

function setupEventListeners() {
    // Login role tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedRole = e.target.getAttribute('data-role');
            document.getElementById('username').placeholder = selectedRole === 'admin' ? "Admin ID" : "e.g. S12345";
        });
    });

    // Forms
    loginForm.addEventListener('submit', handleLogin);
    if(complaintForm) {
        complaintForm.addEventListener('submit', handleComplaintSubmit);
    }
    logoutBtn.addEventListener('click', handleLogout);
}

// Authentication
function checkAuth() {
    if (!currentUser) {
        showSection('login');
        logoutBtn.classList.add('hidden');
    } else {
        logoutBtn.classList.remove('hidden');
        if (currentUser.role === 'admin') {
            showSection('admin');
            renderAdminDashboard();
        } else {
            showSection('student');
            renderStudentDashboard();
        }
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    
    if(!username) return;

    // Simulate login
    currentUser = {
        username: username,
        role: selectedRole
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showToast(`Logged in successfully as ${username}`, 'success');
    loginForm.reset();
    checkAuth();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showToast('Logged out securely', 'success');
    checkAuth();
}

// Student Dashboard Logic
function handleComplaintSubmit(e) {
    e.preventDefault();
    
    const newComplaint = {
        id: 'C-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        userId: currentUser.username,
        category: document.getElementById('c-category').value,
        subject: document.getElementById('c-subject').value,
        description: document.getElementById('c-desc').value,
        status: 'Pending',
        timestamp: new Date().toISOString(),
    };

    complaints.push(newComplaint);
    saveData();
    
    showToast('Complaint submitted successfully!', 'success');
    complaintForm.reset();
    renderStudentDashboard();
}

function renderStudentDashboard() {
    const listEl = document.getElementById('student-complaints-list');
    const userComplaints = complaints.filter(c => c.userId === currentUser.username)
                                     .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (userComplaints.length === 0) {
        listEl.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 2rem 0;">No complaints submitted yet.</p>';
        return;
    }

    listEl.innerHTML = userComplaints.map(c => `
        <div class="complaint-item">
            <div class="c-header">
                <span class="c-title">${c.subject}</span>
                <span class="badge ${c.status.toLowerCase()}">${c.status}</span>
            </div>
            <p>${c.description}</p>
            <div class="c-meta">
                <span>📁 ${c.category}</span>
                <span>🕒 ${new Date(c.timestamp).toLocaleDateString()}</span>
                <span>#${c.id}</span>
            </div>
        </div>
    `).join('');
}

// Admin Dashboard Logic
function renderAdminDashboard() {
    // Update Stats
    document.getElementById('stat-total').innerText = complaints.length;
    document.getElementById('stat-pending').innerText = complaints.filter(c => c.status === 'Pending').length;
    document.getElementById('stat-resolved').innerText = complaints.filter(c => c.status === 'Resolved').length;

    // Update Table
    const tbody = document.getElementById('admin-complaints-table');
    const sortedComplaints = [...complaints].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if(sortedComplaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No complaints found.</td></tr>';
        return;
    }

    tbody.innerHTML = sortedComplaints.map(c => `
        <tr>
            <td><strong>${c.id}</strong></td>
            <td>${c.userId}</td>
            <td>${c.category}</td>
            <td>${c.subject}</td>
            <td><span class="badge ${c.status.toLowerCase()}">${c.status}</span></td>
            <td>
                ${c.status === 'Pending' 
                    ? `<button class="btn btn-outline btn-sm btn-success" onclick="resolveComplaint('${c.id}')">✓ Mark Resolved</button>`
                    : '<span style="color:var(--text-muted); font-size:0.85rem;">Resolved ✓</span>'
                }
            </td>
        </tr>
    `).join('');
}

window.resolveComplaint = function(id) {
    const cIndex = complaints.findIndex(c => c.id === id);
    if(cIndex > -1) {
        complaints[cIndex].status = 'Resolved';
        saveData();
        showToast(`Complaint ${id} marked as resolved`, 'success');
        renderAdminDashboard();
    }
}

// Utilities
function showSection(sectionId) {
    // Hide all sections first
    Object.values(sections).forEach(sec => {
        if(sec) {
            sec.classList.remove('active');
            sec.classList.add('hidden');
        }
    });
    // Show target section
    if(sections[sectionId]) {
        sections[sectionId].classList.remove('hidden');
        sections[sectionId].classList.add('active');
    }
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    
    // Reset classes and add specific type
    toast.className = 'toast';
    toast.classList.add(type);
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

function saveData() {
    localStorage.setItem('complaints', JSON.stringify(complaints));
}

// Boot up
init();
