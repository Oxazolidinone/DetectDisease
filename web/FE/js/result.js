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
async function loadResultData() {
    const jobId = getUrlParameter('id');
    console.log('Loading results for job:', jobId);

    // Try to get analysis results from localStorage
    let analysisData = JSON.parse(localStorage.getItem('lastAnalysis'));

    // If no data found, try to fetch from backend
    if (!analysisData || analysisData.id !== jobId) {
        try {
            // Try to get protein analysis from backend
            analysisData = await getProteinAnalysis(jobId);
        } catch (error) {
            console.log('Failed to fetch analysis from backend, using mock data');
            analysisData = createMockAnalysis(jobId);
        }
    }

    displayAnalysisResults(analysisData);
}

/**
 * Display analysis results
 */
function displayAnalysisResults(data) {
    const tbody = document.querySelector('tbody');
    const sequenceInfo = document.getElementById('sequence-info');

    // Display sequence information
    if (sequenceInfo && data.sequence) {
        const modelName = data.model_used || 'lightgbm_best';
        const modelDisplay = {
            'lightgbm_best': 'LightGBM Best',
            'xgboost': 'XGBoost',
            'random_forest': 'Random Forest',
            'lightgbm': 'LightGBM'
        }[modelName] || modelName;

        sequenceInfo.innerHTML = `
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6 border border-blue-200">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 class="font-semibold text-gray-800 mb-2">Analyzed Sequence</h3>
                        ${data.protein_name ? `<div class="text-sm text-gray-700 font-medium mb-1">🧬 ${data.protein_name}</div>` : ''}
                        ${data.gene_name ? `<div class="text-xs text-gray-600 mb-1">Gene: ${data.gene_name}</div>` : ''}
                        <div class="text-sm text-gray-600 mb-2">Length: ${data.sequence_length || data.sequence.length} amino acids</div>
                        <div class="font-mono text-xs bg-white p-2 rounded border max-h-20 overflow-y-auto">
                            ${data.sequence.substring(0, 200)}${data.sequence.length > 200 ? '...' : ''}
                        </div>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-800 mb-2">Analysis Details</h3>
                        <div class="bg-white p-3 rounded border">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-2xl">🤖</span>
                                <div>
                                    <div class="text-xs text-gray-500">ML Model Used</div>
                                    <div class="text-sm font-semibold text-purple-700">${modelDisplay}</div>
                                </div>
                            </div>
                            <div class="text-xs text-gray-600 mt-2">
                                Analyzed: ${new Date(data.analyzed_at).toLocaleString()}
                            </div>
                            ${data.properties && data.properties.organism ? `
                                <div class="text-xs text-gray-600 mt-1">
                                    Organism: ${data.properties.organism}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    if (!tbody) return;

    // Display disease predictions
    if (data.disease_predictions && data.disease_predictions.length > 0) {
        tbody.innerHTML = data.disease_predictions.map((pred, idx) => {
            // Handle both old and new formats
            const diseaseName = pred.disease_name || pred.disease || 'Unknown Disease';
            const confidence = pred.confidence || pred.probability || 0;
            const confidencePercentage = Math.round(confidence * 100);
            const evidence = pred.evidence || 'Disease association analysis';

            return `
                <tr class="fade-in" style="animation-delay: ${idx * 100}ms;">
                    <td>
                        <div class="function-name font-semibold">${diseaseName}</div>
                        <div class="function-description text-sm text-gray-600">${evidence}</div>
                    </td>
                    <td>
                        <div class="confidence-score">
                            <span class="font-semibold">${confidencePercentage}%</span>
                            <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${confidencePercentage}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="evidence-badge px-2 py-1 bg-gray-100 rounded text-xs">${evidence ? 'Pattern Analysis' : 'Statistical'}</span>
                    </td>
                    <td>
                        <span class="badge px-2 py-1 rounded text-xs ${
                            confidencePercentage >= 80 ? 'bg-green-100 text-green-800' :
                            confidencePercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }">
                            ${confidencePercentage >= 80 ? 'High' : confidencePercentage >= 60 ? 'Medium' : 'Low'} Confidence
                        </span>
                    </td>
                    <td>
                        <button onclick="showDiseaseDetails('${diseaseName.replace(/'/g, "\\'")}', ${confidencePercentage})" class="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">
                    <div class="text-lg mb-2">No disease predictions found</div>
                    <div class="text-sm">The analyzed sequence did not match any known disease patterns.</div>
                </td>
            </tr>
        `;
    }
}

/**
 * Get protein analysis from backend
 */
async function getProteinAnalysis(proteinId) {
    try {
        const protein = await getProtein(proteinId);
        if (protein && protein.seq) {
            const sequence = protein.seq.join('');
            const diseaseResults = await predictDisease(sequence);

            return {
                id: protein.id,
                sequence: sequence,
                sequence_length: protein.length || sequence.length,
                disease_predictions: diseaseResults.predictions || [],
                protein_id: protein.id,
                analyzed_at: new Date().toISOString()
            };
        }
        throw new Error('Protein not found');
    } catch (error) {
        throw error;
    }
}

/**
 * Create mock analysis for fallback
 */
function createMockAnalysis(jobId) {
    return {
        id: jobId,
        sequence: 'MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAED...',
        sequence_length: 110,
        disease_predictions: [
            {
                disease_name: 'Diabetes Mellitus Type 2',
                probability: 0.75,
                confidence_score: 0.82,
                evidence: 'Contains insulin-related motifs and metabolic pathway signatures'
            },
            {
                disease_name: 'Metabolic Syndrome',
                probability: 0.68,
                confidence_score: 0.71,
                evidence: 'Statistical correlation with glucose metabolism disorders'
            }
        ],
        analyzed_at: new Date().toISOString()
    };
}

/**
 * Show disease details
 */
function showDiseaseDetails(diseaseName, predictionData) {
    console.log('Showing details for disease:', diseaseName);

    const pred = typeof predictionData === 'string' ? JSON.parse(predictionData) : predictionData;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-semibold text-gray-900">${diseaseName}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <div class="space-y-3 text-sm">
                <div>
                    <span class="font-medium text-gray-700">Probability:</span>
                    <span class="ml-2">${Math.round(pred.probability * 100)}%</span>
                </div>

                <div>
                    <span class="font-medium text-gray-700">Confidence:</span>
                    <span class="ml-2">${Math.round((pred.confidence_score || pred.probability) * 100)}%</span>
                </div>

                ${pred.evidence ? `
                <div>
                    <span class="font-medium text-gray-700">Evidence:</span>
                    <p class="mt-1 text-gray-600">${pred.evidence}</p>
                </div>
                ` : ''}

                <div class="mt-4 p-3 bg-blue-50 rounded">
                    <p class="text-xs text-blue-800">
                        <strong>Note:</strong> This is a computational prediction for research purposes only.
                        Always consult medical professionals for health-related concerns.
                    </p>
                </div>
            </div>

            <div class="mt-6 flex justify-end">
                <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}