/**
 * Utility functions shared across all pages
 */

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 9999;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

/**
 * Format date to readable format
 */
function formatDate(date) {
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * API call helper
 */
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showNotification('Lỗi kết nối', 'error');
        throw error;
    }
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Get URL parameters
 */
function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

/**
 * Copy to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Đã sao chép!', 'success');
    }).catch(() => {
        showNotification('Sao chép thất bại', 'error');
    });
}

/**
 * Download file
 */
function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

/**
 * Export data to CSV
 */
function exportToCSV(data, filename = 'export.csv') {
    const csv = data.map(row => 
        Object.values(row).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, filename);
}

/**
 * Export data to JSON
 */
function exportToJSON(data, filename = 'export.json') {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadFile(blob, filename);
}

/**
 * Validate email
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate protein sequence
 */
function validateProteinSequence(sequence) {
    // Remove whitespace and special characters
    const cleaned = sequence.replace(/[\s>]/g, '').toUpperCase();
    // Check if only contains valid amino acid codes
    const valid = /^[ACDEFGHIKLMNPQRSTVWY*]*$/i.test(cleaned);
    return valid;
}

/**
 * Truncate text
 */
function truncateText(text, length = 50) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}

/**
 * Parse FASTA sequence
 */
function parseFASTA(fastaText) {
    const lines = fastaText.trim().split('\n');
    let header = '';
    let sequence = '';
    
    for (let line of lines) {
        if (line.startsWith('>')) {
            header = line.substring(1);
        } else {
            sequence += line.replace(/\s/g, '');
        }
    }
    
    return { header, sequence };
}

/**
 * Get random color
 */
function getRandomColor() {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Hide element
 */
function hideElement(selector) {
    const el = document.querySelector(selector);
    if (el) el.style.display = 'none';
}

/**
 * Show element
 */
function showElement(selector, display = 'block') {
    const el = document.querySelector(selector);
    if (el) el.style.display = display;
}

/**
 * Toggle element visibility
 */
function toggleElement(selector) {
    const el = document.querySelector(selector);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

/**
 * Add class to element
 */
function addClass(selector, className) {
    const el = document.querySelector(selector);
    if (el) el.classList.add(className);
}

/**
 * Remove class from element
 */
function removeClass(selector, className) {
    const el = document.querySelector(selector);
    if (el) el.classList.remove(className);
}

/**
 * Check if element has class
 */
function hasClass(selector, className) {
    const el = document.querySelector(selector);
    return el ? el.classList.contains(className) : false;
}

/**
 * Get element text content
 */
function getTextContent(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent : '';
}

/**
 * Set element text content
 */
function setTextContent(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
}

/**
 * Get element HTML
 */
function getHTML(selector) {
    const el = document.querySelector(selector);
    return el ? el.innerHTML : '';
}

/**
 * Set element HTML
 */
function setHTML(selector, html) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
}

/**
 * Load mock data for testing (when backend is not available)
 */
const mockData = {
    predictions: [
        {
            id: '1',
            function: 'Hormone Activity',
            description: 'Regulates glucose metabolism and blood sugar levels',
            score: 96,
            evidence: { type: 'Experimental' }
        },
        {
            id: '2',
            function: 'Receptor Binding',
            description: 'Binds to insulin receptor on cell surface',
            score: 93,
            evidence: { type: 'Computational' }
        },
        {
            id: '3',
            function: 'Signal Transduction',
            description: 'Activates downstream signaling pathways',
            score: 78,
            evidence: { type: 'Literature' }
        }
    ],
    jobs: [
        {
            id: 'JOB-2025-001',
            name: 'Insulin Protein Analysis',
            date: new Date(),
            status: 'Completed'
        },
        {
            id: 'JOB-2025-002',
            name: 'Hemoglobin Sequence',
            date: new Date(Date.now() - 86400000),
            status: 'Processing'
        },
        {
            id: 'JOB-2025-003',
            name: 'Antibody Structure',
            date: new Date(Date.now() - 172800000),
            status: 'Completed'
        }
    ],
    proteins: [
        {
            id: 'P01308',
            name: 'Insulin',
            gene: 'INS',
            organism: 'Homo sapiens',
            function: 'Hormone involved in glucose metabolism'
        },
        {
            id: 'P69905',
            name: 'Hemoglobin subunit alpha',
            gene: 'HBA1',
            organism: 'Homo sapiens',
            function: 'Oxygen transport from lungs to tissues'
        }
    ]
};

/**
 * Use mock data (for testing without backend)
 */
function useMockData() {
    console.log('Using mock data for testing');
    return mockData;
}

console.log('Utils.js loaded successfully');