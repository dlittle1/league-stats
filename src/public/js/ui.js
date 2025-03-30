/**
 * UI Module - Handles UI-related functionality and element interactions
 */

// Cache DOM elements to avoid repeated lookups
const elements = {
    // General UI elements
    searchInput: null,
    searchButton: null,
    championsDropdown: null,
    championInfoSection: null,
    loadingIndicator: null,
    connectionStatus: null,
    setupInstructions: null,
    
    // Champion details elements
    championImage: null,
    championName: null,
    championTitle: null,
    championTags: null,
    currentTeamComp: null,
    
    // Abilities elements
    passiveIcon: null,
    passiveName: null,
    passiveDescription: null,
    qIcon: null,
    qName: null,
    qDescription: null,
    wIcon: null,
    wName: null,
    wDescription: null,
    eIcon: null,
    eName: null,
    eDescription: null,
    rIcon: null,
    rName: null,
    rDescription: null,
    
    // Stats and items elements
    statsChart: null,
    coreItems: null,
    bootsItems: null,
    teamStrategyText: null
  };
  
  /**
   * Initialize all UI elements
   * @returns {Object} - Object containing references to all cached DOM elements
   */
  function initializeUIElements() {
    // General UI elements
    elements.searchInput = document.getElementById('champion-search');
    elements.searchButton = document.getElementById('search-button');
    elements.championsDropdown = document.getElementById('champions-dropdown');
    elements.championInfoSection = document.getElementById('champion-info');
    elements.loadingIndicator = document.getElementById('loading');
    elements.connectionStatus = document.getElementById('connection-status');
    elements.setupInstructions = document.getElementById('setup-instructions');
    
    // Champion details elements
    elements.championImage = document.getElementById('champion-image');
    elements.championName = document.getElementById('champion-name');
    elements.championTitle = document.getElementById('champion-title');
    elements.championTags = document.getElementById('champion-tags');
    elements.currentTeamComp = document.getElementById('current-team-comp');
    
    // Abilities elements
    elements.passiveIcon = document.getElementById('passive-icon');
    elements.passiveName = document.getElementById('passive-name');
    elements.passiveDescription = document.getElementById('passive-description');
    elements.qIcon = document.getElementById('q-icon');
    elements.qName = document.getElementById('q-name');
    elements.qDescription = document.getElementById('q-description');
    elements.wIcon = document.getElementById('w-icon');
    elements.wName = document.getElementById('w-name');
    elements.wDescription = document.getElementById('w-description');
    elements.eIcon = document.getElementById('e-icon');
    elements.eName = document.getElementById('e-name');
    elements.eDescription = document.getElementById('e-description');
    elements.rIcon = document.getElementById('r-icon');
    elements.rName = document.getElementById('r-name');
    elements.rDescription = document.getElementById('r-description');
    
    // Stats and items elements
    elements.statsChart = document.getElementById('stats-chart');
    elements.coreItems = document.getElementById('core-items');
    elements.bootsItems = document.getElementById('boots-items');
    elements.teamStrategyText = document.getElementById('team-strategy-text');
    
    // Validate required elements
    validateRequiredElements();
    
    return elements;
  }
  
  /**
   * Validate that all required UI elements exist
   */
  function validateRequiredElements() {
    const requiredElements = [
      'searchInput', 'searchButton', 'championsDropdown', 
      'championInfoSection', 'loadingIndicator', 'championImage', 
      'championName', 'championTitle', 'championTags'
    ];
    
    const missingElements = requiredElements.filter(id => !elements[id]);
    if (missingElements.length > 0) {
      console.warn('Missing essential DOM elements:', missingElements);
    }
  }
  
  /**
   * Update connection status UI
   * @param {string} status - 'checking', 'connected', or 'error'
   * @param {string} [message] - Optional message to display
   */
  function updateConnectionStatus(status, message = '') {
    if (!elements.connectionStatus) return;
    
    let html = '';
    switch (status) {
      case 'checking':
        html = '<div class="status-checking">Checking server connection...</div>';
        break;
      case 'connected':
        html = '<div class="status-connected">Server connected</div>';
        break;
      case 'error':
        html = `<div class="status-error">${message || 'Server connection issues. Some features may not work correctly.'}</div>`;
        
        // Add retry button
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry Connection';
        retryButton.className = 'retry-button';
        retryButton.addEventListener('click', () => {
          window.location.reload();
        });
        
        elements.connectionStatus.innerHTML = html;
        elements.connectionStatus.appendChild(retryButton);
        return;
      default:
        html = '<div>Unknown status</div>';
    }
    
    elements.connectionStatus.innerHTML = html;
  }
  
  /**
   * Show/hide setup instructions
   * @param {boolean} show - Whether to show or hide instructions
   * @param {Function} continueCallback - Callback for the "Continue Anyway" button
   */
  function toggleSetupInstructions(show, continueCallback) {
    if (!elements.setupInstructions) return;
    
    if (show) {
      elements.setupInstructions.classList.remove('hidden');
      
      // Set up continue button
      const continueButton = document.getElementById('continue-anyway');
      if (continueButton && continueCallback) {
        continueButton.addEventListener('click', () => {
          elements.setupInstructions.classList.add('hidden');
          if (typeof continueCallback === 'function') {
            continueCallback();
          }
        });
      }
    } else {
      elements.setupInstructions.classList.add('hidden');
    }
  }
  
  /**
   * Show the champions dropdown
   */
  function showChampionsDropdown() {
    if (elements.championsDropdown) {
      elements.championsDropdown.classList.remove('hidden');
    }
  }
  
  /**
   * Hide the champions dropdown
   */
  function hideChampionsDropdown() {
    if (elements.championsDropdown) {
      elements.championsDropdown.classList.add('hidden');
    }
  }
  
  /**
   * Show loading indicator
   */
  function showLoading() {
    if (elements.loadingIndicator) {
      elements.loadingIndicator.classList.remove('hidden');
    }
  }
  
  /**
   * Hide loading indicator
   */
  function hideLoading() {
    if (elements.loadingIndicator) {
      elements.loadingIndicator.classList.add('hidden');
    }
  }
  
  /**
   * Show champion info section and scroll to it
   */
  function showChampionInfo() {
    if (elements.championInfoSection) {
      elements.championInfoSection.classList.remove('hidden');
      elements.championInfoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  /**
   * Hide champion info section
   */
  function hideChampionInfo() {
    if (elements.championInfoSection) {
      elements.championInfoSection.classList.add('hidden');
    }
  }
  
  /**
   * Display an error message to the user
   * @param {string} message - Error message to display
   */
  function showError(message) {
    hideLoading();
    alert(message || 'An error occurred. Please try again.');
  }
  
  // Export the UI utilities
  export default {
    elements,
    initializeUIElements,
    updateConnectionStatus,
    toggleSetupInstructions,
    showChampionsDropdown,
    hideChampionsDropdown,
    showLoading,
    hideLoading,
    showChampionInfo,
    hideChampionInfo,
    showError
  };