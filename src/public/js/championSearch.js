/**
 * Champion Search Module - Handles champion search functionality
 */

// Cache for champion data
let championsData = {};

/**
 * Initialize champion search functionality
 * @param {Object} ui - UI utilities module
 * @param {Object} api - API utilities module
 * @param {Function} onChampionSelected - Callback when a champion is selected
 */
function initChampionSearch(ui, api, onChampionSelected) {
  const { searchInput, searchButton } = ui.elements;
  
  if (!searchInput || !searchButton) {
    console.error('Missing required elements for champion search');
    return;
  }
  
  // Setup event listeners for search input
  searchInput.addEventListener('input', () => handleSearchInput(ui));
  
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length > 0) {
      ui.showChampionsDropdown();
    }
  });
  
  // Setup search button click
  searchButton.addEventListener('click', () => {
    const value = searchInput.value.trim();
    if (value.length > 0) {
      searchChampion(value, ui, api, onChampionSelected);
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-container') && !event.target.closest('.dropdown-content')) {
      ui.hideChampionsDropdown();
    }
  });
  
  // Press Enter to search
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      const value = searchInput.value.trim();
      if (value.length > 0) {
        searchChampion(value, ui, api, onChampionSelected);
      }
    }
  });
}

/**
 * Load champion data from the API
 * @param {Object} api - API utilities module
 * @param {Object} ui - UI utilities module
 * @returns {Promise<Object>} - Champion data object
 */
async function loadChampionData(api, ui) {
  try {
    championsData = await api.fetchChampionsData();
    return championsData;
  } catch (error) {
    console.error('Failed to load champion data:', error);
    ui.showError('Failed to load champion data. Please check your internet connection and try refreshing the page.');
    throw error;
  }
}

/**
 * Get champion data (either from cache or by loading it)
 * @param {Object} api - API utilities module
 * @param {Object} ui - UI utilities module
 * @returns {Promise<Object>} - Champion data object
 */
async function getChampionData(api, ui) {
  if (Object.keys(championsData).length > 0) {
    return championsData;
  }
  
  return await loadChampionData(api, ui);
}

/**
 * Handle search input changes
 * @param {Object} ui - UI utilities module
 */
function handleSearchInput(ui) {
  const value = ui.elements.searchInput.value.trim().toLowerCase();
  
  if (value.length === 0) {
    ui.hideChampionsDropdown();
    return;
  }
  
  // Filter champions based on input
  const filteredChampions = Object.values(championsData).filter(champion => {
    return champion.name.toLowerCase().includes(value) || 
           champion.id.toLowerCase().includes(value);
  });
  
  // Display champions in dropdown
  displayChampionsDropdown(filteredChampions, ui);
}

/**
 * Display champions in the dropdown
 * @param {Array<Object>} champions - Filtered champions to display
 * @param {Object} ui - UI utilities module
 */
function displayChampionsDropdown(champions, ui) {
  const { championsDropdown } = ui.elements;
  
  // Clear previous results
  championsDropdown.innerHTML = '';
  
  if (champions.length === 0) {
    championsDropdown.innerHTML = '<div class="champion-option">No champions found</div>';
    ui.showChampionsDropdown();
    return;
  }
  
  // Sort champions alphabetically
  champions.sort((a, b) => a.name.localeCompare(b.name));
  
  // Add champions to dropdown
  champions.forEach(champion => {
    const championElement = document.createElement('div');
    championElement.className = 'champion-option';
    championElement.dataset.championId = champion.id;
    
    // Get the latest version for the image
    const version = champion.version || '14.6.1';
    
    championElement.innerHTML = `
      <img src="https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full}" alt="${champion.name}">
      <div class="champion-option-details">
        <h3>${champion.name}</h3>
        <p>${champion.title}</p>
      </div>
    `;
    
    // Add image error handler
    const img = championElement.querySelector('img');
    img.onerror = function() {
      this.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/default.png';
    };
    
    // Add click event
    championElement.addEventListener('click', () => {
      searchChampion(champion.id, ui, api, onChampionSelected);
    });
    
    championsDropdown.appendChild(championElement);
  });
  
  ui.showChampionsDropdown();
}

/**
 * Search for a champion
 * @param {string} championId - ID of the champion to search
 * @param {Object} ui - UI utilities module
 * @param {Object} api - API utilities module
 * @param {Function} onChampionSelected - Callback when a champion is selected
 */
async function searchChampion(championId, ui, api, onChampionSelected) {
  try {
    if (!championId || typeof championId !== 'string') {
      throw new Error('Invalid champion ID');
    }
    
    // Hide dropdown and show loading
    ui.hideChampionsDropdown();
    ui.showLoading();
    
    // Get the selected team composition
    const teamCompSelect = document.getElementById('enemy-team-comp');
    const teamComp = teamCompSelect ? teamCompSelect.value : 'balanced';
    
    // Get recommendations from API
    const data = await api.getChampionRecommendations(championId, teamComp);
    
    // Hide loading
    ui.hideLoading();
    
    // Call the callback with the champion data
    if (typeof onChampionSelected === 'function') {
      onChampionSelected(data);
    }
  } catch (error) {
    console.error('Error searching champion:', error);
    ui.hideLoading();
    
    // Show a more helpful error message
    let errorMessage = error.message || 'Unknown error';
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      errorMessage = 'Could not connect to server. Please check your internet connection and try again.';
    }
    
    ui.showError(`Failed to analyze champion: ${errorMessage}. Please try again.`);
  }
}

// Export the champion search functions
export default {
  initChampionSearch,
  loadChampionData,
  getChampionData,
  searchChampion
};