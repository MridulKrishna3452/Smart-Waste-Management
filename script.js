// Global variables
let selectedBinId = null;
let selectedBinRow = null;

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadBins();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add bin form
    document.getElementById('addBinForm').addEventListener('submit', handleAddBin);
    
    // Update fill form
    document.getElementById('updateFillForm').addEventListener('submit', handleUpdateFill);
    
    // Pickup form
    document.getElementById('pickupForm').addEventListener('submit', handleRecordPickup);
    
    // Table row selection
    document.getElementById('tableBody').addEventListener('click', handleRowSelection);
}

// Handle row selection
function handleRowSelection(event) {
    const row = event.target.closest('tr');
    if (!row) return;
    
    // Remove previous selection
    if (selectedBinRow) {
        selectedBinRow.classList.remove('selected');
    }
    
    // Add selection to current row
    row.classList.add('selected');
    selectedBinRow = row;
    selectedBinId = parseInt(row.dataset.binId);
}

// Show modals
function showAddBinModal() {
    document.getElementById('addBinModal').style.display = 'block';
    document.getElementById('addBinForm').reset();
}

function showUpdateFillModal() {
    if (!selectedBinId) {
        showToast('Please select a bin first', 'warning');
        return;
    }
    
    document.getElementById('updateFillModal').style.display = 'block';
    document.getElementById('updateFillForm').reset();
}

function showPickupModal() {
    if (!selectedBinId) {
        showToast('Please select a bin first', 'warning');
        return;
    }
    
    document.getElementById('pickupModal').style.display = 'block';
    document.getElementById('pickupForm').reset();
}

// Close modals
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Handle add bin
async function handleAddBin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        location: formData.get('location'),
        type: formData.get('type')
    };
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/bins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast('Bin added successfully!', 'success');
            closeModal('addBinModal');
            loadBins();
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to add bin', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Handle update fill level
async function handleUpdateFill(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const fillLevel = parseInt(formData.get('fillLevel'));
    
    if (fillLevel < 0 || fillLevel > 100) {
        showToast('Fill level must be between 0 and 100', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/bins/${selectedBinId}/fill`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fillLevel })
        });
        
        if (response.ok) {
            showToast('Fill level updated successfully!', 'success');
            closeModal('updateFillModal');
            loadBins();
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to update fill level', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Handle record pickup
async function handleRecordPickup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const collectedWeight = parseFloat(formData.get('collectedWeight'));
    
    if (collectedWeight < 0) {
        showToast('Weight must be a positive number', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/bins/${selectedBinId}/pickup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ collectedWeight })
        });
        
        if (response.ok) {
            showToast('Pickup recorded successfully!', 'success');
            closeModal('pickupModal');
            loadBins();
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to record pickup', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Load bins from API
async function loadBins() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/bins`);
        
        if (response.ok) {
            const bins = await response.json();
            displayBins(bins);
        } else {
            showToast('Failed to load bins', 'error');
        }
    } catch (error) {
        showToast('Network error. Please check if the server is running.', 'error');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Display bins in table
function displayBins(bins) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    bins.forEach(bin => {
        const row = document.createElement('tr');
        row.dataset.binId = bin.id;
        
        const status = getFillStatus(bin.fill_level);
        const statusClass = getStatusClass(bin.fill_level);
        
        row.innerHTML = `
            <td>${bin.id}</td>
            <td>${bin.location}</td>
            <td>${bin.type}</td>
            <td>
                <div class="fill-bar">
                    <div class="fill-level" style="width: ${bin.fill_level}%"></div>
                    <div class="fill-text">${bin.fill_level}%</div>
                </div>
            </td>
            <td><span class="status ${statusClass}">${status}</span></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="selectBinAndUpdateFill(${bin.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="selectBinAndRecordPickup(${bin.id})">
                    <i class="fas fa-truck"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Get fill status text
function getFillStatus(fillLevel) {
    if (fillLevel === 0) return 'Empty';
    if (fillLevel < 25) return 'Low';
    if (fillLevel < 75) return 'Medium';
    return 'Full';
}

// Get status class
function getStatusClass(fillLevel) {
    if (fillLevel === 0) return 'status-empty';
    if (fillLevel < 25) return 'status-low';
    if (fillLevel < 75) return 'status-medium';
    return 'status-full';
}

// Select bin and show update fill modal
function selectBinAndUpdateFill(binId) {
    selectedBinId = binId;
    showUpdateFillModal();
}

// Select bin and show pickup modal
function selectBinAndRecordPickup(binId) {
    selectedBinId = binId;
    showPickupModal();
}

// Show loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'flex' : 'none';
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Auto-refresh every 30 seconds
setInterval(loadBins, 30000);
