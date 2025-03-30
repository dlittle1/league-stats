// Global variables
let championsData = {};
let statsChart = null;
let serverHealthy = false;

// DOM elements
const searchInput = document.getElementById('champion-search');
const searchButton = document.getElementById('search-button');
const championsDropdown = document.getElementById('champions-dropdown');
const championInfoSection = document.getElementById('champion-info');
const loadingIndicator = document.getElementById('loading');

// Initialize the application
async function initApp() {
  try {
    console.log('Initializing application...');
    
    // Update connection status
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
      connectionStatus.innerHTML = '<div class="status-checking">Checking server connection...</div>';
    }
    
    // Setup instructions element
    const setupInstructions = document.getElementById('setup-instructions');
    
    // Check server health
    let serverOk = false;
    try {
      const healthCheck = await fetch('/api/health');
      if (healthCheck.ok) {
        console.log('Server is healthy');
        serverHealthy = true;
        if (connectionStatus) {
          connectionStatus.innerHTML = '<div class="status-connected">Server connected</div>';
        }
        serverOk = true;
      } else {
        throw new Error('Server health check failed');
      }
    } catch (error) {
      console.warn('Server health check failed:', error);
      if (connectionStatus) {
        connectionStatus.innerHTML = '<div class="status-error">Server connection issues. Some features may not work correctly.</div>';
      }
      
      // Add a basic retry button if health check fails
      if (connectionStatus) {
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry Connection';
        retryButton.className = 'retry-button';
        retryButton.addEventListener('click', () => {
          window.location.reload();
        });
        connectionStatus.appendChild(retryButton);
      }
    }
    
    // Check for champion data
    try {
      // Try to get champion data
      const testResponse = await fetch('/api/test/champion/Lux');
      const testData = await testResponse.json();
      
      // If successful, hide setup instructions
      if (testData && testData.success) {
        if (setupInstructions) {
          setupInstructions.classList.add('hidden');
        }
      } else {
        // Show setup instructions
        if (setupInstructions) {
          setupInstructions.classList.remove('hidden');
          
          // Set up continue anyway button
          const continueButton = document.getElementById('continue-anyway');
          if (continueButton) {
            continueButton.addEventListener('click', () => {
              setupInstructions.classList.add('hidden');
            });
          }
        }
      }
    } catch (error) {
      console.warn('Champion data check failed:', error);
      // Show setup instructions
      if (setupInstructions) {
        setupInstructions.classList.remove('hidden');
      }
    }
    
    // Check if all required DOM elements exist
    const requiredElements = [
      'champion-search', 'search-button', 'champions-dropdown', 
      'champion-info', 'loading', 'champion-image', 'champion-name', 
      'champion-title', 'champion-tags', 'passive-icon', 'passive-name', 
      'passive-description', 'q-icon', 'q-name', 'q-description',
      'w-icon', 'w-name', 'w-description', 'e-icon', 'e-name', 
      'e-description', 'r-icon', 'r-name', 'r-description',
      'stats-chart', 'core-items', 'boots-items', 'enemy-team-comp',
      'current-team-comp', 'team-strategy-text', 'connection-status'
    ];
    
    // Log any missing elements but don't fail
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
      console.warn('Missing DOM elements:', missingElements);
    }
    
    // Fetch champions data from our API and set up event listeners
    if (serverOk) {
      try {
        // Fetch champions data from our API
        console.log('Fetching champion data...');
        const response = await fetch('/api/champions');
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        championsData = await response.json();
        console.log('Champion data loaded:', Object.keys(championsData).length, 'champions');
        
        // Set up event listeners
        setupEventListeners();
        console.log('Application initialized successfully');
      } catch (error) {
        console.error('Error fetching champion data:', error);
        alert('Failed to load champion data. Please check the console for more information and try refreshing the page.');
      }
    } else {
      console.warn('Server not healthy, skipping champion data fetch');
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    alert('Failed to initialize application. Please check the console for more information and try refreshing the page.');
  }
}

// Set up event listeners
function setupEventListeners() {
  // Search input events
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.length > 0) {
      showChampionsDropdown();
    }
  });
  
  // Search button click
  searchButton.addEventListener('click', () => {
    const value = searchInput.value.trim();
    if (value.length > 0) {
      searchChampion(value);
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-container') && !event.target.closest('.dropdown-content')) {
      hideChampionsDropdown();
    }
  });
  
  // Press Enter to search
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      const value = searchInput.value.trim();
      if (value.length > 0) {
        searchChampion(value);
      }
    }
  });
}

// Handle search input
function handleSearchInput() {
  const value = searchInput.value.trim().toLowerCase();
  
  if (value.length === 0) {
    hideChampionsDropdown();
    return;
  }
  
  // Filter champions based on input
  const filteredChampions = Object.values(championsData).filter(champion => {
    return champion.name.toLowerCase().includes(value) || 
           champion.id.toLowerCase().includes(value);
  });
  
  // Display champions in dropdown
  displayChampionsDropdown(filteredChampions);
}

// Display champions in dropdown
function displayChampionsDropdown(champions) {
  // Clear previous results
  championsDropdown.innerHTML = '';
  
  if (champions.length === 0) {
    championsDropdown.innerHTML = '<div class="champion-option">No champions found</div>';
    showChampionsDropdown();
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
    
    // Add click event
    championElement.addEventListener('click', () => {
      searchChampion(champion.id);
    });
    
    championsDropdown.appendChild(championElement);
  });
  
  showChampionsDropdown();
}

// Show champions dropdown
function showChampionsDropdown() {
  championsDropdown.classList.remove('hidden');
}

// Hide champions dropdown
function hideChampionsDropdown() {
  championsDropdown.classList.add('hidden');
}

// Clean ability description from HTML tags
function cleanDescription(description) {
  return description
    .replace(/<br>/g, ' ')
    .replace(/<[^>]*>/g, '');
}

// Search for a champion
async function searchChampion(championId) {
  try {
    if (!championId || typeof championId !== 'string') {
      throw new Error('Invalid champion ID');
    }
    
    // Hide dropdown and show loading
    hideChampionsDropdown();
    showLoading();
    
    // Get the selected team composition
    const teamCompSelect = document.getElementById('enemy-team-comp');
    const teamComp = teamCompSelect ? teamCompSelect.value : 'balanced';
    
    console.log(`Searching for champion: ${championId} with team composition: ${teamComp}`);
    
    // Get recommendations from API with team composition parameter
    const apiUrl = `/api/recommendations/${encodeURIComponent(championId)}?teamComp=${encodeURIComponent(teamComp)}`;
    console.log(`Fetching from: ${apiUrl}`);
    
    // Set timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Handle non-200 responses
        let errorMessage = `Server returned ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage += `: ${errorData.error}`;
          }
        } catch (jsonError) {
          // If can't parse JSON, use the status text
          errorMessage += `: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('API response received');
      
      if (!data) {
        throw new Error('Empty response received from server');
      }
      
      if (!data.champion) {
        throw new Error('Response missing champion data');
      }
      
      // Display champion info
      displayChampionInfo(data);
      
      // Hide loading
      hideLoading();
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. Server might be busy.');
      } else {
        throw fetchError;
      }
    }
  } catch (error) {
    console.error('Error searching champion:', error);
    hideLoading();
    
    // Show a more helpful error message
    let errorMessage = error.message || 'Unknown error';
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      errorMessage = 'Could not connect to server. Please check your internet connection and try again.';
    }
    
    alert(`Failed to analyze champion: ${errorMessage}. Please try again.`);
  }
}

// Display champion information
function displayChampionInfo(data) {
  try {
    // Ensure we have valid data
    if (!data || !data.champion) {
      throw new Error('Invalid champion data');
    }
    
    console.log('Displaying champion info:', data.champion.id);
    console.log('Champion data:', data.champion);
    
    const { champion, statPriorities, recommendedItems } = data;
    const version = champion.version || '14.6.1';
    
    // Get all relevant DOM elements upfront
    const elements = {
      // Champion header
      championImage: document.getElementById('champion-image'),
      championName: document.getElementById('champion-name'),
      championTitle: document.getElementById('champion-title'),
      championTags: document.getElementById('champion-tags'),
      
      // Abilities
      passiveIcon: document.getElementById('passive-icon'),
      passiveName: document.getElementById('passive-name'),
      passiveDescription: document.getElementById('passive-description'),
      
      qIcon: document.getElementById('q-icon'),
      qName: document.getElementById('q-name'),
      qDescription: document.getElementById('q-description'),
      
      wIcon: document.getElementById('w-icon'),
      wName: document.getElementById('w-name'),
      wDescription: document.getElementById('w-description'),
      
      eIcon: document.getElementById('e-icon'),
      eName: document.getElementById('e-name'),
      eDescription: document.getElementById('e-description'),
      
      rIcon: document.getElementById('r-icon'),
      rName: document.getElementById('r-name'),
      rDescription: document.getElementById('r-description'),
      
      // Stats and items
      statsChart: document.getElementById('stats-chart'),
      coreItems: document.getElementById('core-items'),
      bootsItems: document.getElementById('boots-items'),
      
      // Container
      championInfo: document.getElementById('champion-info')
    };
    
    // Check for missing elements
    const missingElements = [];
    for (const [key, element] of Object.entries(elements)) {
      if (!element) {
        missingElements.push(key);
      }
    }
    
    if (missingElements.length > 0) {
      console.error('Missing DOM elements:', missingElements);
      throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
    }
    
    // Now that we've verified all elements exist, update them
    
    // Update champion header - with try/catch for each operation
    try {
      // Set champion image with error handler
      try {
        const imageSrc = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`;
        console.log(`Setting champion image: ${imageSrc}`);
        elements.championImage.onerror = function() {
          this.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image?.full || 'default.png'}`;
        };
        elements.championImage.src = imageSrc;
      } catch (imgError) {
        console.error('Error setting champion image:', imgError);
        elements.championImage.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/default.png';
      }
      
      // Set champion name and title
      elements.championName.textContent = champion.name || 'Unknown Champion';
      elements.championTitle.textContent = champion.title || '';
      
      // Update champion tags
      elements.championTags.innerHTML = '';
      if (champion.tags && Array.isArray(champion.tags)) {
        champion.tags.forEach(tag => {
          const tagElement = document.createElement('div');
          tagElement.className = 'champion-tag';
          tagElement.textContent = tag;
          elements.championTags.appendChild(tagElement);
        });
      }
      
      // Update team composition display
      if (elements.currentTeamComp) {
        const teamCompDisplay = {
          'squishy': 'Squishy (0-1 tanks)',
          'tanky': 'Tanky (2+ tanks)',
          'cc-heavy': 'CC-Heavy',
          'balanced': 'Balanced'
        };
        elements.currentTeamComp.textContent = teamCompDisplay[teamComp || 'balanced'];
        
        // Add appropriate styling based on team composition
        elements.currentTeamComp.className = '';
        elements.currentTeamComp.classList.add(`team-${teamComp || 'balanced'}`);
      }
    } catch (headerError) {
      console.error('Error updating champion header:', headerError);
    }
    
    // Update abilities with error handling
    try {
      // Update passive
      if (champion.passive && champion.passive.image) {
        try {
          const passiveIconSrc = `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/${champion.passive.image.full}`;
          elements.passiveIcon.onerror = function() {
            this.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/default.png';
          };
          elements.passiveIcon.src = passiveIconSrc;
          elements.passiveName.textContent = champion.passive.name || 'Passive';
          elements.passiveDescription.textContent = 
            cleanDescription(champion.passive.description || 'No description available');
        } catch (passiveError) {
          console.error('Error updating passive:', passiveError);
          elements.passiveIcon.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/default.png';
          elements.passiveName.textContent = 'Passive';
          elements.passiveDescription.textContent = 'No description available';
        }
      } else {
        console.warn('Missing passive data');
        elements.passiveIcon.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/default.png';
        elements.passiveName.textContent = 'Passive';
        elements.passiveDescription.textContent = 'No description available';
      }
      
      // Update abilities Q, W, E, R
      const abilities = [
        { key: 'q', elements: { icon: elements.qIcon, name: elements.qName, description: elements.qDescription } },
        { key: 'w', elements: { icon: elements.wIcon, name: elements.wName, description: elements.wDescription } },
        { key: 'e', elements: { icon: elements.eIcon, name: elements.eName, description: elements.eDescription } },
        { key: 'r', elements: { icon: elements.rIcon, name: elements.rName, description: elements.rDescription } }
      ];
      
      for (let i = 0; i < 4; i++) {
        try {
          const ability = champion.spells && champion.spells[i] ? champion.spells[i] : null;
          const { key, elements: abilityElements } = abilities[i];
          
          if (ability && ability.image) {
            const iconSrc = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${ability.image.full}`;
            abilityElements.icon.onerror = function() {
              this.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/default.png';
            };
            abilityElements.icon.src = iconSrc;
            abilityElements.name.textContent = ability.name || key.toUpperCase();
            abilityElements.description.textContent = 
              cleanDescription(ability.description || 'No description available');
          } else {
            console.warn(`Missing data for ability ${key}`);
            abilityElements.icon.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/default.png';
            abilityElements.name.textContent = key.toUpperCase();
            abilityElements.description.textContent = 'No description available';
          }
        } catch (abilityError) {
          console.error(`Error updating ability ${abilities[i].key}:`, abilityError);
        }
      }
    } catch (abilitiesError) {
      console.error('Error updating abilities:', abilitiesError);
    }
    
    // Display stat priorities chart with error handling
    try {
      if (elements.statsChart) {
        const ctx = elements.statsChart.getContext('2d');
        if (ctx) {
          // If a chart already exists, destroy it
          if (statsChart) {
            statsChart.destroy();
          }
          
          const chartData = statPriorities || {
            AP: 0.5,
            AD: 0.5,
            TANK: 0.5,
            ATTACK_SPEED: 0.5,
            MOVEMENT: 0.5,
            HEALING: 0.5,
            ABILITY_HASTE: 0.5,
            CROWD_CONTROL: 0.5
          };
          
          try {
            // Create chart
            displayStatsPriorityChart(ctx, chartData);
          } catch (chartCreationError) {
            console.error('Error creating chart:', chartCreationError);
          }
        } else {
          console.error('Could not get 2D context for stats chart');
        }
      } else {
        console.error('Stats chart element not found');
      }
    } catch (chartError) {
      console.error('Error displaying stats chart:', chartError);
    }
    
    // Display recommended items with error handling
    try {
      // Process core items
      try {
        const coreItems = recommendedItems?.core || [];
        displayRecommendedItems(elements.coreItems, coreItems, champion);
      } catch (coreError) {
        console.error('Error displaying core items:', coreError);
        elements.coreItems.innerHTML = '<p>Error displaying recommendations</p>';
      }
      
      // Process boots items
      try {
        const bootsItems = recommendedItems?.boots || [];
        displayRecommendedItems(elements.bootsItems, bootsItems, champion);
      } catch (bootsError) {
        console.error('Error displaying boots items:', bootsError);
        elements.bootsItems.innerHTML = '<p>Error displaying recommendations</p>';
      }
    } catch (itemsError) {
      console.error('Error displaying recommended items:', itemsError);
    }
    
    // Show champion info section
    elements.championInfo.classList.remove('hidden');
    
    // Scroll to champion info
    elements.championInfo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error('Error in displayChampionInfo:', error);
    alert(`Error displaying champion info: ${error.message}. Please try again.`);
  }
}

// Display stats priority chart
function displayStatsPriorityChart(ctx, statPriorities) {
  try {
    // If a chart already exists, destroy it
    if (statsChart) {
      statsChart.destroy();
    }
    
    // Ensure we have valid data
    if (!statPriorities || typeof statPriorities !== 'object') {
      console.warn('Invalid stat priorities data:', statPriorities);
      statPriorities = {
        AP: 0.5,
        AD: 0.5,
        TANK: 0.5,
        ATTACK_SPEED: 0.5,
        MOVEMENT: 0.5,
        HEALING: 0.5,
        ABILITY_HASTE: 0.5,
        CROWD_CONTROL: 0.5
      };
    }
    
    // Prepare data for chart
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    // Define colors for each stat
    const statColors = {
      AP: 'rgba(123, 104, 238, 0.7)',
      AD: 'rgba(220, 20, 60, 0.7)',
      TANK: 'rgba(46, 139, 87, 0.7)',
      ATTACK_SPEED: 'rgba(255, 215, 0, 0.7)',
      MOVEMENT: 'rgba(64, 224, 208, 0.7)',
      HEALING: 'rgba(255, 182, 193, 0.7)',
      ABILITY_HASTE: 'rgba(100, 149, 237, 0.7)',
      CROWD_CONTROL: 'rgba(255, 165, 0, 0.7)'
    };
    
    // Define display names
    const statDisplayNames = {
      AP: 'Ability Power',
      AD: 'Attack Damage',
      TANK: 'Tankiness',
      ATTACK_SPEED: 'Attack Speed',
      MOVEMENT: 'Movement',
      HEALING: 'Healing',
      ABILITY_HASTE: 'Ability Haste',
      CROWD_CONTROL: 'Crowd Control'
    };
    
    // Sort stats by priority (highest first)
    const sortedStats = Object.entries(statPriorities)
      .sort((a, b) => b[1] - a[1]);
    
    // Add data for chart
    sortedStats.forEach(([stat, value]) => {
      labels.push(statDisplayNames[stat] || stat);
      data.push(Math.min(Math.max(value, 0), 1) * 100); // Convert to percentage, clamped between 0-100
      backgroundColors.push(statColors[stat] || 'rgba(200, 200, 200, 0.7)');
    });
    
    // Create chart with error handling
    try {
      const chartOptions = {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Stat Priority (%)',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Priority: ${context.raw.toFixed(1)}%`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                color: '#A09B8C'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            x: {
              ticks: {
                color: '#A09B8C'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          }
        }
      };
      
      if (typeof Chart === 'undefined') {
        console.error('Chart.js is not available');
        return;
      }
      
      statsChart = new Chart(ctx, chartOptions);
      console.log('Chart created successfully');
    } catch (chartError) {
      console.error('Error creating chart:', chartError);
    }
  } catch (error) {
    console.error('Error in displayStatsPriorityChart:', error);
  }
}

// Display recommended items
function displayRecommendedItems(container, items, champion) {
  try {
    // Clear the container
    container.innerHTML = '';
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<p>No recommendations available</p>';
      return;
    }
    
    // Create a container for detailed explanation
    const explanationContainer = document.createElement('div');
    explanationContainer.className = 'detailed-explanation hidden';
    explanationContainer.innerHTML = '<h4>Item Explanation</h4><div class="explanation-content"></div>';
    container.parentElement.appendChild(explanationContainer);
    
    // Create a container for items
    const itemsGrid = document.createElement('div');
    itemsGrid.className = 'items-grid';
    container.appendChild(itemsGrid);
    
    // Display each item
    items.forEach(itemData => {
      try {
        const { item, score } = itemData;
        
        if (!item) {
          console.warn('Missing item data in recommendation');
          return;
        }
        
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card';
        
        const scorePercentage = score ? (score * 100).toFixed(1) : '0.0';
        const itemName = item.name || 'Unknown Item';
        const itemImage = item.image && item.image.full ? item.image.full : 'default.png';
        
        // Generate explanation for why this item is recommended
        const explanation = generateItemExplanation(item, champion, score);
        
        itemElement.innerHTML = `
          <div class="item-image-container">
            <img src="https://ddragon.leagueoflegends.com/cdn/14.6.1/img/item/${itemImage}" 
                 alt="${itemName}"
                 onerror="this.src='https://ddragon.leagueoflegends.com/cdn/14.6.1/img/ui/items.png'">
          </div>
          <div class="item-info">
            <h5 title="${itemName}">${itemName}</h5>
            <div class="item-score">Match: ${scorePercentage}%</div>
            <div class="item-explanation-toggle">Why this item?</div>
          </div>
        `;
        
        // Add tooltip with item description
        itemElement.addEventListener('mouseover', () => {
          const description = item.description ? cleanDescription(item.description) : 'No description available';
          itemElement.title = `${itemName}\n${description}`;
        });
        
        // Add to container
        itemsGrid.appendChild(itemElement);
        
        // Add click handler to show explanation
        const toggle = itemElement.querySelector('.item-explanation-toggle');
        if (toggle) {
          toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Update all toggles to default text
            document.querySelectorAll('.item-explanation-toggle').forEach(el => {
              el.textContent = 'Why this item?';
            });
            
            // This toggle shows "Selected"
            toggle.textContent = 'Selected';
            
            // Update explanation container
            const explanationContent = explanationContainer.querySelector('.explanation-content');
            if (explanationContent) {
              explanationContent.innerHTML = `
                <div class="explanation-header">
                  <img src="https://ddragon.leagueoflegends.com/cdn/14.6.1/img/item/${itemImage}" 
                       alt="${itemName}">
                  <h5>${itemName}</h5>
                </div>
                <div class="explanation-body">
                  ${explanation}
                </div>
              `;
            }
            
            // Show explanation container
            explanationContainer.classList.remove('hidden');
            
            console.log('Toggle clicked, showing explanation for:', itemName);
          });
        }
      } catch (itemError) {
        console.error('Error rendering item:', itemError);
      }
    });
  } catch (error) {
    console.error(`Error displaying items:`, error);
  }
}

// Generate explanation for why an item is recommended for a champion
function generateItemExplanation(item, champion, score) {
  try {
    if (!item || !champion) {
      return 'No explanation available';
    }
    
    // Get the selected team composition
    const teamCompSelect = document.getElementById('enemy-team-comp');
    const teamComp = teamCompSelect ? teamCompSelect.value : 'balanced';
    
    const itemName = item.name || 'This item';
    const championName = champion.name || 'This champion';
    const itemDesc = item.description || '';
    const cleanItemDesc = cleanDescription(itemDesc).toLowerCase();
    const championId = champion.id.toLowerCase();
    
    // Extract champion ability keywords
    const abilityKeywords = [];
    if (champion.passive && champion.passive.description) {
      const passiveDesc = cleanDescription(champion.passive.description).toLowerCase();
      abilityKeywords.push({
        name: champion.passive.name || 'Passive',
        desc: passiveDesc,
        keywords: extractKeywords(passiveDesc)
      });
    }
    
    if (champion.spells && Array.isArray(champion.spells)) {
      for (let i = 0; i < Math.min(champion.spells.length, 4); i++) {
        const spell = champion.spells[i];
        if (spell && spell.description) {
          const spellDesc = cleanDescription(spell.description).toLowerCase();
          const spellKey = ['Q', 'W', 'E', 'R'][i];
          abilityKeywords.push({
            name: `${spellKey}: ${spell.name || ''}`,
            desc: spellDesc,
            keywords: extractKeywords(spellDesc)
          });
        }
      }
    }
    
    // Check item attributes
    const hasMana = cleanItemDesc.includes('mana') || item.tags?.includes('Mana');
    const hasAP = cleanItemDesc.includes('ability power') || cleanItemDesc.includes('ap') || item.tags?.includes('SpellDamage');
    const hasAD = cleanItemDesc.includes('attack damage') || cleanItemDesc.includes('ad') || item.tags?.includes('Damage');
    const hasAttackSpeed = cleanItemDesc.includes('attack speed') || item.tags?.includes('AttackSpeed');
    const hasAbilityHaste = cleanItemDesc.includes('ability haste') || cleanItemDesc.includes('cooldown') || item.tags?.includes('CooldownReduction');
    const hasHealth = cleanItemDesc.includes('health') || item.tags?.includes('Health');
    const hasArmor = cleanItemDesc.includes('armor') || item.tags?.includes('Armor');
    const hasMagicResist = cleanItemDesc.includes('magic resist') || cleanItemDesc.includes('magic resistance') || item.tags?.includes('SpellBlock');
    const hasLifesteal = cleanItemDesc.includes('lifesteal') || cleanItemDesc.includes('omnivamp') || cleanItemDesc.includes('vamp');
    const hasOnHit = cleanItemDesc.includes('on-hit') || cleanItemDesc.includes('on hit');
    const hasSheen = cleanItemDesc.includes('sheen') || cleanItemDesc.includes('spellblade');
    
    // Generate explanation
    let explanation = `<p>${itemName} is recommended for ${championName} because:</p><ul>`;
    let synergiesAdded = 0;
    
    // Check for special champion-specific synergies
    if (championId === 'sylas' && (item.name.toLowerCase().includes('sunderer') || hasLifesteal)) {
      explanation += `<li><strong>Perfect for Sylas:</strong> Provides healing that synergizes with his passive and W ability, enhancing his survivability while dealing damage</li>`;
      synergiesAdded++;
    }
    
    if ((championId === 'ezreal' || championId === 'gangplank') && hasSheen) {
      explanation += `<li><strong>Sheen Synergy:</strong> ${championName} can proc Sheen effects frequently with ability usage, significantly increasing damage output</li>`;
      synergiesAdded++;
    }
    
    if (hasHealingAbility(champion) && hasLifesteal) {
      explanation += `<li><strong>Healing Amplification:</strong> Enhances ${championName}'s natural healing abilities, creating exceptional sustain in fights</li>`;
      synergiesAdded++;
    }
    
    // Check for ability synergies
    for (const ability of abilityKeywords) {
      const itemKeywords = extractKeywords(cleanItemDesc);
      const abilityDesc = ability.desc;
      
      // Look for meaningful keyword matches
      if (abilityDesc.includes('heal') && cleanItemDesc.includes('heal')) {
        explanation += `<li>Amplifies the healing from <strong>${ability.name}</strong>, increasing survivability</li>`;
        synergiesAdded++;
      }
      
      if ((abilityDesc.includes('attack') || abilityDesc.includes('auto')) && hasOnHit) {
        explanation += `<li>Enhances <strong>${ability.name}</strong> with additional on-hit effects</li>`;
        synergiesAdded++;
      }
      
      if (abilityDesc.includes('shield') && (hasAP || hasHealth)) {
        explanation += `<li>Increases the strength of shields from <strong>${ability.name}</strong></li>`;
        synergiesAdded++;
      }
      
      if ((abilityDesc.includes('cooldown') || abilityDesc.includes('reset')) && hasAbilityHaste) {
        explanation += `<li>Reduces cooldowns for <strong>${ability.name}</strong>, allowing more frequent use</li>`;
        synergiesAdded++;
      }
      
      // If we've added enough ability synergies, stop checking
      if (synergiesAdded >= 3) break;
    }
    
    // Add team composition-specific explanation
    const teamCompText = {
      'squishy': 'squishy enemies',
      'tanky': 'tanky enemies',
      'cc-heavy': 'CC-heavy enemies',
      'balanced': 'a balanced enemy team'
    };
    
    // Check for team composition synergies
    const itemNameLower = itemName.toLowerCase();
    
    if (teamComp === 'squishy' && 
        (itemNameLower.includes('ludens') || 
         itemNameLower.includes('night harvester') || 
         itemNameLower.includes('shadowflame') || 
         itemNameLower.includes('collector') ||
         itemNameLower.includes('infinity edge'))) {
      explanation += `<li><strong>Effective vs. ${teamCompText[teamComp]}:</strong> Provides burst damage to quickly eliminate low-health targets</li>`;
      synergiesAdded++;
    }
    
    if (teamComp === 'tanky' && 
        (itemNameLower.includes('sunderer') || 
         itemNameLower.includes('liandry') || 
         itemNameLower.includes('void staff') || 
         itemNameLower.includes('lord dominik') ||
         itemNameLower.includes('blade of the ruined king'))) {
      explanation += `<li><strong>Effective vs. ${teamCompText[teamComp]}:</strong> Helps cut through high health/resistance targets</li>`;
      synergiesAdded++;
    }
    
    if (teamComp === 'cc-heavy' && 
        (itemNameLower.includes('mercurial') || 
         itemNameLower.includes('quicksilver') || 
         itemNameLower.includes('banshee') || 
         itemNameLower.includes('edge of night'))) {
      explanation += `<li><strong>Effective vs. ${teamCompText[teamComp]}:</strong> Helps mitigate or avoid crowd control effects</li>`;
      synergiesAdded++;
    }
    
    // Champion-specific team comp explanations
    if (championId === 'sylas') {
      if (teamComp === 'squishy' && 
          (itemNameLower.includes('ludens') || 
           itemNameLower.includes('lich bane') ||
           itemNameLower.includes('electrocute'))) {
        explanation += `<li><strong>Sylas vs. ${teamCompText[teamComp]}:</strong> Enhances burst potential to quickly eliminate priority targets</li>`;
        synergiesAdded++;
      } else if (teamComp === 'tanky' && 
                (itemNameLower.includes('sunderer') || 
                 itemNameLower.includes('riftmaker') ||
                 itemNameLower.includes('conqueror'))) {
        explanation += `<li><strong>Sylas vs. ${teamCompText[teamComp]}:</strong> Provides sustained damage and healing for extended fights</li>`;
        synergiesAdded++;
      }
    }

    // Add stat-based explanations if we haven't found enough synergies
    if (synergiesAdded < 2) {
      if (hasMana && championUsesMana(champion)) {
        explanation += `<li>Provides mana which ${championName} needs for ability rotations</li>`;
        synergiesAdded++;
      }
    if (championId === 'sylas') {
      if (teamComp === 'squishy' && 
          (itemNameLower.includes('ludens') || 
           itemNameLower.includes('lich bane') ||
           itemNameLower.includes('electrocute'))) {
        explanation += `<li><strong>Sylas vs. ${teamCompText[teamComp]}:</strong> Enhances burst potential to quickly eliminate priority targets</li>`;
        synergiesAdded++;
      } else if (teamComp === 'tanky' && 
                (itemNameLower.includes('sunderer') || 
                 itemNameLower.includes('riftmaker') ||
                 itemNameLower.includes('conqueror'))) {
        explanation += `<li><strong>Sylas vs. ${teamCompText[teamComp]}:</strong> Provides sustained damage and healing for extended fights</li>`;
        synergiesAdded++;
      }
    }
      
      if (hasAP && (champion.tags?.includes('Mage') || champion.tags?.includes('Support'))) {
        explanation += `<li>Provides ability power which enhances ${championName}'s magical abilities</li>`;
        synergiesAdded++;
      }
      
      if (hasAD && (champion.tags?.includes('Fighter') || champion.tags?.includes('Marksman') || champion.tags?.includes('Assassin'))) {
        explanation += `<li>Provides attack damage which improves ${championName}'s physical damage output</li>`;
        synergiesAdded++;
      }
      
      if (hasAttackSpeed && (champion.tags?.includes('Marksman') || champion.tags?.includes('Fighter'))) {
        explanation += `<li>Increases attack speed which complements ${championName}'s auto-attack pattern</li>`;
        synergiesAdded++;
      }
      
      if (hasAbilityHaste) {
        explanation += `<li>Reduces cooldowns allowing ${championName} to use abilities more frequently</li>`;
        synergiesAdded++;
      }
      
      if (hasHealth && (champion.tags?.includes('Tank') || champion.tags?.includes('Fighter'))) {
        explanation += `<li>Increases health which improves ${championName}'s survivability</li>`;
        synergiesAdded++;
      }
      
      if ((hasArmor || hasMagicResist) && champion.tags?.includes('Tank')) {
        explanation += `<li>Provides resistances enhancing ${championName}'s tankiness</li>`;
        synergiesAdded++;
      }
    }
    
    // If no specific synergies found, add a generic explanation based on score
    if (synergiesAdded === 0) {
      if (score > 0.8) {
        explanation += `<li>Has a very high overall stat match with ${championName}'s needs</li>`;
      } else if (score > 0.6) {
        explanation += `<li>Provides a good balance of stats that complement ${championName}'s abilities</li>`;
      } else {
        explanation += `<li>Offers useful utility and stats that can benefit ${championName}</li>`;
      }
    }
    
    explanation += '</ul>';
    return explanation;
  } catch (error) {
    console.error('Error generating item explanation:', error);
    return 'No explanation available';
  }
}

// Check if champion uses mana
function championUsesMana(champion) {
  return champion && champion.partype && 
         champion.partype.toLowerCase().includes('mana');
}

// Check if champion has healing abilities
function hasHealingAbility(champion) {
  if (!champion) return false;
  
  const healingKeywords = ['heal', 'healing', 'lifesteal', 'vamp', 'regen', 'restore'];
  
  // Check passive
  if (champion.passive && champion.passive.description) {
    const passiveDesc = champion.passive.description.toLowerCase();
    if (healingKeywords.some(keyword => passiveDesc.includes(keyword))) {
      return true;
    }
  }
  
  // Check abilities
  if (champion.spells && Array.isArray(champion.spells)) {
    for (const spell of champion.spells) {
      if (spell && spell.description) {
        const spellDesc = spell.description.toLowerCase();
        if (healingKeywords.some(keyword => spellDesc.includes(keyword))) {
          return true;
        }
      }
    }
  }
  
  // Check champion id for known healing champions
  const healingChampions = ['sylas', 'soraka', 'vladimir', 'yuumi', 'sona', 'nami', 
                           'aatrox', 'swain', 'morgana', 'maokai', 'kayn', 'rhaast'];
  return healingChampions.includes(champion.id.toLowerCase());
}

// Extract meaningful keywords from text
function extractKeywords(text) {
  if (!text) return [];
  
  // Define important keywords to look for
  const importantKeywords = [
    'shield', 'heal', 'slow', 'stun', 'root', 'snare', 'bind', 'dash', 'knockup', 'knock up',
    'movement speed', 'attack speed', 'crit', 'critical', 'lifesteal', 'life steal',
    'spell vamp', 'omnivamp', 'penetration', 'lethality', 'cooldown', 'magic',
    'physical', 'true damage', 'area of effect', 'aoe', 'burst', 'dps', 'sustained',
    'scaling', 'range', 'bonus', 'stack', 'stacks', 'charge', 'charges'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  const keywords = [];
  
  // Check for important multi-word keywords
  for (const keyword of importantKeywords) {
    if (text.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  
  // Add single important words
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z0-9]/g, '');
    if (cleanWord.length > 3 && !keywords.includes(cleanWord)) {
      keywords.push(cleanWord);
    }
  }
  
  return keywords;
}

// Show loading indicator
function showLoading() {
  loadingIndicator.classList.remove('hidden');
}

// Hide loading indicator
function hideLoading() {
  loadingIndicator.classList.add('hidden');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Close all explanations when clicking outside
document.addEventListener('click', (e) => {
  // If not clicking on an explanation toggle or explanation itself
  if (!e.target.closest('.detailed-explanation') && !e.target.closest('.item-explanation-toggle')) {
    // Hide all explanations
    document.querySelectorAll('.detailed-explanation').forEach(el => {
      el.classList.add('hidden');
    });
    
    // Reset all toggle texts
    document.querySelectorAll('.item-explanation-toggle').forEach(toggle => {
      toggle.textContent = 'Why this item?';
    });
  }
});