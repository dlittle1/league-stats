/**
 * Utils Module - General utility functions used throughout the application
 */

/**
 * Clean ability description text by removing HTML tags
 * @param {string} description - Raw description text with HTML tags
 * @returns {string} - Cleaned description text
 */
function cleanDescription(description) {
    if (!description) return 'No description available';
    
    return description
      .replace(/<br>/g, ' ')
      .replace(/<[^>]*>/g, '');
  }
  
  /**
   * Check if a champion uses mana
   * @param {Object} champion - Champion data object
   * @returns {boolean} - Whether the champion uses mana
   */
  function championUsesMana(champion) {
    return champion && champion.partype && 
           champion.partype.toLowerCase().includes('mana');
  }
  
  /**
   * Check if a champion has healing abilities
   * @param {Object} champion - Champion data object
   * @returns {boolean} - Whether the champion has healing abilities
   */
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
  
  /**
   * Check if a champion has AoE (Area of Effect) abilities
   * @param {Object} champion - Champion data object
   * @returns {boolean} - Whether the champion has AoE abilities
   */
  function hasAoEAbilities(champion) {
    if (!champion) return false;
    
    const aoeKeywords = ['area', 'aoe', 'splash', 'enemies', 'around', 'radius'];
    
    // Check abilities
    if (champion.spells && Array.isArray(champion.spells)) {
      for (const spell of champion.spells) {
        if (spell && spell.description) {
          const spellDesc = spell.description.toLowerCase();
          if (aoeKeywords.some(keyword => spellDesc.includes(keyword))) {
            return true;
          }
        }
      }
    }
    
    // Known AoE champions
    const aoeChampions = ['brand', 'zyra', 'amumu', 'annie', 'diana', 'fiddlesticks',
                         'galio', 'gangplank', 'karthus', 'kennen', 'lissandra', 'malphite',
                         'maokai', 'neeko', 'orianna', 'rumble', 'seraphine', 'sona',
                         'syndra', 'ziggs', 'zyra'];
    return aoeChampions.includes(champion.id.toLowerCase());
  }
  
  /**
   * Extract meaningful keywords from text
   * @param {string} text - Text to extract keywords from
   * @returns {Array<string>} - Array of extracted keywords
   */
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
  
  /**
   * Get team composition display name
   * @param {string} teamComp - Team composition key
   * @returns {string} - Display name for team composition
   */
  function getTeamCompDisplayName(teamComp) {
    const teamCompDisplay = {
      'squishy': 'Squishy (0-1 tanks)',
      'tanky': 'Tanky (2+ tanks)',
      'cc-heavy': 'CC-Heavy',
      'balanced': 'Balanced'
    };
    
    return teamCompDisplay[teamComp] || 'Balanced';
  }
  
  /**
   * Format a percentage value
   * @param {number} value - Value to format (0-1)
   * @param {number} [decimals=1] - Number of decimal places
   * @returns {string} - Formatted percentage
   */
  function formatPercentage(value, decimals = 1) {
    return (Math.min(Math.max(value, 0), 1) * 100).toFixed(decimals);
  }
  
  /**
   * Get image URL for champion assets
   * @param {string} type - Type of image ('splash', 'icon', 'passive', 'spell')
   * @param {string} id - Asset ID or filename
   * @param {string} [version='14.6.1'] - Data Dragon version
   * @returns {string} - Image URL
   */
  function getImageUrl(type, id, version = '14.6.1') {
    const BASE_URL = 'https://ddragon.leagueoflegends.com/cdn';
    
    switch (type) {
      case 'splash':
        return `${BASE_URL}/img/champion/splash/${id}_0.jpg`;
      case 'icon':
        return `${BASE_URL}/${version}/img/champion/${id}`;
      case 'passive':
        return `${BASE_URL}/${version}/img/passive/${id}`;
      case 'spell':
        return `${BASE_URL}/${version}/img/spell/${id}`;
      case 'item':
        return `${BASE_URL}/${version}/img/item/${id}`;
      default:
        return `${BASE_URL}/img/champion/tiles/default.png`;
    }
  }
  
  /**
   * Create a fallback image handler
   * @param {HTMLImageElement} img - Image element
   * @param {string} fallbackSrc - Fallback image source
   */
  function setImageFallback(img, fallbackSrc) {
    if (!img) return;
    
    img.onerror = function() {
      this.src = fallbackSrc;
    };
  }
  
  // Export the utility functions
  export default {
    cleanDescription,
    championUsesMana,
    hasHealingAbility,
    hasAoEAbilities,
    extractKeywords,
    getTeamCompDisplayName,
    formatPercentage,
    getImageUrl,
    setImageFallback
  };