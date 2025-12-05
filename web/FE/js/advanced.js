/**
 * Advanced Protein Tools JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Advanced tools loaded');

    // Initialize with default tab
    initializeAdvancedTools();
    loadSavedProteinsQuickSelect();
    loadProteinStatistics('statistics-container');
    updateSavedProteinsStats();
});

/**
 * Initialize advanced tools
 */
function initializeAdvancedTools() {
    // Setup CSV file input listener
    const csvInput = document.getElementById('csv-file');
    if (csvInput) {
        csvInput.addEventListener('change', previewCSV);
    }

    // Setup selection info updates
    updateBulkSelectionInfo();
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
        button.classList.add('border-transparent', 'text-gray-500');
        button.classList.remove('border-primary', 'text-primary', 'bg-blue-50');
    });

    // Show selected tab content
    const selectedContent = document.getElementById(`${tabName}-content`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }

    // Activate selected tab button
    const selectedButton = document.getElementById(`tab-${tabName}`);
    if (selectedButton) {
        selectedButton.classList.add('active');
        selectedButton.classList.remove('border-transparent', 'text-gray-500');
        selectedButton.classList.add('border-primary', 'text-primary', 'bg-blue-50');
    }
}

/**
 * CSV Import Functions
 */
function previewCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const preview = content.split('\n').slice(0, 5).join('\n');

        document.getElementById('csv-preview').classList.remove('hidden');
        document.getElementById('csv-preview-content').textContent = preview;
    };
    reader.readAsText(file);
}

async function handleCSVImport() {
    const fileInput = document.getElementById('csv-file');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('Please select a CSV file first', 'error');
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const csvContent = e.target.result;
                await importProteinsFromCSV(csvContent);

                // Clear file input and preview
                fileInput.value = '';
                document.getElementById('csv-preview').classList.add('hidden');

                // Refresh protein list
                loadProteinList();

            } catch (error) {
                console.error('Import failed:', error);
                showNotification('Import failed: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);

    } catch (error) {
        console.error('File read failed:', error);
        showNotification('Failed to read file', 'error');
    }
}

/**
 * Bulk Operations Functions
 */
async function loadProteinList() {
    try {
        showNotification('Loading protein list...', 'info');
        const result = await searchProteins({ limit: 50, offset: 0 });

        const tbody = document.getElementById('bulk-protein-list');

        if (result && result.data && result.data.length > 0) {
            const proteins = result.data;

            tbody.innerHTML = proteins.map(protein => `
                <tr class="border-b hover:bg-gray-50">
                    <td class="py-3 px-4">
                        <input type="checkbox" class="protein-checkbox rounded"
                               data-protein-id="${protein.id}"
                               onchange="BatchOperations.toggleSelection('${protein.id}')">
                    </td>
                    <td class="py-3 px-4 font-mono text-sm">${protein.id}</td>
                    <td class="py-3 px-4">${protein.name || 'Unknown'}</td>
                    <td class="py-3 px-4">${protein.gene || '-'}</td>
                    <td class="py-3 px-4">${protein.taxo || protein.organism || 'Unknown'}</td>
                    <td class="py-3 px-4">
                        <div class="flex gap-1">
                            <button onclick="editProtein('${protein.id}')"
                                    class="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                            <button onclick="deleteProtein('${protein.id}')"
                                    class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');

            showNotification(`Loaded ${proteins.length} proteins`, 'success');
            updateBulkSelectionInfo();

        } else {
            // Fallback to mock data
            const mockProteins = useMockData().proteins;
            tbody.innerHTML = mockProteins.map(protein => `
                <tr class="border-b hover:bg-gray-50">
                    <td class="py-3 px-4">
                        <input type="checkbox" class="protein-checkbox rounded"
                               data-protein-id="${protein.id}"
                               onchange="BatchOperations.toggleSelection('${protein.id}')">
                    </td>
                    <td class="py-3 px-4 font-mono text-sm">${protein.id}</td>
                    <td class="py-3 px-4">${protein.name}</td>
                    <td class="py-3 px-4">${protein.gene || '-'}</td>
                    <td class="py-3 px-4">${protein.organism}</td>
                    <td class="py-3 px-4">
                        <span class="text-gray-500 text-sm">Mock data</span>
                    </td>
                </tr>
            `).join('');

            showNotification('Using mock data (backend unavailable)', 'error');
        }

    } catch (error) {
        console.error('Failed to load protein list:', error);
        showNotification('Failed to load proteins', 'error');
    }
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const proteinCheckboxes = document.querySelectorAll('.protein-checkbox');

    if (selectAllCheckbox.checked) {
        proteinCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                BatchOperations.toggleSelection(checkbox.dataset.proteinId);
            }
        });
    } else {
        proteinCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                BatchOperations.toggleSelection(checkbox.dataset.proteinId);
            }
        });
    }
}

function selectAllProteins() {
    const proteinIds = Array.from(document.querySelectorAll('.protein-checkbox'))
                          .map(cb => cb.dataset.proteinId);
    BatchOperations.selectAll(proteinIds);

    // Update UI
    document.querySelectorAll('.protein-checkbox').forEach(cb => {
        cb.checked = true;
    });
    document.getElementById('select-all-checkbox').checked = true;
}

function clearAllSelections() {
    BatchOperations.clearSelection();

    // Update UI
    document.querySelectorAll('.protein-checkbox').forEach(cb => {
        cb.checked = false;
    });
    document.getElementById('select-all-checkbox').checked = false;
}

function updateBulkSelectionInfo() {
    const count = BatchOperations.selectedProteins.size;
    const infoDiv = document.getElementById('selection-info-bulk');
    const countSpan = document.getElementById('selection-count');

    if (count > 0) {
        infoDiv.classList.remove('hidden');
        countSpan.textContent = count;
    } else {
        infoDiv.classList.add('hidden');
    }
}

// Override BatchOperations updateSelectionUI to work with our advanced page
const originalUpdateSelectionUI = BatchOperations.updateSelectionUI;
BatchOperations.updateSelectionUI = function() {
    originalUpdateSelectionUI.call(this);
    updateBulkSelectionInfo();
};

/**
 * Protein Comparison Functions
 */
async function performProteinComparison() {
    const protein1Id = document.getElementById('protein1-id').value.trim();
    const protein2Id = document.getElementById('protein2-id').value.trim();

    if (!protein1Id || !protein2Id) {
        showNotification('Please enter both protein IDs', 'error');
        return;
    }

    if (protein1Id === protein2Id) {
        showNotification('Please enter different protein IDs', 'error');
        return;
    }

    try {
        showNotification('Comparing proteins...', 'info');
        const result = await compareProteins(protein1Id, protein2Id);
        
        if (result && result.data) {
            displayComparisonResultsWithChart(result.data, 'comparison-results');
            showNotification('Comparison completed successfully', 'success');
        } else {
            throw new Error('No comparison data received');
        }
    } catch (error) {
        console.error('Comparison failed:', error);
        // Show mock comparison result
        displayMockComparison(protein1Id, protein2Id);
    }
}

function quickCompare() {
    const protein1 = document.getElementById('quick-protein1').value;
    const protein2 = document.getElementById('quick-protein2').value;

    if (protein1 && protein2 && protein1 !== protein2) {
        document.getElementById('protein1-id').value = protein1;
        document.getElementById('protein2-id').value = protein2;
        performProteinComparison();
    } else {
        showNotification('Please select two different proteins', 'error');
    }
}

function loadSavedProteinsQuickSelect() {
    const savedProteins = getSavedProteins();
    const select1 = document.getElementById('quick-protein1');
    const select2 = document.getElementById('quick-protein2');

    [select1, select2].forEach(select => {
        select.innerHTML = '<option value="">Select a protein</option>';
        savedProteins.forEach(protein => {
            const option = document.createElement('option');
            option.value = protein.id;
            option.textContent = `${protein.id} - ${protein.name}`;
            select.appendChild(option);
        });
    });
}

function displayMockComparison(id1, id2) {
    const mockResult = {
        protein_1: { 
            id: id1, 
            name: 'Sample Protein 1', 
            length: 342,
            gene: 'GENE1',
            taxo: 'Homo sapiens',
            mw: 38500,
            pi: 6.8,
            hydrophobicity_gravy: -0.45
        },
        protein_2: { 
            id: id2, 
            name: 'Sample Protein 2', 
            length: 289,
            gene: 'GENE2',
            taxo: 'Mus musculus',
            mw: 32100,
            pi: 7.2,
            hydrophobicity_gravy: -0.32
        },
        similarity: 0.76,
        compared_at: new Date().toISOString()
    };

    displayComparisonResultsWithChart(mockResult, 'comparison-results');
    showNotification('Showing mock comparison data (backend unavailable)', 'error');
}

/**
 * Statistics Functions
 */
function updateSavedProteinsStats() {
    const savedProteins = getSavedProteins();
    const statsContainer = document.getElementById('saved-proteins-stats');

    if (savedProteins.length > 0) {
        const organisms = [...new Set(savedProteins.map(p => p.organism || p.taxo))].filter(Boolean);

        statsContainer.innerHTML = `
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-600">Total Saved:</span>
                    <span class="font-semibold text-blue-600">${savedProteins.length}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Unique Organisms:</span>
                    <span class="font-semibold text-green-600">${organisms.length}</span>
                </div>
                <div class="pt-3">
                    <button onclick="clearSavedProteins()"
                            class="w-full bg-red-100 text-red-800 py-2 px-3 rounded text-sm hover:bg-red-200 transition-colors">
                        Clear All Saved
                    </button>
                </div>
            </div>
        `;
    } else {
        statsContainer.innerHTML = '<p class="text-gray-500">No saved proteins yet</p>';
    }
}

function updateRecentActivity() {
    // Mock recent activity data
    const recentActivity = [
        { action: 'Search', query: 'kinase', time: '2 minutes ago' },
        { action: 'Save', protein: 'P01308', time: '5 minutes ago' },
        { action: 'Compare', proteins: 'P01308 vs P69905', time: '10 minutes ago' }
    ];

    const container = document.getElementById('recent-activity');
    container.innerHTML = `
        <div class="space-y-3">
            ${recentActivity.map(activity => `
                <div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                    <span class="text-sm">${activity.action}: ${activity.query || activity.protein || activity.proteins}</span>
                    <span class="text-xs text-gray-500">${activity.time}</span>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Export Functions
 */
async function exportSearchResults() {
    const query = document.getElementById('export-search-query').value.trim();

    if (!query) {
        showNotification('Please enter a search query', 'error');
        return;
    }

    try {
        showNotification('Searching and preparing export...', 'info');
        const result = await searchProteins({ name: query, limit: 100 });

        if (result && result.data && result.data.length > 0) {
            const timestamp = new Date().toISOString().split('T')[0];
            exportToCSV(result.data, `search_${query}_${timestamp}.csv`);

            addToExportHistory(`Search results for "${query}"`, result.data.length);
            showNotification(`Exported ${result.data.length} proteins`, 'success');
        } else {
            showNotification('No results found for the search query', 'error');
        }
    } catch (error) {
        console.error('Export search failed:', error);
        showNotification('Export failed', 'error');
    }
}

function addToExportHistory(description, count) {
    const historyContainer = document.getElementById('export-history');
    const timestamp = new Date().toLocaleString();

    const historyItem = document.createElement('div');
    historyItem.className = 'flex justify-between items-center py-2 px-3 bg-gray-50 rounded mb-2';
    historyItem.innerHTML = `
        <span class="text-sm">${description}</span>
        <div class="text-right">
            <div class="text-sm font-semibold">${count} records</div>
            <div class="text-xs text-gray-500">${timestamp}</div>
        </div>
    `;

    if (historyContainer.children[0]?.textContent.includes('No recent exports')) {
        historyContainer.innerHTML = '';
    }

    historyContainer.insertBefore(historyItem, historyContainer.firstChild);
}

/**
 * Individual Protein Actions
 */
async function editProtein(proteinId) {
    const newName = prompt(`Enter new name for protein ${proteinId}:`);
    if (newName && newName.trim()) {
        try {
            await updateProtein(proteinId, { name: newName.trim() });
            showNotification(`Protein ${proteinId} updated successfully`, 'success');
            loadProteinList(); // Refresh list
        } catch (error) {
            console.error('Update failed:', error);
            showNotification('Failed to update protein', 'error');
        }
    }
}

async function deleteProtein(proteinId) {
    if (confirm(`Are you sure you want to delete protein ${proteinId}?`)) {
        try {
            await deleteProtein(proteinId);
            showNotification(`Protein ${proteinId} deleted successfully`, 'success');
            loadProteinList(); // Refresh list
        } catch (error) {
            console.error('Delete failed:', error);
            showNotification('Failed to delete protein', 'error');
        }
    }
}

// Auto-refresh functions
setInterval(() => {
    updateSavedProteinsStats();
    updateRecentActivity();
}, 30000); // Refresh every 30 seconds

console.log('Advanced tools JavaScript loaded successfully');