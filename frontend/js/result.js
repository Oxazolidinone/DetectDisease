// Result Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Result.js loaded');
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize export buttons
    initializeExport();
    
    // Initialize search
    initializeSearch();
    
    // Initialize table rows
    initializeTableRows();
    
    // Load result data
    loadResultData();
});

/**
 * Initialize navigation
 */
function initializeNavigation() {
    const navLinks = document.querySelectorAll('a[href*="dashboard"], a[href*="input"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('http')) {
                e.preventDefault();
                window.location.href = href;
            }
        });
    });
}

/**
 * Initialize export buttons
 */
function initializeExport() {
    const exportBtn = document.getElementById('export-btn');
    const shareBtn = document.getElementById('share-btn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            console.log('Export clicked');
            showNotification('Đang tải file...', 'info');
            exportResults();
        });
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            console.log('Share clicked');
            shareResults();
        });
    }
}

/**
 * Export results
 */
function exportResults() {
    const data = useMockData().predictions;
    exportToJSON(data, 'protein-predictions.json');
    showNotification('Đã tải file JSON', 'success');
}

/**
 * Share results
 */
function shareResults() {
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: 'Protein Prediction Results',
            url: url
        });
    } else {
        copyToClipboard(url);
        showNotification('Đã sao chép link', 'success');
    }
}

/**
 * Initialize search filter
 */
function initializeSearch() {
    const searchInput = document.querySelector('input[placeholder*="Filter"]');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            filterResults(this.value);
        }, 300));
    }
}

/**
 * Filter results
 */
function filterResults(query) {
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

/**
 * Initialize table row interactions
 */
function initializeTableRows() {
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        row.addEventListener('click', function() {
            console.log('Row clicked');
            this.style.backgroundColor = '#f3f4f6';
            setTimeout(() => {
                this.style.backgroundColor = '';
            }, 200);
        });
    });
}

/**
 * Load result data
 */
function loadResultData() {
    const jobId = getUrlParameter('id');
    console.log('Loading results for job:', jobId);
    
    const data = useMockData();
    const tbody = document.querySelector('tbody');
    
    if (tbody && data.predictions) {
        tbody.innerHTML = data.predictions.map((pred, idx) => `
            <tr class="fade-in" style="animation-delay: ${idx * 100}ms;">
                <td>
                    <div class="function-name">${pred.function}</div>
                    <div class="function-description">${pred.description || ''}</div>
                </td>
                <td>
                    <div class="confidence-score">
                        <span>${pred.score}%</span>
                    </div>
                </td>
                <td>
                    <span class="evidence-badge">${pred.evidence.type}</span>
                </td>
                <td>
                    <span class="badge">${pred.score >= 80 ? 'High' : pred.score >= 60 ? 'Medium' : 'Low'} Confidence</span>
                </td>
                <td>
                    <button onclick="showDetails('${pred.id}')" class="text-primary hover:underline">
                        View Details
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

/**
 * Show details
 */
function showDetails(predictionId) {
    console.log('Showing details for:', predictionId);
    showNotification('Chi tiết dự đoán cho: ' + predictionId, 'info');
}