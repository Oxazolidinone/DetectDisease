// Database Page Functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Database.js loaded');
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize search
    initializeSearch();
    
    // Initialize filters
    initializeFilters();
    
    // Initialize pagination
    initializePagination();
    
    // Perform initial search
    performSearch();
    
    attachSaveButtonListeners();
});

/**
 * Initialize navigation
 */
function initializeNavigation() {
    const searchBtn = document.querySelector('button:contains("Search")');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            console.log('Search clicked');
            performSearch();
        });
    }
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInput = document.getElementById('search-input');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            console.log('Searching for:', this.value);
            performSearch();
        }, 300));

        // Add enter key support
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

/**
 * Perform search with backend integration - Always call backend first
 */
async function performSearch(query = '') {
    const searchInput = document.getElementById('search-input');
    query = query || (searchInput?.value || '');

    console.log('Performing search:', query);
    updateSearchQuery(query);

    // Show loading state
    showLoadingState();

    try {
        // Always try backend search first
        const filters = { limit: 20, offset: 0 };

        if (query.trim()) {
            if (query.startsWith('P') || query.includes('_') || query.includes('A0A')) {
                filters.id = query;
            } else {
                filters.name = query;
            }
        }

        console.log('Calling backend API with filters:', filters);
        const proteinsData = await searchProteins(filters);
        console.log('Backend response:', proteinsData);

        if (proteinsData && proteinsData.data) {
            // Backend returned data
            const proteins = Array.isArray(proteinsData.data) ? proteinsData.data : proteinsData.data.proteins || [];
            displaySearchResults(proteins);
            updateResultCount(proteins.length);
            showNotification('Search completed from database', 'success');
            return;
        }
    } catch (error) {
        console.error('Backend search failed:', error);
        showNotification('Database connection failed, using local data', 'error');
    }

    // Fallback to local mock data search
    console.log('Using fallback mock data');
    const data = useMockData();

    if (data.proteins) {
        let filtered = data.proteins;

        if (query) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query.toLowerCase()) ||
                p.id.toLowerCase().includes(query.toLowerCase()) ||
                (p.gene && p.gene.toLowerCase().includes(query.toLowerCase()))
            );
        }

        displaySearchResults(filtered);
        updateResultCount(filtered.length);
    }
}

/**
 * Function called when search button is clicked
 */
function performSearchFromButton() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput?.value || '';

    if (query.trim()) {
        performSearch(query);
    } else {
        showNotification('Please enter a search term', 'error');
    }
}

/**
 * Show loading state during search
 */
function showLoadingState() {
    const tbody = document.querySelector('#protein-table-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="py-8 text-center text-gray-500">
                    <div class="flex items-center justify-center">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                        Searching database...
                    </div>
                </td>
            </tr>
        `;
    }
}

/**
 * Update search query display
 */
function updateSearchQuery(query) {
    const searchQueryElement = document.getElementById('search-query');
    if (searchQueryElement) {
        searchQueryElement.textContent = query || 'All proteins';
    }
}

/**
 * Display search results
 */
function displaySearchResults(proteins) {
    const tbody = document.querySelector('#protein-table-body');
    if (!tbody) return;

    if (proteins.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8 text-gray-500">
                    No proteins found matching your search criteria.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = proteins.map(protein => {
        const sequence = protein.seq ? (Array.isArray(protein.seq) ? protein.seq.join('') : protein.seq) : '';

        return `
            <tr>
                <td class="text-center">
                    <button class="save-btn"
                            data-protein='${JSON.stringify(protein).replace(/'/g, "&apos;")}'>
                        Save
                    </button>
                </td>
                <td>
                    <a href="result.html?id=${protein.id}" class="protein-id">
                        ${protein.id}
                    </a>
                </td>
                <td>${protein.name}</td>
                <td>${protein.gene || '-'}</td>
                <td>${protein.taxo || protein.organism || '-'}</td>
                <td class="text-right">${protein.length || sequence.length || 0}</td>
                <td class="text-right">${protein.mw ? Math.round(protein.mw).toLocaleString() : '-'}</td>
                <td class="max-w-xs truncate">${protein.function || protein.bio_process || '-'}</td>
            </tr>
        `;
    }).join('');

    // Add save functionality to buttons
    attachSaveButtonListeners();
}

/**
 * Update result count
 */
function updateResultCount(count) {
    const countElement = document.getElementById('result-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

/**
 * Initialize filters
 */
function initializeFilters() {
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    const clearBtn = document.querySelector('.clear-filters');
    
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            console.log('Filter changed:', this.value);
            performSearch();
        });
    });
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            filterCheckboxes.forEach(cb => cb.checked = false);
            console.log('Filters cleared');
            performSearch();
        });
    }
}

/**
 * Initialize pagination
 */
function initializePagination() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageButtons = document.querySelectorAll('.pagination-button:not(#prev-page):not(#next-page)');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            console.log('Previous page');
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            console.log('Next page');
        });
    }
    
    pageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Go to page:', this.textContent);
        });
    });
}

// Toast Notification Function
function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'error' ? 'error' : '');
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.style.animation = 'slideOut 0.4s ease-out forwards';
        setTimeout(function() {
            toast.remove();
        }, 400);
    }, 2500);
}

const proteinsData = [
    { id: 'A0A6G0UGL8_9BILA', name: 'receptor protein-tyrosine kinase', gene: '', organism: 'Halicephalobus', length: '838', weight: '95462', function: 'Kinase | Receptor | Transferase | Tyrosine-protein kinase' },
    { id: 'A0A2K6SKD5_SAIBB', name: 'Tyrosine-protein kinase receptor', gene: 'LTK', organism: 'Saimiri', length: '794', weight: '84804', function: 'Kinase | Receptor | Transferase | Tyrosine-protein kinase' },
    { id: 'A0A836ABD7_SHEEP', name: 'Solute carrier family 2, facilitated glucose transporter member 8', gene: '', organism: 'Ovis', length: '1364', weight: '149825', function: 'GTPase activation' },
    { id: 'A0A6P3RGQ7_PTEVA', name: 'Phosphatidylinositol 5-phosphate 4-kinase type-2 gamma', gene: 'KIF5A', organism: 'Pteropus', length: '422', weight: '47259', function: 'Kinase | Transferase' },
    { id: 'A0A3B3DRK3_ORYME', name: 'Tyrosine-protein kinase receptor', gene: '', organism: 'Oryzias', length: '810', weight: '92125', function: 'Developmental protein | Kinase | Receptor | Transferase | Tyrosine-protein kinase' },
    { id: 'A6JYM6_RAT', name: 'Proprotein convertase subtilisin/kexin type 9', gene: 'Pcsk9', organism: 'Rattus', length: '691', weight: '74709', function: 'Hydrolase | Protease | Serine protease' },
    { id: 'A0A2I3GUW2_NOMLE', name: 'Sorting nexin 1', gene: 'SNX1', organism: 'Nomascus', length: '509', weight: '57684', function: 'Protein transport | Transport' },
    { id: 'A0A851DUI7_9CORV', name: 'Exostosin-like 3', gene: 'Extl3', organism: 'Dryoscopus', length: '921', weight: '105355', function: 'Glycosyltransferase | Transferase' }
];

let filteredData = [];
const itemsPerPage = 10;
let currentPage = 1;

function applyFilters() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
    
    const organisms = [];
    if (document.getElementById('organism-homo')?.checked) organisms.push('Homo sapiens');
    if (document.getElementById('organism-mus')?.checked) organisms.push('Mus musculus');
    if (document.getElementById('organism-other')?.checked) {
        organisms.push('Halicephalobus', 'Saimiri', 'Ovis', 'Pteropus', 'Oryzias', 'Rattus', 'Nomascus', 'Dryoscopus');
    }
    
    const functions = [];
    if (document.getElementById('func-kinase')?.checked) functions.push('Kinase');
    if (document.getElementById('func-enzyme')?.checked) functions.push('Enzyme');
    if (document.getElementById('func-receptor')?.checked) functions.push('Receptor');
    if (document.getElementById('func-protease')?.checked) functions.push('Protease');
    
    const lengthMin = parseInt(document.getElementById('length-min')?.value) || 0;
    const lengthMax = parseInt(document.getElementById('length-max')?.value) || Infinity;
    
    const weightMin = parseInt(document.getElementById('weight-min')?.value) || 0;
    const weightMax = parseInt(document.getElementById('weight-max')?.value) || Infinity;
    
    filteredData = proteinsData.filter(protein => {
        if (searchQuery && !protein.id.toLowerCase().includes(searchQuery) &&
            !protein.name.toLowerCase().includes(searchQuery) &&
            !protein.gene.toLowerCase().includes(searchQuery) &&
            !protein.organism.toLowerCase().includes(searchQuery) &&
            !protein.function.toLowerCase().includes(searchQuery)) {
            return false;
        }
        
        if (organisms.length > 0 && !organisms.includes(protein.organism)) {
            return false;
        }
        
        if (functions.length > 0) {
            const hasFunction = functions.some(func => protein.function.toLowerCase().includes(func.toLowerCase()));
            if (!hasFunction) return false;
        }
        
        const proteinLength = parseInt(protein.length);
        if (proteinLength < lengthMin || proteinLength > lengthMax) {
            return false;
        }
        
        const proteinWeight = parseInt(protein.weight);
        if (proteinWeight < weightMin || proteinWeight > weightMax) {
            return false;
        }
        
        return true;
    });
    
    currentPage = 1;
    document.getElementById('result-count').textContent = filteredData.length;
    
    // Update filtered count in sidebar
    const filteredCountEl = document.getElementById('filtered-count');
    if (filteredCountEl) filteredCountEl.textContent = filteredData.length;
    
    // Update search query display
    const searchQueryWrapper = document.getElementById('search-query-wrapper');
    const searchQueryEl = document.getElementById('search-query');
    if (searchQuery && searchQueryWrapper && searchQueryEl) {
        searchQueryWrapper.classList.remove('hidden');
        searchQueryEl.textContent = searchQuery;
    } else if (searchQueryWrapper) {
        searchQueryWrapper.classList.add('hidden');
    }
    
    updateTable();
    updatePagination();
}

function updateTable() {
    const tbody = document.getElementById('protein-table-body');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8 text-gray-500">
                    No results found
                </td>
            </tr>
        `;
        return;
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    tbody.innerHTML = pageData.map(protein => `
        <tr>
            <td class="text-center">
                <button class="save-btn" 
                        data-id="${protein.id}" 
                        data-name="${protein.name}" 
                        data-organism="${protein.organism}">
                    Save
                </button>
            </td>
            <td><a href="result.html?id=${protein.id}" class="protein-id">${protein.id}</a></td>
            <td>${protein.name}</td>
            <td>${protein.gene || '-'}</td>
            <td>${protein.organism}</td>
            <td class="text-right">${protein.length}</td>
            <td class="text-right">${parseInt(protein.weight).toLocaleString()}</td>
            <td class="max-w-xs truncate">${protein.function}</td>
        </tr>
    `).join('');
    
    attachSaveButtonListeners();
}

function attachSaveButtonListeners() {
    const saveButtons = document.querySelectorAll('.save-btn');

    saveButtons.forEach(btn => {
        btn.onclick = async function(e) {
            e.preventDefault();
            e.stopPropagation();

            try {
                const proteinDataStr = this.getAttribute('data-protein');
                if (!proteinDataStr) {
                    // Fallback for old format buttons
                    const id = this.getAttribute('data-id');
                    const name = this.getAttribute('data-name');
                    const organism = this.getAttribute('data-organism');
                    saveProteinLocally({ id, name, organism });
                    this.textContent = 'SAVED';
                    this.style.backgroundColor = '#10b981';
                    this.disabled = true;
                    return;
                }

                const proteinData = JSON.parse(proteinDataStr.replace(/&apos;/g, "'"));

                this.disabled = true;
                this.textContent = 'Saving...';

                // Try to save to backend first
                try {
                    // Backend expects: { id, name, seq: []string, gene?, taxo?, cc?, domain?, family?, function? }
                    const saveData = {
                        id: proteinData.id,
                        name: proteinData.name,
                        seq: proteinData.seq ? (Array.isArray(proteinData.seq) ? proteinData.seq : [proteinData.seq]) : ['UNKNOWN'],
                        gene: proteinData.gene || null,
                        taxo: proteinData.taxo || proteinData.organism || null,
                        cc: proteinData.cc || null,
                        domain: proteinData.domain || null,
                        family: proteinData.family || null,
                        function: proteinData.function || proteinData.bio_process || null
                    };

                    await createProtein(saveData);
                    showToast('✓ Protein saved to database!', 'success');
                } catch (error) {
                    console.log('Backend save failed, saving locally:', error);
                    // Fallback to localStorage
                    saveProteinLocally(proteinData);
                }

                // Update button appearance
                this.textContent = 'SAVED';
                this.style.backgroundColor = '#10b981';
                this.style.color = 'white';
                this.disabled = true;

            } catch (error) {
                console.error('Save failed:', error);
                showToast('⚠ Save failed!', 'error');
                this.disabled = false;
                this.textContent = 'Save';
            }
        };
    });

    loadSavedStatus();
}

/**
 * Save protein locally as fallback
 */
function saveProteinLocally(protein) {
    let savedProteins = JSON.parse(localStorage.getItem('savedProteins')) || [];
    const exists = savedProteins.some(p => p.id === protein.id);

    if (!exists) {
        protein.savedAt = new Date().toLocaleString();
        savedProteins.push(protein);
        localStorage.setItem('savedProteins', JSON.stringify(savedProteins));
        showToast('✓ Protein saved locally!', 'success');
    } else {
        showToast('⚠ Already saved!', 'error');
    }
}

function loadSavedStatus() {
    const savedProteins = JSON.parse(localStorage.getItem('savedProteins')) || [];
    const saveButtons = document.querySelectorAll('.save-btn');
    
    saveButtons.forEach(btn => {
        const id = btn.getAttribute('data-id');
        if (savedProteins.some(p => p.id === id)) {
            btn.textContent = 'SAVED';
            btn.style.backgroundColor = '#10b981'; // Xanh
            btn.style.color = 'white';
            btn.disabled = true;
        }
    });
}

function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');
    
    // Update page info
    const currentPageEl = document.getElementById('current-page');
    const totalPagesEl = document.getElementById('total-pages');
    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalPages || 1;
    
    if (!paginationContainer) return;
    
    let html = '';
    
    // Previous button
    html += `<button onclick="currentPage > 1 && (currentPage--, updateTable(), updatePagination())" 
             class="pagination-btn" ${currentPage <= 1 ? 'disabled' : ''}>Prev</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="pagination-btn active">${i}</button>`;
        } else {
            html += `<button onclick="currentPage=${i}; updateTable(); updatePagination();" class="pagination-btn">${i}</button>`;
        }
    }
    
    // Next button
    html += `<button onclick="currentPage < ${totalPages} && (currentPage++, updateTable(), updatePagination())" 
             class="pagination-btn" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>`;
    
    paginationContainer.innerHTML = html;
}

// Add function to clear all filters
function clearAllFilters() {
    document.querySelectorAll('.filter-checkbox, input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('search-input').value = '';
    document.getElementById('length-min').value = '';
    document.getElementById('length-max').value = '';
    document.getElementById('weight-min').value = '';
    document.getElementById('weight-max').value = '';
    applyFilters();
}

document.addEventListener('DOMContentLoaded', function() {
    filteredData = [...proteinsData];
    document.getElementById('result-count').textContent = proteinsData.length;
    updateTable();
    attachSaveButtonListeners();

    document.getElementById('search-input')?.addEventListener('input', applyFilters);
    document.getElementById('clear-filters')?.addEventListener('click', clearAllFilters);
});
