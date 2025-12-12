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
let calculatePropertiesTimeout = null;

function initializeCharCounter() {
    const sequenceInput = document.getElementById('sequence-input');
    if (sequenceInput) {
        sequenceInput.addEventListener('input', function() {
            const text = this.value.replace(/[\s>]/g, '').replace(/^>.*$/gm, '');
            const charCounter = document.getElementById('char-counter');
            if (charCounter) {
                charCounter.textContent = text.length + ' characters';
            }

            // Auto-calculate all properties with debouncing
            const cleaned = getCleanedSequence(this.value);
            
            // Clear previous timeout
            if (calculatePropertiesTimeout) {
                clearTimeout(calculatePropertiesTimeout);
            }
            
            // Only calculate if sequence is long enough (at least 3 amino acids)
            if (cleaned && cleaned.length >= 3) {
                // Show loading state
                const lengthInput = document.getElementById('protein-length');
                const piInput = document.getElementById('pi-value');
                const gravyInput = document.getElementById('hydrophobicity');
                
                if (lengthInput) lengthInput.value = cleaned.length;
                
                // Debounce API call - wait 500ms after user stops typing
                calculatePropertiesTimeout = setTimeout(async () => {
                    try {
                        // Show calculating state
                        if (piInput) piInput.placeholder = 'Calculating...';
                        if (gravyInput) gravyInput.placeholder = 'Calculating...';
                        
                        // Call API to calculate properties
                        const properties = await calculateProteinProperties(cleaned);
                        
                        // Fill in the calculated values
                        if (lengthInput) lengthInput.value = properties.length || cleaned.length;
                        if (piInput) {
                            piInput.value = properties.isoelectric_point || '';
                            piInput.placeholder = 'Auto-calculated';
                        }
                        if (gravyInput) {
                            gravyInput.value = properties.gravy || '';
                            gravyInput.placeholder = 'Auto-calculated';
                        }
                        
                        // Store all properties for later use
                        sequenceInput.dataset.calculatedProperties = JSON.stringify(properties);
                        
                    } catch (error) {
                        console.error('Failed to calculate properties:', error);
                        // Reset placeholders on error
                        if (piInput) piInput.placeholder = 'Auto-calculate (enter sequence)';
                        if (gravyInput) gravyInput.placeholder = 'Auto-calculate (enter sequence)';
                    }
                }, 500); // Wait 500ms after user stops typing
            } else {
                // Clear fields if sequence is too short
                const lengthInput = document.getElementById('protein-length');
                const piInput = document.getElementById('pi-value');
                const gravyInput = document.getElementById('hydrophobicity');
                
                if (lengthInput) lengthInput.value = cleaned ? cleaned.length : '';
                if (piInput) {
                    piInput.value = '';
                    piInput.placeholder = 'Auto-calculate (enter sequence)';
                }
                if (gravyInput) {
                    gravyInput.value = '';
                    gravyInput.placeholder = 'Auto-calculate (enter sequence)';
                }
            }
        });
    }
}

/**
 * Get cleaned sequence (remove headers and whitespace)
 */
function getCleanedSequence(rawSequence) {
    let cleaned = rawSequence.replace(/\s/g, '');

    // Remove FASTA header if present
    if (cleaned.includes('>')) {
        cleaned = cleaned.split('>').slice(1).map(line => {
            return line.replace(/^[^\n]*\n?/, '');
        }).join('');
    }

    return cleaned.toUpperCase().replace(/[^A-Z]/g, '');
}

/**
 * Toggle advanced fields
 */
function toggleAdvancedFields() {
    const advancedFields = document.getElementById('advanced-fields');
    const toggleIcon = document.getElementById('toggle-icon');

    if (advancedFields && toggleIcon) {
        if (advancedFields.classList.contains('hidden')) {
            advancedFields.classList.remove('hidden');
            toggleIcon.textContent = '▼';
        } else {
            advancedFields.classList.add('hidden');
            toggleIcon.textContent = '▶';
        }
    }
}

/**
 * Validate protein sequence
 */
function validateProteinSequence(sequence) {
    if (!sequence) return false;
    // Remove whitespace and FASTA headers
    const cleaned = sequence.replace(/[\s>]/g, '').replace(/^>.*$/gm, '').toUpperCase();
    if (cleaned.length < 3) return false; // Too short
    // Check if only contains valid amino acid codes
    const validAminoAcids = /^[ACDEFGHIKLMNPQRSTVWY*]+$/;
    return validAminoAcids.test(cleaned);
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
async function handlePredictClick() {
    const sequenceInput = document.getElementById('sequence-input');
    let sequence = sequenceInput?.value.trim() || '';

    // If file is selected, read sequence from file
    if (selectedFile && !sequence) {
        try {
            sequence = await readFileSequence(selectedFile);
        } catch (error) {
            showNotification('Failed to read file: ' + error.message, 'error');
            return;
        }
    }

    if (!sequence) {
        showNotification('Please enter a sequence or upload a file', 'error');
        return;
    }

    // Validate sequence
    if (!validateProteinSequence(sequence)) {
        showNotification('Invalid protein sequence. Please check your input.', 'error');
        return;
    }

    const predictButton = document.getElementById('predict-button');
    if (predictButton) {
        predictButton.disabled = true;
        predictButton.textContent = 'Processing...';
    }

    showNotification('Analyzing protein sequence...', 'info');

    try {
        // Collect all protein data from form
        const proteinName = document.getElementById('protein-name')?.value || 'User Submitted Protein';
        const geneName = document.getElementById('gene-name')?.value || '';
        const proteinData = {
            id: 'USER_' + Date.now(),
            name: proteinName,
            gene: geneName,
            seq: [sequence],
            length: document.getElementById('protein-length')?.value || sequence.length,
            pi: parseFloat(document.getElementById('pi-value')?.value) || null,
            hydrophobicity: parseFloat(document.getElementById('hydrophobicity')?.value) || null,
            n_interactors: parseInt(document.getElementById('interactors')?.value) || null,
            taxo: document.getElementById('organism')?.value || '',
            family: document.getElementById('family')?.value || ''
        };

        // Create protein in backend
        let createdProtein;
        try {
            createdProtein = await createProtein(proteinData);
        } catch (error) {
            console.log('Failed to create protein, continuing with analysis...', error);
        }

        // Get selected model
        const selectedModel = document.querySelector('input[name="ml-model"]:checked')?.value || 'lightgbm_best';
        console.log('Selected model:', selectedModel);

        // Analyze sequence using ML service
        const analysisPromises = [
            predictDisease(sequence, selectedModel),
        ];

        const [diseaseResults] = await Promise.all(analysisPromises);

        console.log('Disease prediction results:', diseaseResults);

        // Store results in localStorage for result page
        const analysisResults = {
            id: proteinData.id,
            protein_name: proteinData.name,
            gene_name: proteinData.gene,
            sequence: sequence,
            sequence_length: sequence.length,
            disease_predictions: diseaseResults.predictions || diseaseResults || [],
            protein_id: createdProtein?.id || proteinData.id,
            analyzed_at: new Date().toISOString(),
            model_used: diseaseResults.model_used || selectedModel,
            // Additional properties
            properties: {
                length: proteinData.length,
                // molecular_weight: proteinData.mw,
                pi: proteinData.pi,
                // net_charge: proteinData.net_charge,
                hydrophobicity: proteinData.hydrophobicity,
                interactors: proteinData.n_interactors,
                organism: proteinData.taxo,
                family: proteinData.family
            }
        };

        console.log('Analysis results to save:', analysisResults);

        localStorage.setItem('lastAnalysis', JSON.stringify(analysisResults));

        // Store in predictions history
        let predictions = JSON.parse(localStorage.getItem('predictions')) || [];
        predictions.unshift({
            id: proteinData.id,
            jobName: 'Protein Analysis - ' + new Date().toLocaleString(),
            submissionDate: new Date().toISOString(),
            status: 'Completed',
            sequence: sequence.substring(0, 50) + (sequence.length > 50 ? '...' : '')
        });
        localStorage.setItem('predictions', JSON.stringify(predictions));

        showNotification('Analysis complete!', 'success');
        window.location.href = `result.html?id=${proteinData.id}`;

    } catch (error) {
        console.error('Analysis failed:', error);
        showNotification('Analysis failed: ' + error.message, 'error');
    } finally {
        if (predictButton) {
            predictButton.disabled = false;
            predictButton.textContent = 'Predict';
        }
    }
}

/**
 * Read sequence from uploaded file
 */
async function readFileSequence(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                let sequence = '';

                // Handle FASTA format
                if (file.name.toLowerCase().includes('.fasta') || file.name.toLowerCase().includes('.fa')) {
                    const parsed = parseFASTA(content);
                    sequence = parsed.sequence;
                } else {
                    // Plain text - remove whitespace and newlines
                    sequence = content.replace(/\s+/g, '').replace(/[^A-Za-z]/g, '').toUpperCase();
                }

                if (!sequence) {
                    reject(new Error('No valid sequence found in file'));
                    return;
                }

                resolve(sequence);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}