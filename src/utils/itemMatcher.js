const { fetchChampionData, fetchItemData } = require('../api/riotApi');

// Keywords that indicate certain champion characteristics
const KEYWORD_MAPPING = {
  // AP focused keywords
  AP: [
    'ability power', 'ap', 'magic damage', 'magical damage', 'spell', 'cast',
    'scaling', 'mage', 'burst', 'arcane', 'mana', 'magic'
  ],
  
  // AD focused keywords
  AD: [
    'attack damage', 'ad', 'physical damage', 'auto attack', 'autoattack',
    'basic attack', 'marksman', 'crit', 'critical'
  ],
  
  // Tank focused keywords
  TANK: [
    'health', 'armor', 'magic resist', 'magic resistance', 'shield', 'resist',
    'defensive', 'protection', 'damage reduction', 'defense', 'guard', 'block',
    'tough', 'tank', 'durable'
  ],
  
  // Attack speed focused keywords
  ATTACK_SPEED: [
    'attack speed', 'faster', 'rapid', 'quick', 'swift'
  ],
  
  // Movement focused keywords
  MOVEMENT: [
    'movement speed', 'move speed', 'mobility', 'dash', 'blink', 'teleport',
    'leap', 'jump', 'rush', 'charge', 'speed'
  ],
  
  // Healing focused keywords
  HEALING: [
    'heal', 'healing', 'lifesteal', 'regeneration', 'regen', 'life steal',
    'sustain', 'drain', 'recovery'
  ],
  
  // Ability haste keywords
  ABILITY_HASTE: [
    'cooldown', 'reduction', 'cdr', 'haste', 'ability haste', 'fast'
  ],
  
  // CC keywords
  CROWD_CONTROL: [
    'stun', 'slow', 'root', 'fear', 'charm', 'taunt', 'knockup', 'knock up',
    'knock back', 'knockback', 'pull', 'suppress', 'airborne', 'immobilize',
    'crowd control', 'cc'
  ]
};

// Map stat categories to item properties to look for
const STAT_TO_ITEM_PROPERTIES = {
  AP: ['ap', 'magicPenetration', 'mana', 'manaRegen'],
  AD: ['ad', 'armorPenetration', 'critChance', 'critDamage'],
  TANK: ['health', 'armor', 'magicResist', 'tenacity'],
  ATTACK_SPEED: ['attackSpeed'],
  MOVEMENT: ['moveSpeed'],
  HEALING: ['omnivamp', 'physicalVamp', 'spellVamp', 'lifeSteal', 'healthRegen'],
  ABILITY_HASTE: ['abilityHaste'],
  CROWD_CONTROL: ['slow', 'stun']
};

/**
 * Calculate special synergies between champion and item
 */
function calculateSpecialSynergies(champion, item, itemDescription) {
  if (!champion || !item) return 0;
  
  let synergy = 0;
  const championId = champion.id.toLowerCase();
  const itemName = item.name ? item.name.toLowerCase() : '';
  
  // Check for healing synergies
  const hasHealingInKit = hasHealingAbility(champion);
  const itemHasHealing = itemDescription.includes('heal') || 
                        itemDescription.includes('omnivamp') || 
                        itemDescription.includes('vamp') || 
                        itemDescription.includes('lifesteal') || 
                        itemDescription.includes('regen') ||
                        itemName.includes('sunderer');
  
  if (hasHealingInKit && itemHasHealing) {
    synergy += 2.0; // Strong bonus for healing synergy
  }
  
  // Check for ability haste synergies with spell-spamming champions
  const isSpellSpammer = championId === 'ryze' || championId === 'cassiopeia' || 
                         championId === 'sylas' || championId === 'ezreal' ||
                         championId === 'lux' || championId === 'ziggs';
  const itemHasAbilityHaste = itemDescription.includes('ability haste') || 
                             itemDescription.includes('cooldown');
  
  if (isSpellSpammer && itemHasAbilityHaste) {
    synergy += 1.5;
  }
  
  // Specific champion-item synergies
  if (championId === 'sylas') {
    // Sylas specifically synergizes with AP bruiser items with healing
    if ((itemName.includes('sunderer') || itemName.includes('riftmaker')) && itemHasHealing) {
      synergy += 3.0;
    }
    
    // Sylas likes Everfrost for the extra CC
    if (itemName.includes('everfrost')) {
      synergy += 2.0;
    }
    
    // Sylas also likes Zhonya's for the survivability
    if (itemName.includes('zhonya')) {
      synergy += 1.5;
    }
  }
  
  if (championId === 'katarina' || championId === 'akali') {
    // These champions synergize well with Hextech items
    if (itemName.includes('hextech') || itemName.includes('riftmaker')) {
      synergy += 2.0;
    }
    
    // They also work well with Nashor's Tooth due to hybrid scaling
    if (itemName.includes('nashor')) {
      synergy += 2.5;
    }
  }
  
  if (championId === 'ezreal' || championId === 'gangplank') {
    // These champions can utilize Sheen items extremely well
    if (itemDescription.includes('sheen') || 
        itemName.includes('trinity') || 
        itemName.includes('essence reaver') ||
        itemName.includes('sunderer')) {
      synergy += 3.0;
    }
  }
  
  if (championId === 'vayne' || championId === 'kogmaw' || championId === 'varus') {
    // These champions synergize well with on-hit effects
    if (itemDescription.includes('on-hit') || 
        itemName.includes('rageblade') || 
        itemName.includes('wit\'s end') ||
        itemName.includes('blade of the ruined king')) {
      synergy += 2.5;
    }
  }
  
  // AD champions who can use Lethality well
  const lethUsers = ['zed', 'talon', 'khazix', 'rengar', 'pyke', 'qiyana'];
  if (lethUsers.includes(championId) && 
      (itemDescription.includes('lethality') || itemName.includes('duskblade') || itemName.includes('eclipse'))) {
    synergy += 2.0;
  }
  
  // Check ability type synergies
  const hasAoE = hasAoEAbilities(champion);
  if (hasAoE && (itemName.includes('liandry') || itemName.includes('demonic'))) {
    synergy += 1.5; // AoE champions synergize well with burn items
  }
  
  // Check for mana-hungry champions
  const isManaHungry = championId === 'cassiopeia' || championId === 'ryze' || 
                      championId === 'anivia' || championId === 'kassadin';
  if (isManaHungry && (itemDescription.includes('mana') || itemName.includes('seraph'))) {
    synergy += 2.0;
  }
  
  // Check for attack speed scaling
  const scalesWithAS = championId === 'kayle' || championId === 'kogmaw' || 
                      championId === 'vayne' || championId === 'varus' ||
                      championId === 'jinx' || championId === 'twitch';
  if (scalesWithAS && itemDescription.includes('attack speed')) {
    synergy += 2.0;
  }
  
  return synergy;
}

/**
 * Check if champion has healing abilities
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
 * Check if champion has AoE abilities
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
function teamCompModifier(champion, item, itemDescription, teamComp) {
  if (!champion || !item || !teamComp) return 0;
  
  let modifier = 0;
  const itemName = item.name ? item.name.toLowerCase() : '';
  const championId = champion.id.toLowerCase();
  
  // Team composition adjustments
  switch (teamComp) {
    case 'squishy':
      // Against squishy teams, prioritize burst damage
      if (itemDescription.includes('burst') || 
          itemName.includes('nightharvest') || 
          itemName.includes('ludens') || 
          itemName.includes('lichbane') || 
          itemName.includes('shadowflame') ||
          itemName.includes('collector') ||
          itemName.includes('infinity')) {
        modifier += 2.0;
      }
      
      // Prioritize lethality/magic penetration for assassins and burst mages
      if ((itemDescription.includes('lethality') || 
           itemDescription.includes('armor penetration') ||
           itemDescription.includes('magic penetration')) && 
          (champion.tags.includes('Assassin') || champion.tags.includes('Mage'))) {
        modifier += 2.5;
      }
      
      // De-prioritize tank items against squishy teams
      if (itemDescription.includes('armor') || 
          itemDescription.includes('magic resist') || 
          itemDescription.includes('health') && 
          itemName.includes('warmog')) {
        modifier -= 1.0;
      }
      break;
      
    case 'tanky':
      // Against tanky teams, prioritize sustained damage and tank shredding
      if (itemDescription.includes('max health') || 
          itemDescription.includes('current health') ||
          itemName.includes('sunderer') || 
          itemName.includes('liandry') || 
          itemName.includes('demonic') || 
          itemName.includes('blade of the ruined') ||
          itemName.includes('void staff') ||
          itemName.includes('lord dominik')) {
        modifier += 3.0;
      }
      
      // Prioritize sustain for extended fights
      if (itemDescription.includes('heal') || 
          itemDescription.includes('lifesteal') || 
          itemDescription.includes('omnivamp') ||
          itemDescription.includes('vamp')) {
        modifier += 2.0;
      }
      
      // Prioritize armor/magic penetration
      if (itemDescription.includes('armor penetration') || 
          itemDescription.includes('magic penetration')) {
        modifier += 2.0;
      }
      
      // De-prioritize pure burst items against tanky teams
      if (itemName.includes('lichbane') || 
          itemName.includes('ludens') ||
          itemName.includes('collector')) {
        modifier -= 1.0;
      }
      break;
      
    case 'cc-heavy':
      // Against CC-heavy teams, prioritize tenacity and cleanses
      if (itemDescription.includes('tenacity') || 
          itemDescription.includes('cleanse') || 
          itemDescription.includes('slow reduction') ||
          itemName.includes('mercurial') || 
          itemName.includes('quicksilver') ||
          itemName.includes('banshee') ||
          itemName.includes('edge of night')) {
        modifier += 3.5;
      }
      
      // Prioritize health and defensive stats
      if (itemDescription.includes('health') || 
          itemDescription.includes('armor') || 
          itemDescription.includes('magic resist')) {
        modifier += 1.0;
      }
      
      // For certain champions, prioritize gap closers/mobility
      if ((champion.tags.includes('Assassin') || 
           championId === 'darius' || 
           championId === 'garen' || 
           championId === 'udyr') && 
          (itemDescription.includes('movement speed') || 
           itemName.includes('force') || 
           itemName.includes('youmuu'))) {
        modifier += 2.0;
      }
      break;
      
    default: // 'balanced'
      // For balanced teams, no specific modifiers
      break;
  }
  
  // Champion-specific team composition adjustments
  if (championId === 'sylas') {
    if (teamComp === 'squishy') {
      // Sylas wants burst against squishy teams
      if (itemName.includes('ludens') || 
          itemName.includes('lichbane') || 
          itemName.includes('shadowflame')) {
        modifier += 2.5;
      }
    } else if (teamComp === 'tanky') {
      // Sylas wants sustain against tank teams
      if (itemName.includes('sunderer') || 
          itemName.includes('riftmaker') ||
          itemName.includes('conqueror')) {
        modifier += 2.5;
      }
    }
  }
  
  if (championId === 'kaisa' || championId === 'vayne') {
    if (teamComp === 'tanky') {
      // These champions want on-hit effects against tanks
      if (itemName.includes('rageblade') || 
          itemName.includes('blade of the ruined') ||
          itemName.includes('wit\'s end')) {
        modifier += 2.0;
      }
    }
  }
  
  return modifier;
}
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
async function analyzeChampionAbilities(championId) {
  try {
    console.log(`Starting analysis for champion: ${championId}`);
    
    // Fetch champion and item data
    console.log('Fetching champion data...');
    const champions = await fetchChampionData();
    
    console.log('Fetching item data...');
    const items = await fetchItemData();
    
    console.log(`Data loaded: ${Object.keys(champions).length} champions, ${Object.keys(items).length} items`);
    
    // Find the champion by ID or key
    let champion = null;
    let foundChampion = false;
    
    console.log(`Looking for champion with ID: ${championId}`);
    
    // Try different ways of matching the champion
    for (const key in champions) {
      const champ = champions[key];
      
      // Try matching by id, key, or name (case insensitive)
      if (champ.id === championId || 
          champ.key === championId || 
          key.toLowerCase() === championId.toLowerCase() ||
          champ.name.toLowerCase() === championId.toLowerCase()) {
        champion = champ;
        foundChampion = true;
        console.log(`Found champion: ${champ.name} (${champ.id})`);
        break;
      }
    }
    
    // If still not found, try partial name matching
    if (!foundChampion) {
      console.log('Champion not found by exact match, trying partial match...');
      const lowerSearchId = championId.toLowerCase();
      
      for (const key in champions) {
        const champ = champions[key];
        
        if (champ.name.toLowerCase().includes(lowerSearchId)) {
          champion = champ;
          foundChampion = true;
          console.log(`Found champion by partial match: ${champ.name} (${champ.id})`);
          break;
        }
      }
    }
    
    if (!champion) {
      console.error(`Champion not found: ${championId}`);
      throw new Error(`Champion not found: ${championId}`);
    }
    
    // Analyze passive and abilities - with fallback handling for missing data
    const abilityTexts = [];
    
    // Add passive if available
    if (champion.passive && champion.passive.description) {
      abilityTexts.push(champion.passive.description);
    }
    
    // Add spells if available
    if (champion.spells && Array.isArray(champion.spells)) {
      for (let i = 0; i < Math.min(champion.spells.length, 4); i++) {
        if (champion.spells[i] && champion.spells[i].description) {
          abilityTexts.push(champion.spells[i].description);
        }
      }
    }
    
    // If no ability texts were found, add some dummy text
    if (abilityTexts.length === 0) {
      console.log('No ability descriptions found, using fallback text');
      abilityTexts.push('This champion has abilities that deal damage and may have utility effects.');
    }
    
    // Count occurrences of keywords in abilities
    const statScores = {
      AP: 0,
      AD: 0,
      TANK: 0,
      ATTACK_SPEED: 0,
      MOVEMENT: 0,
      HEALING: 0,
      ABILITY_HASTE: 0,
      CROWD_CONTROL: 0
    };
    
    // Analyze each ability and passive
    for (const text of abilityTexts) {
      const lowerText = text.toLowerCase();
      
      // Check for each keyword category
      for (const [category, keywords] of Object.entries(KEYWORD_MAPPING)) {
        for (const keyword of keywords) {
          if (lowerText.includes(keyword)) {
            statScores[category] += 1;
          }
        }
      }
    }
    
    // Additional analysis based on champion tags and stats
    if (champion.tags.includes('Mage')) statScores.AP += 2;
    if (champion.tags.includes('Marksman')) statScores.AD += 2;
    if (champion.tags.includes('Tank')) statScores.TANK += 2;
    if (champion.tags.includes('Fighter')) {
      statScores.AD += 1;
      statScores.TANK += 1;
    }
    if (champion.tags.includes('Assassin')) {
      statScores.AD += 1.5;
      statScores.MOVEMENT += 1.5;
    }
    if (champion.tags.includes('Support')) {
      statScores.CROWD_CONTROL += 1.5;
      statScores.ABILITY_HASTE += 1;
    }
    
    // Normalize scores
    const maxScore = Math.max(...Object.values(statScores));
    const normalizedScores = {};
    for (const [stat, score] of Object.entries(statScores)) {
      normalizedScores[stat] = maxScore > 0 ? score / maxScore : 0;
    }
    
    // Get item recommendations based on normalized scores
    const recommendations = getItemRecommendations(normalizedScores, items);
    
    return {
      champion,
      statPriorities: normalizedScores,
      recommendedItems: recommendations
    };
  } catch (error) {
    console.error('Error analyzing champion abilities:', error);
    throw error;
  }
}

/**
 * Recommend items based on stat priorities
 */
function getItemRecommendations(statPriorities, items) {
  const itemScores = {};
  
  // Score each item based on stat priorities
  for (const [itemId, item] of Object.entries(items)) {
    // Skip non-purchasable items, consumables, and trinkets
    if (
      !item.gold || 
      !item.gold.purchasable || 
      item.gold.total < 300 || // Skip cheap components
      item.tags.includes('Consumable') ||
      item.tags.includes('Trinket') ||
      item.maps['11'] !== true // Only Summoner's Rift items
    ) {
      continue;
    }
    
    // Calculate item score based on stat priorities
    let score = 0;
    const itemDescription = (item.description || '').toLowerCase();
    
    // Check for stat keywords in item description
    for (const [statCategory, priority] of Object.entries(statPriorities)) {
      const keywords = KEYWORD_MAPPING[statCategory] || [];
      
      for (const keyword of keywords) {
        if (itemDescription.includes(keyword)) {
          score += priority * 0.5; // Half weight for description matches
        }
      }
      
      // Check for stats directly
      const itemProperties = STAT_TO_ITEM_PROPERTIES[statCategory] || [];
      for (const prop of itemProperties) {
        if (item.stats && item.stats[prop] > 0) {
          score += priority;
        }
      }
      
      // Check item tags
      if (statCategory === 'AP' && item.tags.includes('SpellDamage')) {
        score += priority * 1.5;
      }
      if (statCategory === 'AD' && item.tags.includes('Damage')) {
        score += priority * 1.5;
      }
      if (statCategory === 'TANK' && (item.tags.includes('Health') || item.tags.includes('Armor') || item.tags.includes('SpellBlock'))) {
        score += priority * 1.5;
      }
      if (statCategory === 'ATTACK_SPEED' && item.tags.includes('AttackSpeed')) {
        score += priority * 1.5;
      }
      if (statCategory === 'MOVEMENT' && item.tags.includes('Boots')) {
        score += priority * 1.5;
      }
      if (statCategory === 'ABILITY_HASTE' && item.tags.includes('CooldownReduction')) {
        score += priority * 1.5;
      }
    }
    
    itemScores[itemId] = {
      item,
      score
    };
  }
  
  // Sort items by score and pick top ones for different roles
  const sortedItems = Object.values(itemScores)
    .sort((a, b) => b.score - a.score);
  
  // Get recommendations for different item categories
  const coreItems = sortedItems
    .filter(item => !item.item.tags || !item.item.tags.includes('Boots'))
    .slice(0, 10);
  
  const boots = sortedItems
    .filter(item => item.item.tags && item.item.tags.includes('Boots'))
    .slice(0, 3);
  
  return {
    core: coreItems,
    boots: boots
  };
}

module.exports = {
  analyzeChampionAbilities
};