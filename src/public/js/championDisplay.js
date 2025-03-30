/**
 * Champion Display Module - Handles displaying champion information
 */

// Global reference to the stats chart
let statsChart = null;

/**
 * Display champion information
 * @param {Object} data - Champion data from API
 * @param {Object} ui - UI utilities module
 * @param {Object} utils - Utils module
 */
function displayChampionInfo(data, ui, utils) {
  try {
    // Ensure we have valid data
    if (!data || !data.champion) {
      throw new Error('Invalid champion data');
    }
    
    console.log('Displaying champion info:', data.champion.id);
    
    const { champion, statPriorities, recommendedItems } = data;
    const version = champion.version || '14.6.1';
    
    // Update champion header
    updateChampionHeader(champion, ui, utils);
    
    // Update abilities
    updateChampionAbilities(champion, ui, utils);
    
    // Display stat priorities chart
    displayStatsPriorityChart(statPriorities, ui.elements.statsChart);
    
    // Display recommended items
    const { coreItems, bootsItems } = ui.elements;
    displayRecommendedItems(coreItems, recommendedItems?.core || [], champion, utils);
    displayRecommendedItems(bootsItems, recommendedItems?.boots || [], champion, utils);
    
    // Show champion info section
    ui.showChampionInfo();
  } catch (error) {
    console.error('Error in displayChampionInfo:', error);
    ui.showError(`Error displaying champion info: ${error.message}. Please try again.`);
  }
}

/**
 * Update champion header information
 * @param {Object} champion - Champion data
 * @param {Object} ui - UI utilities module
 * @param {Object} utils - Utils module
 */
function updateChampionHeader(champion, ui, utils) {
  try {
    const { championImage, championName, championTitle, championTags, currentTeamComp } = ui.elements;
    
    // Set champion image with error handler
    try {
      const imageSrc = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`;
      console.log(`Setting champion image: ${imageSrc}`);
      
      championImage.onerror = function() {
        const version = champion.version || '14.6.1';
        this.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image?.full || 'default.png'}`;
      };
      
      championImage.src = imageSrc;
    } catch (imgError) {
      console.error('Error setting champion image:', imgError);
      championImage.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/default.png';
    }
    
    // Set champion name and title
    championName.textContent = champion.name || 'Unknown Champion';
    championTitle.textContent = champion.title || '';
    
    // Update champion tags
    championTags.innerHTML = '';
    if (champion.tags && Array.isArray(champion.tags)) {
      champion.tags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'champion-tag';
        tagElement.textContent = tag;
        championTags.appendChild(tagElement);
      });
    }
    
    // Update team composition display
    if (currentTeamComp) {
      const teamCompSelect = document.getElementById('enemy-team-comp');
      const teamComp = teamCompSelect ? teamCompSelect.value : 'balanced';
      
      const teamCompDisplay = {
        'squishy': 'Squishy (0-1 tanks)',
        'tanky': 'Tanky (2+ tanks)',
        'cc-heavy': 'CC-Heavy',
        'balanced': 'Balanced'
      };
      
      currentTeamComp.textContent = teamCompDisplay[teamComp] || 'Balanced';
      
      // Add appropriate styling based on team composition
      currentTeamComp.className = '';
      currentTeamComp.classList.add(`team-${teamComp || 'balanced'}`);
    }
  } catch (error) {
    console.error('Error updating champion header:', error);
    throw error;
  }
}

/**
 * Update champion abilities
 * @param {Object} champion - Champion data
 * @param {Object} ui - UI utilities module
 * @param {Object} utils - Utils module
 */
function updateChampionAbilities(champion, ui, utils) {
  try {
    const version = champion.version || '14.6.1';
    
    // Update passive
    if (champion.passive && champion.passive.image) {
      try {
        const passiveIconSrc = `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/${champion.passive.image.full}`;
        ui.elements.passiveIcon.onerror = function() {
          this.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/default.png';
        };
        
        ui.elements.passiveIcon.src = passiveIconSrc;
        ui.elements.passiveName.textContent = champion.passive.name || 'Passive';
        ui.elements.passiveDescription.textContent = 
          utils.cleanDescription(champion.passive.description || 'No description available');
      } catch (passiveError) {
        console.error('Error updating passive:', passiveError);
        ui.elements.passiveIcon.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/default.png';
        ui.elements.passiveName.textContent = 'Passive';
        ui.elements.passiveDescription.textContent = 'No description available';
      }
    } else {
      console.warn('Missing passive data');
      ui.elements.passiveIcon.src = 'https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/default.png';
      ui.elements.passiveName.textContent = 'Passive';
      ui.elements.passiveDescription.textContent = 'No description available';
    }
    
    // Update abilities Q, W, E, R
    const abilities = [
      { key: 'q', elements: { icon: ui.elements.qIcon, name: ui.elements.qName, description: ui.elements.qDescription } },
      { key: 'w', elements: { icon: ui.elements.wIcon, name: ui.elements.wName, description: ui.elements.wDescription } },
      { key: 'e', elements: { icon: ui.elements.eIcon, name: ui.elements.eName, description: ui.elements.eDescription } },
      { key: 'r', elements: { icon: ui.elements.rIcon, name: ui.elements.rName, description: ui.elements.rDescription } }
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
            utils.cleanDescription(ability.description || 'No description available');
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
  } catch (error) {
    console.error('Error updating abilities:', error);
    throw error;
  }
}

/**
 * Display stats priority chart
 * @param {Object} statPriorities - Champion stat priorities
 * @param {HTMLCanvasElement} chartElement - Canvas element for the chart
 */
function displayStatsPriorityChart(statPriorities, chartElement) {
  try {
    // If Chart.js is not available, skip chart creation
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not available');
      return;
    }
    
    const ctx = chartElement ? chartElement.getContext('2d') : null;
    
    if (!ctx) {
      console.error('Could not get 2D context for stats chart');
      return;
    }
    
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
    
    // Create chart
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
      
      statsChart = new Chart(ctx, chartOptions);
      console.log('Chart created successfully');
    } catch (chartError) {
      console.error('Error creating chart:', chartError);
    }
  } catch (error) {
    console.error('Error in displayStatsPriorityChart:', error);
  }
}

/**
 * Display recommended items
 * @param {HTMLElement} container - Container element for items
 * @param {Array<Object>} items - Item recommendations
 * @param {Object} champion - Champion data
 * @param {Object} utils - Utils module
 */
function displayRecommendedItems(container, items, champion, utils) {
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
        const explanation = generateItemExplanation(item, champion, score, utils);
        
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
        const itemDescription = item.description ? utils.cleanDescription(item.description) : 'No description available';
        itemElement.addEventListener('mouseover', () => {
          itemElement.title = `${itemName}\n${itemDescription}`;
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
          });
        }
      } catch (itemError) {
        console.error('Error rendering item:', itemError);
      }
    });
    
    // Add global click handler to close explanations when clicking outside
    if (!window.explanationClickHandlerAdded) {
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
      window.explanationClickHandlerAdded = true;
    }
  } catch (error) {
    console.error(`Error displaying items:`, error);
    container.innerHTML = '<p>Error displaying recommendations</p>';
  }
}

/**
 * Generate explanation for why an item is recommended for a champion
 * @param {Object} item - Item data
 * @param {Object} champion - Champion data
 * @param {number} score - Recommendation score
 * @param {Object} utils - Utils module
 * @returns {string} - HTML explanation
 */
function generateItemExplanation(item, champion, score, utils) {
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
    const cleanItemDesc = utils.cleanDescription(itemDesc).toLowerCase();
    const championId = champion.id.toLowerCase();
    
    // Extract champion ability keywords
    const abilityKeywords = [];
    if (champion.passive && champion.passive.description) {
      const passiveDesc = utils.cleanDescription(champion.passive.description).toLowerCase();
      abilityKeywords.push({
        name: champion.passive.name || 'Passive',
        desc: passiveDesc,
        keywords: utils.extractKeywords(passiveDesc)
      });
    }
    
    if (champion.spells && Array.isArray(champion.spells)) {
      for (let i = 0; i < Math.min(champion.spells.length, 4); i++) {
        const spell = champion.spells[i];
        if (spell && spell.description) {
          const spellDesc = utils.cleanDescription(spell.description).toLowerCase();
          const spellKey = ['Q', 'W', 'E', 'R'][i];
          abilityKeywords.push({
            name: `${spellKey}: ${spell.name || ''}`,
            desc: spellDesc,
            keywords: utils.extractKeywords(spellDesc)
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
    
    if (utils.hasHealingAbility(champion) && hasLifesteal) {
      explanation += `<li><strong>Healing Amplification:</strong> Enhances ${championName}'s natural healing abilities, creating exceptional sustain in fights</li>`;
      synergiesAdded++;
    }
    
    // Check for ability synergies
    for (const ability of abilityKeywords) {
      const itemKeywords = utils.extractKeywords(cleanItemDesc);
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
    
    // More synergies based on team comp (abbreviated for space)
    if (teamComp === 'squishy' && 
        (itemName.toLowerCase().includes('ludens') || 
         itemName.toLowerCase().includes('night harvester'))) {
      explanation += `<li><strong>Effective vs. ${teamCompText[teamComp]}:</strong> Provides burst damage to quickly eliminate low-health targets</li>`;
      synergiesAdded++;
    }
    
    // Add stat-based explanations if we haven't found enough synergies
    if (synergiesAdded < 2) {
      if (hasMana && utils.championUsesMana(champion)) {
        explanation += `<li>Provides mana which ${championName} needs for ability rotations</li>`;
        synergiesAdded++;
      }
      
      if (hasAP && (champion.tags?.includes('Mage') || champion.tags?.includes('Support'))) {
        explanation += `<li>Provides ability power which enhances ${championName}'s magical abilities</li>`;
        synergiesAdded++;
      }
      
      // Add more stat explanations as needed
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

// Export the champion display functions
export default {
  displayChampionInfo,
  displayStatsPriorityChart,
  displayRecommendedItems
};