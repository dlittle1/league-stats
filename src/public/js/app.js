/**
 * Main Application Module - Entry point that coordinates all functionality
 */

// Import modules
import api from './api.js';
import ui from './ui.js';
import utils from './utils.js';
import championSearch from './championSearch.js';
import championDisplay from './championDisplay.js';

// Global state
let serverHealthy = false;

/**
 * Initialize the application
 */
async function initApp() {
  try {
    console.log('Initializing application...');
    
    // Initialize UI elements
    ui.initializeUIElements();
    
    // Update connection status
    ui.updateConnectionStatus('checking');
    
    // Check server health
    let serverOk = false;
    try {
      const healthData = await api.checkServerHealth();
      if (healthData && healthData.status === 'ok') {
        console.log('Server is healthy');
        serverHealthy = true;
        ui.updateConnectionStatus('connected');
        serverOk = true;
      } else {
        throw new Error('Server health check failed');
      }
    } catch (error) {
      console.warn('Server health check failed:', error);
      ui.updateConnectionStatus('error', 'Server connection issues. Some features may not work correctly.');
    }
    
    // Check for champion data
    try {
      if (serverOk) {
        // Try to get champion data
        const testResponse = await api.testChampion('Lux');
        
        // If successful, hide setup instructions
        if (testResponse && testResponse.success) {
          ui.toggleSetupInstructions(false);
        } else {
          // Show setup instructions
          ui.toggleSetupInstructions(true, () => {
            console.log('User chose to continue anyway');
          });
        }
      } else {
        // Show setup instructions if server isn't healthy
        ui.toggleSetupInstructions(true);
      }
    } catch (error) {
      console.warn('Champion data check failed:', error);
      // Show setup instructions
      ui.toggleSetupInstructions(true);
    }
    
    // Initialize champion search if server is healthy
    if (serverOk) {
      try {
        // Load champion data
        await championSearch.loadChampionData(api, ui);
        
        // Setup event listeners for search
        championSearch.initChampionSearch(ui, api, (data) => {
          // When a champion is selected, display its info
          championDisplay.displayChampionInfo(data, ui, utils);
        });
        
        console.log('Application initialized successfully');
      } catch (error) {
        console.error('Error initializing application components:', error);
        ui.showError('Failed to initialize application. Please check the console for more information and try refreshing the page.');
      }
    } else {
      console.warn('Server not healthy, skipping champion data fetch');
    }
    
    // Add global event listeners
    setupGlobalEventListeners();
  } catch (error) {
    console.error('Error initializing app:', error);
    ui.showError('Failed to initialize application. Please check the console for more information and try refreshing the page.');
  }
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
  // Team composition changes
  const teamCompSelect = document.getElementById('enemy-team-comp');
  if (teamCompSelect) {
    teamCompSelect.addEventListener('change', () => {
      // If a champion is already displayed, update the recommendations
      if (!ui.elements.championInfoSection.classList.contains('hidden')) {
        const championId = ui.elements.championName.textContent;
        if (championId) {
          // Re-search the current champion with the new team comp
          championSearch.searchChampion(championId, ui, api, (data) => {
            championDisplay.displayChampionInfo(data, ui, utils);
          });
        }
      }
    });
  }
  
  // Close explanations when clicking outside
  document.addEventListener('click', (e) => {
    const explanations = document.querySelectorAll('.detailed-explanation');
    if (explanations.length > 0 && 
        !e.target.closest('.detailed-explanation') && 
        !e.target.closest('.item-explanation-toggle')) {
      
      explanations.forEach(el => {
        el.classList.add('hidden');
      });
      
      document.querySelectorAll('.item-explanation-toggle').forEach(toggle => {
        toggle.textContent = 'Why this item?';
      });
    }
  });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export public API for potential use in other modules
export default {
  initApp
};