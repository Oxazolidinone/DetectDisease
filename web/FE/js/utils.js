/**
 * Utility functions shared across all pages
 */

// API Base URLs - Auto-detect environment
const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalDevelopment
    ? 'http://localhost:8080/api/v1'
    : `http://${window.location.hostname}:8080/api/v1`;
const ML_API_BASE_URL = isLocalDevelopment
    ? 'http://localhost:5001'
    : `http://${window.location.hostname}:5001`;

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
 * API call helper for main backend
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
        showNotification('API connection error', 'error');
        throw error;
    }
}

/**
 * ML Service API call helper
 */
async function mlApiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${ML_API_BASE_URL}${endpoint}`, {
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
        console.error('ML API call failed:', error);
        showNotification('ML service connection error', 'error');
        throw error;
    }
}

/**
 * Predict disease using ML service
 */
async function predictDisease(sequence, model = 'lightgbm_best') {
    return await mlApiCall('/predict/disease', {
        method: 'POST',
        body: JSON.stringify({
            sequence: sequence,
            model: model
        })
    });
}

/**
 * Calculate sequence similarity using ML service
 */
async function calculateSimilarity(sequence1, sequence2) {
    return await mlApiCall('/similarity', {
        method: 'POST',
        body: JSON.stringify({ sequence1, sequence2 })
    });
}

/**
 * Align sequences using ML service
 */
async function alignSequences(sequence1, sequence2) {
    return await mlApiCall('/align', {
        method: 'POST',
        body: JSON.stringify({ sequence1, sequence2 })
    });
}

/**
 * Create protein in backend
 */
async function createProtein(proteinData) {
    return await apiCall('/proteins', {
        method: 'POST',
        body: JSON.stringify(proteinData)
    });
}

/**
 * Get protein by ID
 */
async function getProtein(id) {
    return await apiCall(`/proteins/${id}`);
}

/**
 * Search proteins
 */
async function searchProteins(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value);
        }
    });
    const queryString = params.toString();
    return await apiCall(`/proteins${queryString ? '?' + queryString : ''}`);
}

/**
 * Update protein by ID
 */
async function updateProtein(id, proteinData) {
    return await apiCall(`/proteins/${id}`, {
        method: 'PUT',
        body: JSON.stringify(proteinData)
    });
}

/**
 * Delete protein by ID
 */
async function deleteProtein(id) {
    return await apiCall(`/proteins/${id}`, {
        method: 'DELETE'
    });
}

/**
 * Bulk create proteins
 */
async function bulkCreateProteins(proteinsArray) {
    return await apiCall('/proteins/bulk', {
        method: 'POST',
        body: JSON.stringify(proteinsArray)
    });
}

/**
 * Compare two proteins
 * Backend expects: { protein_id_1: string, protein_id_2: string }
 */
async function compareProteins(proteinId1, proteinId2) {
    return await apiCall('/proteins/compare', {
        method: 'POST',
        body: JSON.stringify({
            protein_id_1: proteinId1,
            protein_id_2: proteinId2
        })
    });
}

/**
 * Display comparison results with visual similarity chart
 */
function displayComparisonResultsWithChart(comparisonData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chartId = 'comparisonChart_' + Date.now();
    const similarity = comparisonData.similarity || 0;
    const similarityPercent = Math.round(similarity * 100);

    container.innerHTML = `
        <div class="comparison-results space-y-6">
            <!-- Similarity Score Visual -->
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white text-center">
                <h3 class="text-lg font-medium mb-2">Sequence Similarity</h3>
                <div class="text-5xl font-bold mb-2">${similarityPercent}%</div>
                <div class="w-full bg-white/30 rounded-full h-4 mt-4">
                    <div class="bg-white rounded-full h-4 transition-all duration-1000" style="width: ${similarityPercent}%"></div>
                </div>
            </div>

            <!-- Protein Comparison Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <h4 class="text-lg font-bold text-blue-600 mb-3">${comparisonData.protein_1?.id || 'Protein 1'}</h4>
                    <div class="space-y-2 text-sm">
                        <p><span class="text-gray-500">Name:</span> <span class="font-medium">${comparisonData.protein_1?.name || 'N/A'}</span></p>
                        <p><span class="text-gray-500">Gene:</span> <span class="font-medium">${comparisonData.protein_1?.gene || 'N/A'}</span></p>
                        <p><span class="text-gray-500">Length:</span> <span class="font-medium">${comparisonData.protein_1?.length || 'N/A'} AA</span></p>
                        <p><span class="text-gray-500">Organism:</span> <span class="font-medium">${comparisonData.protein_1?.taxo || 'N/A'}</span></p>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <h4 class="text-lg font-bold text-purple-600 mb-3">${comparisonData.protein_2?.id || 'Protein 2'}</h4>
                    <div class="space-y-2 text-sm">
                        <p><span class="text-gray-500">Name:</span> <span class="font-medium">${comparisonData.protein_2?.name || 'N/A'}</span></p>
                        <p><span class="text-gray-500">Gene:</span> <span class="font-medium">${comparisonData.protein_2?.gene || 'N/A'}</span></p>
                        <p><span class="text-gray-500">Length:</span> <span class="font-medium">${comparisonData.protein_2?.length || 'N/A'} AA</span></p>
                        <p><span class="text-gray-500">Organism:</span> <span class="font-medium">${comparisonData.protein_2?.taxo || 'N/A'}</span></p>
                    </div>
                </div>
            </div>

            <!-- Properties Comparison Chart -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h4 class="text-lg font-bold text-gray-800 mb-4">Properties Comparison</h4>
                <canvas id="${chartId}" height="200"></canvas>
            </div>

            <!-- Comparison Timestamp -->
            <div class="text-center text-sm text-gray-500">
                Compared at: ${new Date(comparisonData.compared_at).toLocaleString()}
            </div>
        </div>
    `;

    // Render comparison chart
    setTimeout(() => {
        renderComparisonChart(comparisonData, chartId);
    }, 100);
}

/**
 * Render comparison chart for two proteins
 */
function renderComparisonChart(comparisonData, chartId) {
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
        script.onload = () => createComparisonChart(comparisonData, chartId);
        document.head.appendChild(script);
    } else {
        createComparisonChart(comparisonData, chartId);
    }
}

function createComparisonChart(comparisonData, chartId) {
    const ctx = document.getElementById(chartId);
    if (!ctx) return;

    const p1 = comparisonData.protein_1 || {};
    const p2 = comparisonData.protein_2 || {};

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Length (AA)', 'MW (kDa)', 'pI', 'Hydrophobicity'],
            datasets: [
                {
                    label: p1.id || 'Protein 1',
                    data: [
                        p1.length || 0,
                        (p1.mw || 0) / 1000,
                        p1.pi || 0,
                        Math.abs(p1.hydrophobicity_gravy || 0) * 10
                    ],
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2
                },
                {
                    label: p2.id || 'Protein 2',
                    data: [
                        p2.length || 0,
                        (p2.mw || 0) / 1000,
                        p2.pi || 0,
                        Math.abs(p2.hydrophobicity_gravy || 0) * 10
                    ],
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });
}

/**
 * Get protein statistics
 */
async function getProteinStats() {
    return await apiCall('/proteins/stats');
}

/**
 * Analyze protein sequence (calls backend which integrates with ML service)
 * Backend expects: { sequence: []string } - array of sequence strings
 */
async function analyzeProteinSequence(sequence) {
    // Convert sequence to array if it's a string
    const sequenceArray = Array.isArray(sequence) ? sequence : [sequence];
    
    return await apiCall('/proteins/analyze', {
        method: 'POST',
        body: JSON.stringify({
            sequence: sequenceArray
        })
    });
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
            taxo: 'Homo sapiens',
            organism: 'Homo sapiens',
            seq: ['MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT'],
            length: 110,
            mw: 12000,
            pi: 5.4,
            function: 'Hormone involved in glucose metabolism'
        },
        {
            id: 'P69905',
            name: 'Hemoglobin subunit alpha',
            gene: 'HBA1',
            taxo: 'Homo sapiens',
            organism: 'Homo sapiens',
            seq: ['MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH'],
            length: 142,
            mw: 15200,
            pi: 8.7,
            function: 'Oxygen transport from lungs to tissues'
        }
    ],
    stats: {
        total_proteins: 1248,
        avg_length: 567.45,
        avg_mw: 62500.78,
        avg_pi: 6.82,
        avg_n_interactors: 12.5,
        avg_hydrophobicity: -0.234,
        total_genes: 892,
        total_families: 156
    }
};

/**
 * Bulk operations helper - Import proteins from CSV file
 */
async function importProteinsFromCSV(csvContent) {
    try {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const proteins = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',').map(v => v.trim());
            const protein = {};

            headers.forEach((header, index) => {
                if (values[index]) {
                    if (header === 'seq') {
                        protein[header] = [values[index]]; // Backend expects array
                    } else {
                        protein[header] = values[index];
                    }
                }
            });

            if (protein.id && protein.name && protein.seq) {
                proteins.push(protein);
            }
        }

        if (proteins.length > 0) {
            const result = await bulkCreateProteins(proteins);
            showNotification(`Successfully imported ${proteins.length} proteins`, 'success');
            return result;
        } else {
            throw new Error('No valid proteins found in CSV file');
        }
    } catch (error) {
        console.error('CSV import failed:', error);
        showNotification('Failed to import CSV file', 'error');
        throw error;
    }
}

/**
 * Advanced search with multiple filters
 */
async function advancedSearchProteins(searchCriteria) {
    const filters = { limit: 50, offset: 0 };

    // Apply search criteria
    if (searchCriteria.query) {
        if (searchCriteria.query.startsWith('P') || searchCriteria.query.includes('_')) {
            filters.id = searchCriteria.query;
        } else {
            filters.name = searchCriteria.query;
        }
    }

    if (searchCriteria.gene) filters.gene = searchCriteria.gene;
    if (searchCriteria.family) filters.family = searchCriteria.family;
    if (searchCriteria.organism) filters.organism = searchCriteria.organism;
    if (searchCriteria.limit) filters.limit = searchCriteria.limit;
    if (searchCriteria.offset) filters.offset = searchCriteria.offset;

    return await searchProteins(filters);
}

/**
 * Protein management - Get all user saved proteins
 */
function getSavedProteins() {
    return JSON.parse(localStorage.getItem('savedProteins')) || [];
}

/**
 * Clear all saved proteins locally
 */
function clearSavedProteins() {
    localStorage.removeItem('savedProteins');
    showNotification('All saved proteins cleared', 'success');
}

/**
 * Export saved proteins to different formats
 */
function exportSavedProteins(format = 'json') {
    const savedProteins = getSavedProteins();

    if (savedProteins.length === 0) {
        showNotification('No saved proteins to export', 'error');
        return;
    }

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
        exportToCSV(savedProteins, `saved_proteins_${timestamp}.csv`);
    } else {
        exportToJSON(savedProteins, `saved_proteins_${timestamp}.json`);
    }
}

/**
 * Compare proteins and show results
 */
async function compareAndDisplayProteins(id1, id2, containerId) {
    try {
        showNotification('Comparing proteins...', 'info');
        const result = await compareProteins(id1, id2);

        if (result && result.data) {
            displayComparisonResults(result.data, containerId);
            showNotification('Protein comparison completed', 'success');
            return result;
        }
    } catch (error) {
        console.error('Protein comparison failed:', error);
        showNotification('Failed to compare proteins', 'error');
        throw error;
    }
}

/**
 * Display protein comparison results in UI
 */
function displayComparisonResults(comparisonData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="comparison-results bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold mb-4">Protein Comparison Results</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="protein-info">
                    <h4 class="font-semibold text-primary">Protein 1: ${comparisonData.protein1?.id || 'Unknown'}</h4>
                    <p class="text-sm text-gray-600">${comparisonData.protein1?.name || 'No name'}</p>
                    <p class="text-xs text-gray-500">Length: ${comparisonData.protein1?.length || 'Unknown'} AA</p>
                </div>
                <div class="protein-info">
                    <h4 class="font-semibold text-primary">Protein 2: ${comparisonData.protein2?.id || 'Unknown'}</h4>
                    <p class="text-sm text-gray-600">${comparisonData.protein2?.name || 'No name'}</p>
                    <p class="text-xs text-gray-500">Length: ${comparisonData.protein2?.length || 'Unknown'} AA</p>
                </div>
            </div>
            ${comparisonData.similarity ? `
                <div class="similarity-score mt-4 p-4 bg-blue-50 rounded">
                    <h4 class="font-semibold text-blue-800">Similarity Score</h4>
                    <div class="text-2xl font-bold text-blue-600">${Math.round(comparisonData.similarity * 100)}%</div>
                </div>
            ` : ''}
            ${comparisonData.alignment ? `
                <div class="alignment-result mt-4">
                    <h4 class="font-semibold mb-2">Sequence Alignment</h4>
                    <pre class="bg-gray-100 p-3 rounded text-xs overflow-x-auto">${comparisonData.alignment}</pre>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Load and display protein statistics with beautiful charts
 */
async function loadProteinStatistics(containerId) {
    try {
        const stats = await getProteinStats();

        if (stats && stats.data) {
            displayProteinStats(stats.data, containerId);
            return stats.data;
        } else {
            throw new Error('No stats data received');
        }
    } catch (error) {
        console.error('Failed to load protein statistics:', error);
        showNotification('Using mock statistics data', 'error');

        // Show mock stats as fallback - matching ProteinStats struct from backend
        const mockStats = mockData.stats;
        displayProteinStats(mockStats, containerId);
        return mockStats;
    }
}

/**
 * Display protein statistics in UI with beautiful charts
 * Stats from backend: total_proteins, avg_length, avg_mw, avg_pi, 
 * avg_n_interactors, avg_hydrophobicity, total_genes, total_families
 */
function displayProteinStats(stats, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Generate unique IDs for charts
    const chartId1 = 'statsBarChart_' + Date.now();
    const chartId2 = 'statsPieChart_' + Date.now();
    const chartId3 = 'statsRadarChart_' + Date.now();

    container.innerHTML = `
        <div class="stats-container">
            <!-- Summary Cards -->
            <div class="stats-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="stat-card bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-center text-white shadow-lg transform hover:scale-105 transition-transform">
                    <div class="text-3xl font-bold">${(stats.total_proteins || 0).toLocaleString()}</div>
                    <div class="text-sm opacity-90 mt-1">Total Proteins</div>
                </div>
                <div class="stat-card bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-xl text-center text-white shadow-lg transform hover:scale-105 transition-transform">
                    <div class="text-3xl font-bold">${stats.total_genes || 0}</div>
                    <div class="text-sm opacity-90 mt-1">Total Genes</div>
                </div>
                <div class="stat-card bg-gradient-to-br from-purple-500 to-violet-600 p-5 rounded-xl text-center text-white shadow-lg transform hover:scale-105 transition-transform">
                    <div class="text-3xl font-bold">${stats.total_families || 0}</div>
                    <div class="text-sm opacity-90 mt-1">Protein Families</div>
                </div>
                <div class="stat-card bg-gradient-to-br from-orange-500 to-amber-600 p-5 rounded-xl text-center text-white shadow-lg transform hover:scale-105 transition-transform">
                    <div class="text-3xl font-bold">${Math.round(stats.avg_length || 0)}</div>
                    <div class="text-sm opacity-90 mt-1">Avg Length (AA)</div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Bar Chart: Average Values -->
                <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h4 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <span class="material-symbols-outlined mr-2 text-blue-500">bar_chart</span>
                        Average Properties
                    </h4>
                    <canvas id="${chartId1}" height="250"></canvas>
                </div>

                <!-- Pie/Doughnut Chart: Distribution -->
                <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h4 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <span class="material-symbols-outlined mr-2 text-purple-500">donut_large</span>
                        Database Composition
                    </h4>
                    <canvas id="${chartId2}" height="250"></canvas>
                </div>
            </div>

            <!-- Radar Chart: Protein Properties -->
            <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h4 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span class="material-symbols-outlined mr-2 text-green-500">radar</span>
                    Protein Properties Overview
                </h4>
                <div class="max-w-lg mx-auto">
                    <canvas id="${chartId3}" height="300"></canvas>
                </div>
            </div>

            <!-- Detailed Stats Table -->
            <div class="mt-6 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h4 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span class="material-symbols-outlined mr-2 text-indigo-500">table_chart</span>
                    Detailed Statistics
                </h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="text-left py-3 px-4 font-semibold text-gray-600">Metric</th>
                                <th class="text-right py-3 px-4 font-semibold text-gray-600">Value</th>
                                <th class="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr class="hover:bg-gray-50">
                                <td class="py-3 px-4 font-medium">Average Length</td>
                                <td class="py-3 px-4 text-right font-mono text-blue-600">${(stats.avg_length || 0).toFixed(2)} AA</td>
                                <td class="py-3 px-4 text-gray-500">Mean amino acid count per protein</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="py-3 px-4 font-medium">Average Molecular Weight</td>
                                <td class="py-3 px-4 text-right font-mono text-green-600">${(stats.avg_mw || 0).toFixed(2)} Da</td>
                                <td class="py-3 px-4 text-gray-500">Mean molecular weight in Daltons</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="py-3 px-4 font-medium">Average pI (Isoelectric Point)</td>
                                <td class="py-3 px-4 text-right font-mono text-purple-600">${(stats.avg_pi || 0).toFixed(2)}</td>
                                <td class="py-3 px-4 text-gray-500">Mean isoelectric point</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="py-3 px-4 font-medium">Average Hydrophobicity (GRAVY)</td>
                                <td class="py-3 px-4 text-right font-mono text-orange-600">${(stats.avg_hydrophobicity || 0).toFixed(4)}</td>
                                <td class="py-3 px-4 text-gray-500">Grand average of hydropathicity</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="py-3 px-4 font-medium">Average Interactors</td>
                                <td class="py-3 px-4 text-right font-mono text-indigo-600">${(stats.avg_n_interactors || 0).toFixed(2)}</td>
                                <td class="py-3 px-4 text-gray-500">Mean number of protein interactions</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Render charts after DOM is updated
    setTimeout(() => {
        renderStatsCharts(stats, chartId1, chartId2, chartId3);
    }, 100);
}

/**
 * Render Chart.js charts for statistics
 */
function renderStatsCharts(stats, barChartId, pieChartId, radarChartId) {
    // Check if Chart.js is available, if not load it
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
        script.onload = () => renderStatsChartsWithChartJS(stats, barChartId, pieChartId, radarChartId);
        document.head.appendChild(script);
    } else {
        renderStatsChartsWithChartJS(stats, barChartId, pieChartId, radarChartId);
    }
}

/**
 * Actually render charts using Chart.js
 */
function renderStatsChartsWithChartJS(stats, barChartId, pieChartId, radarChartId) {
    // Bar Chart - Average Values
    const barCtx = document.getElementById(barChartId);
    if (barCtx) {
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Avg Length', 'Avg MW (kDa)', 'Avg pI', 'Avg Interactors'],
                datasets: [{
                    label: 'Average Values',
                    data: [
                        stats.avg_length || 0,
                        (stats.avg_mw || 0) / 1000, // Convert to kDa for better visualization
                        stats.avg_pi || 0,
                        stats.avg_n_interactors || 0
                    ],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                if (label.includes('MW')) return `${context.raw.toFixed(2)} kDa`;
                                if (label.includes('pI')) return `${context.raw.toFixed(2)}`;
                                return `${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // Doughnut Chart - Database Composition
    const pieCtx = document.getElementById(pieChartId);
    if (pieCtx) {
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Proteins', 'Genes', 'Families'],
                datasets: [{
                    data: [
                        stats.total_proteins || 0,
                        stats.total_genes || 0,
                        stats.total_families || 0
                    ],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(139, 92, 246, 0.8)'
                    ],
                    borderColor: ['#fff', '#fff', '#fff'],
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${context.raw.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Radar Chart - Protein Properties
    const radarCtx = document.getElementById(radarChartId);
    if (radarCtx) {
        // Normalize values for radar chart (0-100 scale)
        const maxLength = 1000;
        const maxMW = 100000;
        const maxPI = 14;
        const maxHydro = 2;
        const maxInteractors = 50;

        new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Length', 'Mol. Weight', 'pI', 'Hydrophobicity', 'Interactors'],
                datasets: [{
                    label: 'Normalized Average Values',
                    data: [
                        Math.min(((stats.avg_length || 0) / maxLength) * 100, 100),
                        Math.min(((stats.avg_mw || 0) / maxMW) * 100, 100),
                        Math.min(((stats.avg_pi || 0) / maxPI) * 100, 100),
                        Math.min((Math.abs(stats.avg_hydrophobicity || 0) / maxHydro) * 100, 100),
                        Math.min(((stats.avg_n_interactors || 0) / maxInteractors) * 100, 100)
                    ],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const labels = ['Length', 'MW', 'pI', 'Hydrophobicity', 'Interactors'];
                                const values = [
                                    `${(stats.avg_length || 0).toFixed(1)} AA`,
                                    `${(stats.avg_mw || 0).toFixed(0)} Da`,
                                    `${(stats.avg_pi || 0).toFixed(2)}`,
                                    `${(stats.avg_hydrophobicity || 0).toFixed(4)}`,
                                    `${(stats.avg_n_interactors || 0).toFixed(1)}`
                                ];
                                return values[context.dataIndex];
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { stepSize: 20 },
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        angleLines: { color: 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });
    }
}

/**
 * Batch operations handler
 */
const BatchOperations = {
    selectedProteins: new Set(),

    toggleSelection(proteinId) {
        if (this.selectedProteins.has(proteinId)) {
            this.selectedProteins.delete(proteinId);
        } else {
            this.selectedProteins.add(proteinId);
        }
        this.updateSelectionUI();
    },

    selectAll(proteinIds) {
        proteinIds.forEach(id => this.selectedProteins.add(id));
        this.updateSelectionUI();
    },

    clearSelection() {
        this.selectedProteins.clear();
        this.updateSelectionUI();
    },

    async deleteSelected() {
        if (this.selectedProteins.size === 0) {
            showNotification('No proteins selected', 'error');
            return;
        }

        const confirmed = confirm(`Delete ${this.selectedProteins.size} selected proteins?`);
        if (!confirmed) return;

        try {
            const deletePromises = Array.from(this.selectedProteins).map(id => deleteProtein(id));
            await Promise.all(deletePromises);

            showNotification(`Successfully deleted ${this.selectedProteins.size} proteins`, 'success');
            this.clearSelection();

            // Refresh the protein list
            if (typeof performSearch === 'function') {
                performSearch();
            }
        } catch (error) {
            console.error('Batch delete failed:', error);
            showNotification('Failed to delete selected proteins', 'error');
        }
    },

    updateSelectionUI() {
        const count = this.selectedProteins.size;
        const selectionInfo = document.getElementById('selection-info');

        if (selectionInfo) {
            selectionInfo.textContent = count > 0 ? `${count} selected` : '';
            selectionInfo.style.display = count > 0 ? 'block' : 'none';
        }

        // Update checkbox states
        document.querySelectorAll('.protein-checkbox').forEach(checkbox => {
            const proteinId = checkbox.dataset.proteinId;
            checkbox.checked = this.selectedProteins.has(proteinId);
        });
    }
};

/**
 * Use mock data (for testing without backend)
 */
function useMockData() {
    console.log('Using mock data for testing');
    return mockData;
}

console.log('Utils.js loaded successfully - All API methods implemented');