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
    }
}

/**
 * Perform search
 */
function performSearch(query = '') {
    const searchInput = document.getElementById('search-input');
    query = query || (searchInput?.value || '');
    
    console.log('Performing search:', query);
    
    const data = useMockData();
    const tbody = document.querySelector('tbody');
    
    if (tbody && data.proteins) {
        let filtered = data.proteins;
        
        if (query) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(query.toLowerCase()) ||
                p.id.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        tbody.innerHTML = filtered.map(protein => `
            <tr class="fade-in">
                <td><a href="#" class="protein-id">${protein.id}</a></td>
                <td>${protein.name}</td>
                <td>${protein.gene || '-'}</td>
                <td>${protein.organism}</td>
                <td>${protein.function}</td>
            </tr>
        `).join('');
        
        updateResultCount(filtered.length);
    }
}

/**
 * Update result count
 */
function updateResultCount(count) {
    const countElement = document.getElementById('results-count');
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
    updateTable();
    updatePagination();
}

function updateTable() {
    const tbody = document.getElementById('protein-table-body');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="h-[72px] px-4 py-2 text-gray-500 text-center text-sm font-normal leading-normal">
                    Không tìm thấy kết quả
                </td>
            </tr>
        `;
        return;
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    tbody.innerHTML = pageData.map(protein => `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">
                <button class="save-btn bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm font-medium" 
                        data-id="${protein.id}" 
                        data-name="${protein.name}" 
                        data-organism="${protein.organism}">
                    Save
                </button>
            </td>
            <td class="py-3 px-4"><a href="#" class="text-blue-500 hover:underline">${protein.id}</a></td>
            <td class="py-3 px-4">${protein.name}</td>
            <td class="py-3 px-4">${protein.gene || '-'}</td>
            <td class="py-3 px-4">${protein.organism}</td>
            <td class="py-3 px-4">${protein.length}</td>
            <td class="py-3 px-4">${protein.weight}</td>
            <td class="py-3 px-4">${protein.function}</td>
        </tr>
    `).join('');
    
    attachSaveButtonListeners();
}

function attachSaveButtonListeners() {
    const saveButtons = document.querySelectorAll('.save-btn');
    
    saveButtons.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const protein = {
                id: this.getAttribute('data-id'),
                name: this.getAttribute('data-name'),
                organism: this.getAttribute('data-organism'),
                savedAt: new Date().toLocaleString()
            };
            
            let savedProteins = JSON.parse(localStorage.getItem('savedProteins')) || [];
            const exists = savedProteins.some(p => p.id === protein.id);
            
            if (!exists) {
                savedProteins.push(protein);
                localStorage.setItem('savedProteins', JSON.stringify(savedProteins));
                
                // Đổi thành màu XANH và text SAVED
                this.textContent = 'SAVED';
                this.style.backgroundColor = '#10b981'; // Xanh
                this.style.color = 'white';
                this.disabled = true;
                
                showToast('✓ Protein saved!', 'success');
            } else {
                showToast('⚠ Already saved!', 'error');
            }
        };
    });
    
    loadSavedStatus();
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
    
    if (!paginationContainer) return;
    
    let html = '';
    
    if (currentPage > 1) {
        html += `<button onclick="currentPage--; updateTable(); updatePagination();" class="px-2 py-1 border rounded">Previous</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="px-3 py-1 bg-blue-500 text-white rounded">${i}</button>`;
        } else {
            html += `<button onclick="currentPage=${i}; updateTable(); updatePagination();" class="px-3 py-1 border rounded">${i}</button>`;
        }
    }
    
    if (currentPage < totalPages) {
        html += `<button onclick="currentPage++; updateTable(); updatePagination();" class="px-2 py-1 border rounded">Next</button>`;
    }
    
    paginationContainer.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
    filteredData = [...proteinsData];
    document.getElementById('result-count').textContent = proteinsData.length;
    updateTable();
    attachSaveButtonListeners();
    
    document.getElementById('search-input')?.addEventListener('input', applyFilters);
    document.getElementById('clear-filters')?.addEventListener('click', function() {
        document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('search-input').value = '';
        applyFilters();
    });
});
