const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Base URLs for Riot Data Dragon API
const DATA_DRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com';
const LATEST_VERSION_URL = `${DATA_DRAGON_BASE_URL}/api/versions.json`;

// Cache file paths
const CACHE_DIR = path.join(__dirname, '../../cache');
const CHAMPION_CACHE_PATH = path.join(CACHE_DIR, 'champions.json');
const ITEM_CACHE_PATH = path.join(CACHE_DIR, 'items.json');
const SAMPLE_CHAMPION_PATH = path.join(CACHE_DIR, 'sample_champions.json');

// Sample fallback item data
const SAMPLE_ITEMS = {
  "3153": {
    "name": "Blade of the Ruined King",
    "description": "Deals physical damage on hit, can steal movement speed, and has an active effect that deals damage and slows the target.",
    "gold": { "base": 825, "total": 3200, "sell": 2240, "purchasable": true },
    "tags": ["Damage", "AttackSpeed", "LifeSteal", "Slow", "OnHit", "Active"],
    "stats": { "FlatPhysicalDamageMod": 40, "PercentAttackSpeedMod": 0.25, "PercentLifeStealMod": 0.1 },
    "effect": { "Effect1Amount": "0.08", "Effect2Amount": "0.08", "Effect3Amount": "0.08" },
    "depth": 3,
    "maps": { "11": true, "12": true, "21": true, "22": false },
    "image": { "full": "3153.png", "sprite": "item1.png", "group": "item", "x": 144, "y": 192, "w": 48, "h": 48 }
  },
  "3508": {
    "name": "Essence Reaver",
    "description": "Deals bonus damage on hit and restores mana based on that damage.",
    "gold": { "base": 1050, "total": 2800, "sell": 1960, "purchasable": true },
    "tags": ["Damage", "CriticalStrike", "ManaRegen", "CooldownReduction"],
    "stats": { "FlatPhysicalDamageMod": 60, "FlatCritChanceMod": 0.20, "PercentCooldownMod": 0.20 },
    "depth": 3,
    "maps": { "11": true, "12": true, "21": true, "22": false },
    "image": { "full": "3508.png", "sprite": "item1.png", "group": "item", "x": 336, "y": 336, "w": 48, "h": 48 }
  },
  "3124": {
    "name": "Guinsoo's Rageblade",
    "description": "Gain stacking attack speed. Every third attack triggers a phantom hit that applies on-hit effects multiple times.",
    "gold": { "base": 1050, "total": 3000, "sell": 2100, "purchasable": true },
    "tags": ["Damage", "AttackSpeed", "OnHit"],
    "stats": { "FlatPhysicalDamageMod": 30, "FlatMagicDamageMod": 30, "PercentAttackSpeedMod": 0.25 },
    "effect": { "Effect1Amount": "8", "Effect2Amount": "2.5", "Effect3Amount": "0.1" },
    "depth": 3,
    "maps": { "11": true, "12": true, "21": true, "22": false },
    "image": { "full": "3124.png", "sprite": "item1.png", "group": "item", "x": 96, "y": 144, "w": 48, "h": 48 }
  },
  "3100": {
    "name": "Lich Bane",
    "description": "Grants a bonus to your next attack after casting a spell.",
    "gold": { "base": 1050, "total": 3000, "sell": 2100, "purchasable": true },
    "tags": ["SpellDamage", "Mana", "CooldownReduction", "OnHit"],
    "stats": { "FlatMPPoolMod": 250, "FlatMagicDamageMod": 80, "PercentMovementSpeedMod": 0.07, "PercentCooldownMod": 0.10 },
    "effect": { "Effect1Amount": "0.75", "Effect2Amount": "0.5" },
    "depth": 3,
    "maps": { "11": true, "12": true, "21": true, "22": false },
    "image": { "full": "3100.png", "sprite": "item1.png", "group": "item", "x": 0, "y": 144, "w": 48, "h": 48 }
  }
};

// Ensure cache directory exists
function ensureCacheDirectory() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log(`Created cache directory: ${CACHE_DIR}`);
    }
    return true;
  } catch (error) {
    console.error(`Failed to create cache directory: ${error.message}`);
    return false;
  }
}

/**
 * Get the latest game version
 */
async function getLatestGameVersion() {
  try {
    console.log('Fetching latest game version...');
    const response = await axios.get(LATEST_VERSION_URL, { timeout: 10000 });
    const version = response.data[0]; // First version is the latest
    console.log(`Latest game version: ${version}`);
    return version;
  } catch (error) {
    console.error(`Error fetching latest game version: ${error.message}`);
    // Use a fallback version if the request fails
    const fallbackVersion = '14.6.1';
    console.log(`Using fallback version: ${fallbackVersion}`);
    return fallbackVersion;
  }
}

/**
 * Fetch champion data from Riot API or cache
 */
async function fetchChampionData() {
  try {
    console.log('Fetching champion data...');
    
    // Ensure cache directory exists
    ensureCacheDirectory();
    
    // Check if cached data exists and is recent (less than 1 day old)
    if (fs.existsSync(CHAMPION_CACHE_PATH)) {
      const stats = fs.statSync(CHAMPION_CACHE_PATH);
      const cacheAge = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60); // in hours
      
      if (cacheAge < 24) {
        console.log(`Using cached champion data (${cacheAge.toFixed(2)} hours old)`);
        const cachedData = JSON.parse(fs.readFileSync(CHAMPION_CACHE_PATH, 'utf8'));
        return cachedData;
      } else {
        console.log(`Cache is too old (${cacheAge.toFixed(2)} hours), fetching fresh data`);
      }
    } else {
      console.log('No champion cache found, fetching fresh data');
    }

    // Get latest game version
    const version = await getLatestGameVersion();
    console.log(`Using game version: ${version}`);
    
    // Fetch champion data with timeout
    const response = await axios.get(
      `${DATA_DRAGON_BASE_URL}/cdn/${version}/data/en_US/champion.json`,
      { timeout: 10000 } // 10 second timeout
    );
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format from Riot API');
    }
    
    const champions = response.data.data;
    console.log(`Fetched ${Object.keys(champions).length} champions`);
    
    // For development/testing, we can limit the number of champions to process
    const championsToFetch = process.env.NODE_ENV === 'production' 
      ? Object.keys(champions)
      : Object.keys(champions).slice(0, 10); // Only fetch 10 champions in non-production
    
    console.log(`Fetching detailed data for ${championsToFetch.length} champions`);
    
    // Fetch detailed data for each champion
    const detailedChampions = {};
    for (const champKey of championsToFetch) {
      try {
        console.log(`Fetching detailed data for ${champKey}...`);
        const detailResponse = await axios.get(
          `${DATA_DRAGON_BASE_URL}/cdn/${version}/data/en_US/champion/${champKey}.json`,
          { timeout: 5000 } // 5 second timeout per champion
        );
        
        if (detailResponse.data && detailResponse.data.data && detailResponse.data.data[champKey]) {
          detailedChampions[champKey] = detailResponse.data.data[champKey];
        } else {
          console.warn(`Invalid or missing data for champion ${champKey}`);
          detailedChampions[champKey] = champions[champKey]; // Use basic data as fallback
        }
      } catch (error) {
        console.error(`Error fetching details for ${champKey}: ${error.message}`);
        // Use basic champion data if detailed fetch fails
        detailedChampions[champKey] = champions[champKey];
      }
    }
    
    // Cache the data
    try {
      console.log('Caching champion data...');
      fs.writeFileSync(CHAMPION_CACHE_PATH, JSON.stringify(detailedChampions, null, 2));
      console.log('Champion data cached successfully');
    } catch (cacheError) {
      console.error(`Error caching champion data: ${cacheError.message}`);
    }
    
    return detailedChampions;
  } catch (error) {
    console.error(`Error fetching champion data: ${error.message}`);
    
    // If cache exists, return that even if it's old
    if (fs.existsSync(CHAMPION_CACHE_PATH)) {
      console.log('Returning existing cached champion data due to error');
      try {
        return JSON.parse(fs.readFileSync(CHAMPION_CACHE_PATH, 'utf8'));
      } catch (readError) {
        console.error(`Error reading champion cache: ${readError.message}`);
      }
    }
    
    // If no cache exists, use sample data
    if (fs.existsSync(SAMPLE_CHAMPION_PATH)) {
      console.log('Using sample champion data as fallback');
      try {
        return JSON.parse(fs.readFileSync(SAMPLE_CHAMPION_PATH, 'utf8'));
      } catch (readError) {
        console.error(`Error reading sample champion data: ${readError.message}`);
      }
    }
    
    // Last resort - return minimal sample data
    console.log('Using hardcoded minimal sample data as last resort');
    return {
      "Lux": {
        "id": "Lux",
        "key": "99",
        "name": "Lux",
        "title": "the Lady of Luminosity",
        "image": { "full": "Lux.png" },
        "tags": ["Mage", "Support"],
        "spells": [
          { "name": "Light Binding", "description": "Lux releases a sphere of light that binds and deals damage.", "image": { "full": "LuxLightBinding.png" } },
          { "name": "Prismatic Barrier", "description": "Lux throws her wand and bends light around allies, shielding them.", "image": { "full": "LuxPrismaticWave.png" } },
          { "name": "Lucent Singularity", "description": "Lux sends an irregular light sphere that slows and damages enemies.", "image": { "full": "LuxLucentSingularity.png" } },
          { "name": "Final Spark", "description": "Lux fires a giant laser that damages all enemies in the area.", "image": { "full": "LuxMaliceCannon.png" } }
        ],
        "passive": {
          "name": "Illumination",
          "description": "Lux's spells mark enemies with light energy that her attacks detonate for bonus damage.",
          "image": { "full": "Lux_Passive.png" }
        },
        "version": "14.6.1"
      }
    };
  }
}

/**
 * Fetch item data from Riot API or cache
 */
async function fetchItemData() {
  try {
    console.log('Fetching item data...');
    
    // Ensure cache directory exists
    ensureCacheDirectory();
    
    // Check if cached data exists and is recent
    if (fs.existsSync(ITEM_CACHE_PATH)) {
      const stats = fs.statSync(ITEM_CACHE_PATH);
      const cacheAge = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60); // in hours
      
      if (cacheAge < 24) {
        console.log(`Using cached item data (${cacheAge.toFixed(2)} hours old)`);
        const cachedData = JSON.parse(fs.readFileSync(ITEM_CACHE_PATH, 'utf8'));
        return cachedData;
      } else {
        console.log(`Item cache is too old (${cacheAge.toFixed(2)} hours), fetching fresh data`);
      }
    } else {
      console.log('No item cache found, fetching fresh data');
    }

    // Get latest game version
    const version = await getLatestGameVersion();
    console.log(`Using game version for items: ${version}`);
    
    // Fetch item data with timeout
    const response = await axios.get(
      `${DATA_DRAGON_BASE_URL}/cdn/${version}/data/en_US/item.json`,
      { timeout: 10000 } // 10 second timeout
    );
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format from Riot API for items');
    }
    
    const items = response.data.data;
    console.log(`Fetched ${Object.keys(items).length} items`);
    
    // Cache the data
    try {
      console.log('Caching item data...');
      fs.writeFileSync(ITEM_CACHE_PATH, JSON.stringify(items, null, 2));
      console.log('Item data cached successfully');
    } catch (cacheError) {
      console.error(`Error caching item data: ${cacheError.message}`);
    }
    
    return items;
  } catch (error) {
    console.error(`Error fetching item data: ${error.message}`);
    
    // If cache exists, return that even if it's old
    if (fs.existsSync(ITEM_CACHE_PATH)) {
      console.log('Returning existing cached item data due to error');
      try {
        return JSON.parse(fs.readFileSync(ITEM_CACHE_PATH, 'utf8'));
      } catch (readError) {
        console.error(`Error reading item cache: ${readError.message}`);
      }
    }
    
    // Last resort - return sample items
    console.log('Using sample item data as last resort');
    return SAMPLE_ITEMS;
  }
}

module.exports = {
  fetchChampionData,
  fetchItemData,
  getLatestGameVersion
};