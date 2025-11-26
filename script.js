// ===========================
// Application State
// ===========================
let payments = JSON.parse(localStorage.getItem('payments')) || [];

// ===========================
// DOM Elements
// ===========================
const paymentForm = document.getElementById('paymentForm');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const paymentHistory = document.getElementById('paymentHistory');

// ===========================
// Initialize Application
// ===========================
function init() {
    // Set today's date as default
    document.getElementById('paymentDate').valueAsDate = new Date();
    
    // Attach event listeners
    paymentForm.addEventListener('submit', handleFormSubmit);
    clearBtn.addEventListener('click', handleClearForm);
    exportBtn.addEventListener('click', handleExport);
    clearAllBtn.addEventListener('click', handleClearAll);
    
    // Initial render
    displayPayments();
    updateStats();
}

// ===========================
// Form Handlers
// ===========================
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Collect form data
    const payment = {
        id: Date.now(),
        studentName: document.getElementById('studentName').value.trim(),
        studentId: document.getElementById('studentId').value.trim() || 'N/A',
        amount: parseFloat(document.getElementById('amount').value),
        date: document.getElementById('paymentDate').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        course: document.getElementById('course').value.trim() || 'N/A',
        notes: document.getElementById('notes').value.trim() || 'N/A',
        timestamp: new Date().toISOString(),
        status: 'Paid'
    };
    
    // Validate amount
    if (payment.amount <= 0) {
        showNotification('Error', 'Amount must be greater than zero', 'error');
        return;
    }
    
    // Add to payments array (newest first)
    payments.unshift(payment);
    
    // Save to localStorage
    savePayments();
    
    // Show success notification
    showNotification(
        'Payment Recorded Successfully',
        `Payment of $${payment.amount.toFixed(2)} from ${payment.studentName} has been recorded.`,
        'success'
    );
    
    // Reset form
    handleClearForm();
    
    // Update UI
    displayPayments();
    updateStats();
}

function handleClearForm() {
    paymentForm.reset();
    document.getElementById('paymentDate').valueAsDate = new Date();
}

function handleExport() {
    if (payments.length === 0) {
        showNotification('No Data', 'There are no payments to export.', 'error');
        return;
    }
    
    // Create CSV content
    const headers = ['Date', 'Student Name', 'Student ID', 'Course', 'Amount', 'Payment Method', 'Status', 'Notes'];
    const csvContent = [
        headers.join(','),
        ...payments.map(p => [
            p.date,
            `"${p.studentName}"`,
            p.studentId,
            `"${p.course}"`,
            p.amount,
            p.paymentMethod,
            p.status,
            `"${p.notes}"`
        ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `CAMANDA_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Export Successful', `${payments.length} payments exported to CSV.`, 'success');
}

function handleClearAll() {
    if (payments.length === 0) {
        showNotification('No Data', 'There are no payments to clear.', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete all ${payments.length} payment records? This action cannot be undone.`)) {
        payments = [];
        savePayments();
        displayPayments();
        updateStats();
        showNotification('Data Cleared', 'All payment records have been deleted.', 'success');
    }
}

// ===========================
// Display Functions
// ===========================
function displayPayments() {
    if (payments.length === 0) {
        paymentHistory.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <h3>No Payments Yet</h3>
                <p>Add your first payment to get started tracking student payments</p>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <table class="payment-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Course</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    payments.forEach(payment => {
        const formattedDate = formatDate(payment.date);
        
        tableHTML += `
            <tr>
                <td>${formattedDate}</td>
                <td><strong>${escapeHtml(payment.studentName)}</strong></td>
                <td>${escapeHtml(payment.studentId)}</td>
                <td>${escapeHtml(payment.course)}</td>
                <td><strong>$${payment.amount.toFixed(2)}</strong></td>
                <td><span class="payment-method-badge">${escapeHtml(payment.paymentMethod)}</span></td>
                <td><span class="status-badge status-paid">${payment.status}</span></td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    paymentHistory.innerHTML = tableHTML;
}

function updateStats() {
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate this month's payments
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyAmount = payments
        .filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);
    
    // Update DOM
    document.getElementById('totalPayments').textContent = totalPayments.toLocaleString();
    document.getElementById('totalAmount').textContent = `$${totalAmount.toFixed(2)}`;
    document.getElementById('monthlyAmount').textContent = `$${monthlyAmount.toFixed(2)}`;
}

// ===========================
// Notification System
// ===========================
function showNotification(title, message, type = 'success') {
    const notification = document.getElementById('notification');
    const icon = type === 'success' ? '✅' : '⚠️';
    
    notification.className = `notification ${type} show`;
    notification.innerHTML = `
        <h3>${icon} ${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
    `;
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// ===========================
// Utility Functions
// ===========================
function savePayments() {
    localStorage.setItem('payments', JSON.stringify(payments));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================
// Auto-save functionality
// ===========================
window.addEventListener('beforeunload', () => {
    savePayments();
});

// ===========================
// Start Application
// ===========================
document.addEventListener('DOMContentLoaded', init);