// Dashboard Functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard.js loaded');
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize buttons
    initializeButtons();
    
    // Initialize table interactions
    initializeTableInteractions();
    
    // Load dashboard data
    loadDashboardData();
    
    // Tab switching
    const tabs = document.querySelectorAll('[role="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('aria-controls');
            
            tabs.forEach(t => {
                t.classList.remove('active','font-bold');
                t.classList.add('text-gray-600');
            });
            
            document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
                panel.classList.add('hidden');
            });
            
            this.classList.add('active', 'font-bold');
            this.classList.remove('text-gray-600');
            
            const panel = document.getElementById(tabName);
            if (panel) {
                panel.classList.remove('hidden');
            }
        });
    });
    
    // Load saved proteins
    loadSavedProteins();
    
    // Load recently saved proteins
    loadRecentlySavedProteins();
    
    // Load recently predictions
    loadRecentlyPredictions();
    
    updateStats();
});

/**
 * Initialize navigation
 */
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && window.location.pathname.includes(href.split('/').pop())) {
            item.classList.add('active');
        }
        
        item.addEventListener('click', function(e) {
            if (!this.getAttribute('href').startsWith('#')) {
                console.log('Navigate to:', this.getAttribute('href'));
            }
        });
    });
}

/**
 * Initialize button interactions
 */
function initializeButtons() {
    // Start New Prediction button
    const startPredictionBtn = document.querySelector('button:has(span:contains("Start New Prediction"))');
    if (startPredictionBtn) {
        startPredictionBtn.addEventListener('click', function() {
            console.log('Start New Prediction clicked');
            window.location.href = 'input.html';
        });
    }
    
    // All buttons with text
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
        const text = btn.textContent.toLowerCase();
        
        if (text.includes('new prediction') || text.includes('start new')) {
            btn.addEventListener('click', function() {
                console.log('Navigate to input');
                window.location.href = 'input.html';
            });
        }
        
        if (text.includes('view results')) {
            btn.addEventListener('click', function(e) {
                const row = this.closest('tr');
                const jobId = row?.querySelector('.job-id')?.textContent || 'unknown';
                console.log('View results clicked for:', jobId);
                window.location.href = `result.html?id=${jobId}`;
            });
        }
    });
}

/**
 * Initialize table row interactions
 */
function initializeTableInteractions() {
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const links = row.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href && !href.startsWith('http') && href !== '#') {
                    e.preventDefault();
                    window.location.href = href;
                }
            });
        });
    });
}

/**
 * Load dashboard data
 */
function loadDashboardData() {
    console.log('Loading dashboard data');
    
    // Use mock data for now
    const data = useMockData();
    
    // Update stats if elements exist
    document.querySelectorAll('[data-stat]').forEach(el => {
        const stat = el.getAttribute('data-stat');
        if (stat === 'total') el.textContent = data.jobs.length;
        if (stat === 'processing') el.textContent = data.jobs.filter(j => j.status === 'Processing').length;
        if (stat === 'saved') el.textContent = '89';
    });
}

function updateStats() {
    // Lấy predictions từ localStorage
    let predictions = JSON.parse(localStorage.getItem('predictions')) || [];
    let savedProteins = JSON.parse(localStorage.getItem('savedProteins')) || [];
    
    // Tính toán
    const totalPredictions = predictions.length;
    const processingJobs = predictions.filter(p => p.status === 'Processing').length;
    const totalSaved = savedProteins.length;
    
    // Update UI
    document.getElementById('total-predictions').textContent = totalPredictions;
    document.getElementById('processing-jobs').textContent = processingJobs;
    document.getElementById('total-saved-proteins').textContent = totalSaved;
}

function loadSavedProteins() {
    let savedProteins = JSON.parse(localStorage.getItem('savedProteins')) || [];
    
    // Sắp xếp theo ngày lưu mới nhất
    savedProteins.sort((a, b) => {
        return new Date(b.savedAt) - new Date(a.savedAt);
    });
    
    const list = document.getElementById('saved-proteins-list');
    const noSaved = document.getElementById('no-saved');
    
    if (savedProteins.length === 0) {
        noSaved.classList.remove('hidden');
        list.innerHTML = '';
        return;
    }
    
    noSaved.classList.add('hidden');
    
    // Hiển thị "Recently Saved" (5 mục gần đây)
    const recentlySaved = savedProteins.slice(0, 5);
    
    list.innerHTML = `
        <tr class="bg-blue-50">
            <td colspan="5" class="py-2 px-4 font-semibold text-blue-700">Recently Saved</td>
        </tr>
        ${recentlySaved.map(protein => `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">${protein.id}</td>
                <td class="py-3 px-4">${protein.name}</td>
                <td class="py-3 px-4">${protein.organism}</td>
                <td class="py-3 px-4 text-sm text-gray-500">${protein.savedAt}</td>
                <td class="py-3 px-4">
                    <button class="remove-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm" data-id="${protein.id}">Remove</button>
                </td>
            </tr>
        `).join('')}
        ${savedProteins.length > 5 ? `
            <tr class="bg-gray-50">
                <td colspan="5" class="py-2 px-4 font-semibold text-gray-700">All Saved Proteins</td>
            </tr>
            ${savedProteins.slice(5).map(protein => `
                <tr class="border-b hover:bg-gray-50">
                    <td class="py-3 px-4">${protein.id}</td>
                    <td class="py-3 px-4">${protein.name}</td>
                    <td class="py-3 px-4">${protein.organism}</td>
                    <td class="py-3 px-4 text-sm text-gray-500">${protein.savedAt}</td>
                    <td class="py-3 px-4">
                        <button class="remove-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm" data-id="${protein.id}">Remove</button>
                    </td>
                </tr>
            `).join('')}
        ` : ''}
    `;
    
    // Add remove functionality
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            let saved = JSON.parse(localStorage.getItem('savedProteins')) || [];
            saved = saved.filter(p => p.id !== id);
            localStorage.setItem('savedProteins', JSON.stringify(saved));
            loadSavedProteins();
        });
    });
}

function loadRecentlyPredictions() {
    let predictions = JSON.parse(localStorage.getItem('predictions')) || [];
    
    predictions.sort((a, b) => {
        return new Date(b.submissionDate) - new Date(a.submissionDate);
    });
    
    const list = document.getElementById('recent-predictions-list');
    
    if (predictions.length === 0) {
        list.innerHTML = `
            <tr>
                <td colspan="4" class="py-6 text-center text-gray-500">
                    No predictions yet. <a href="input.html" class="text-blue-500 hover:underline">Start a new prediction</a>
                </td>
            </tr>
        `;
        return;
    }
    
    const recentPredictions = predictions.slice(0, 5);
    
    list.innerHTML = recentPredictions.map(pred => `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4 font-medium text-gray-900">${pred.jobName}</td>
            <td class="py-3 px-4 text-gray-600 text-sm">${new Date(pred.submissionDate).toLocaleDateString('en-US')}</td>
            <td class="py-3 px-4">
                <span class="px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(pred.status)}">
                    ${pred.status}
                </span>
            </td>
            <td class="py-3 px-4">
                <a href="result.html?id=${pred.id}" class="text-blue-500 hover:underline text-sm">View Results</a>
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    const statusMap = {
        'Completed': 'bg-green-100 text-green-800',
        'Processing': 'bg-yellow-100 text-yellow-800',
        'Failed': 'bg-red-100 text-red-800',
        'Pending': 'bg-gray-100 text-gray-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
}

function loadRecentlySavedProteins() {
    let savedProteins = JSON.parse(localStorage.getItem('savedProteins')) || [];
    
    savedProteins.sort((a, b) => {
        return new Date(b.savedAt) - new Date(a.savedAt);
    });
    
    const list = document.getElementById('recently-saved-list');
    
    if (savedProteins.length === 0) {
        list.innerHTML = `
            <tr>
                <td colspan="4" class="py-6 text-center text-gray-500">
                    No saved proteins yet. <a href="database.html" class="text-blue-500 hover:underline">Browse database</a>
                </td>
            </tr>
        `;
        return;
    }
    
    const recentlySaved = savedProteins.slice(0, 5);
    
    list.innerHTML = recentlySaved.map(protein => `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4 font-medium text-gray-900">${protein.id}</td>
            <td class="py-3 px-4 text-gray-600">${protein.organism}</td>
            <td class="py-3 px-4 text-gray-600 text-sm">${new Date(protein.savedAt).toLocaleDateString('en-US')}</td>
            <td class="py-3 px-4">
                <button class="remove-saved-btn text-red-500 hover:text-red-700 text-sm font-medium" data-id="${protein.id}">Remove</button>
            </td>
        </tr>
    `).join('');
    
    document.querySelectorAll('.remove-saved-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            let saved = JSON.parse(localStorage.getItem('savedProteins')) || [];
            saved = saved.filter(p => p.id !== id);
            localStorage.setItem('savedProteins', JSON.stringify(saved));
            loadRecentlySavedProteins();
            updateStats();
        });
    });
}

// Listen for storage changes
window.addEventListener('storage', function(e) {
    if (e.key === 'predictions' || e.key === 'savedProteins') {
        updateStats();
        loadRecentlyPredictions();
        loadRecentlySavedProteins();
    }
});

// Refresh mỗi 2 giây
setInterval(function() {
    updateStats();
    loadRecentlyPredictions();
    loadRecentlySavedProteins();
}, 2000);