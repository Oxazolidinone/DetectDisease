// Input Page Functionality

let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Input.js loaded');
    initializeFileUpload();
    initializeCharCounter();
    initializePredictButton();
});
document.addEventListener('DOMContentLoaded', function() {
        const currentPage = window.location.pathname.split('/').pop() || 'input.html';
        const navLinks = document.querySelectorAll('header a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'home.html')) {
                link.classList.remove('text-gray-600', 'hover:text-accent');
                link.classList.add('text-accent', 'font-semibold');
            }
        });
    });
/**
 * Tab switching
 */
function switchTab(button) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.classList.remove('active', 'border-b-primary', 'text-primary');
        btn.classList.add('border-b-transparent', 'text-gray-500');
    });
    
    tabContents.forEach(content => content.classList.remove('active'));
    
    button.classList.add('active', 'border-b-primary', 'text-primary');
    button.classList.remove('border-b-transparent', 'text-gray-500');
    
    const tabName = button.getAttribute('data-tab');
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }
}

/**
 * Initialize file upload
 */
function initializeFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    if (!uploadArea || !fileInput) return;
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-primary', 'bg-primary/5');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-primary', 'bg-primary/5');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-primary', 'bg-primary/5');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

/**
 * Handle file selection
 */
function handleFileSelect(file) {
    const allowedExtensions = ['.fasta', '.fa', '.txt', '.csv', '.pdb'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
        showStatus('Invalid file type. Please upload .fasta, .fa, .txt, .csv or .pdb files', 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showStatus('File size must be less than 10MB', 'error');
        return;
    }
    
    selectedFile = file;
    displayFilePreview(file);
}

/**
 * Display file preview
 */
function displayFilePreview(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        const preview = content.substring(0, 500);
        
        const fileNameEl = document.getElementById('file-name');
        const fileSizeEl = document.getElementById('file-size');
        const filePreviewEl = document.getElementById('file-preview');
        const fileContentPreviewEl = document.getElementById('file-content-preview');
        
        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileSizeEl) fileSizeEl.textContent = formatFileSize(file.size);
        if (fileContentPreviewEl) fileContentPreviewEl.textContent = preview + (content.length > 500 ? '...' : '');
        
        if (filePreviewEl) filePreviewEl.classList.remove('hidden');
        
        showStatus('', '');
    };
    
    reader.readAsText(file);
}

/**
 * Remove selected file
 */
function removeFile() {
    selectedFile = null;
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    
    if (fileInput) fileInput.value = '';
    if (filePreview) filePreview.classList.add('hidden');
    
    showStatus('', '');
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Show status message
 */
function showStatus(message, type) {
    const statusDiv = document.getElementById('status-message');
    if (!statusDiv) return;
    
    if (!message) {
        statusDiv.classList.add('hidden');
        return;
    }
    
    statusDiv.classList.remove('hidden');
    statusDiv.textContent = message;
    
    if (type === 'success') {
        statusDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200';
    } else if (type === 'error') {
        statusDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200';
    } else {
        statusDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200';
    }
}

/**
 * Initialize character counter
 */
function initializeCharCounter() {
    const sequenceInput = document.getElementById('sequence-input');
    if (sequenceInput) {
        sequenceInput.addEventListener('input', function() {
            const text = this.value.replace(/[\s>]/g, '');
            const charCounter = document.getElementById('char-counter');
            if (charCounter) {
                charCounter.textContent = text.length + ' characters';
            }
        });
    }
}

/**
 * Validate protein sequence
 */
function validateProteinSequence(sequence) {
    if (!sequence) return true;
    const validAminoAcids = /^[ACDEFGHIKLMNPQRSTVWY*\s>]/i;
    return validAminoAcids.test(sequence.replace(/[\s>]/g, '').substring(0, 1));
}

/**
 * Initialize predict button
 */
function initializePredictButton() {
    const predictButton = document.getElementById('predict-button');
    
    if (predictButton) {
        predictButton.addEventListener('click', handlePredictClick);
    }
}

/**
 * Handle predict click
 */
function handlePredictClick() {
    const sequence = document.getElementById('sequence-input')?.value.trim();
    
    if (!sequence && !selectedFile) {
        if (window.showNotification) {
            showNotification('Please enter a sequence or upload a file', 'error');
        } else {
            alert('Please enter a sequence or upload a file');
        }
        return;
    }
    
    const predictButton = document.getElementById('predict-button');
    if (predictButton) {
        predictButton.disabled = true;
        predictButton.textContent = 'Processing...';
    }
    
    if (window.showNotification) {
        showNotification('Analyzing protein...', 'info');
    }
    
    // Simulate processing
    setTimeout(() => {
        const jobId = 'JOB-' + Date.now();
        if (window.showNotification) {
            showNotification('Analysis complete!', 'success');
        }
        window.location.href = `result.html?id=${jobId}`;
    }, 2000);
}