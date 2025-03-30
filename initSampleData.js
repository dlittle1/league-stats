/**
 * This script copies the sample champion data to the cache directory
 * Run this script with Node.js to ensure there's sample data available
 */

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, 'cache');
const SAMPLE_DATA_SRC = path.join(__dirname, 'src', 'public', 'sample_champions.json');
const SAMPLE_DATA_DEST = path.join(CACHE_DIR, 'sample_champions.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    console.log(`Created cache directory: ${CACHE_DIR}`);
  } catch (error) {
    console.error(`Error creating cache directory: ${error.message}`);
    process.exit(1);
  }
}

// Check if sample data exists in source
if (!fs.existsSync(SAMPLE_DATA_SRC)) {
  console.error(`Sample data not found at ${SAMPLE_DATA_SRC}`);
  console.log('Creating minimal sample data...');
  
  // Create minimal sample data with Lux
  const minimalData = {
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
    },
    "Yasuo": {
      "id": "Yasuo",
      "key": "157",
      "name": "Yasuo",
      "title": "the Unforgiven",
      "image": { "full": "Yasuo.png" },
      "tags": ["Fighter", "Assassin"],
      "spells": [
        { "name": "Steel Tempest", "description": "Yasuo thrusts his sword forward, damaging all enemies in a line.", "image": { "full": "YasuoQ.png" } },
        { "name": "Wind Wall", "description": "Yasuo creates a moving wall that blocks all enemy projectiles.", "image": { "full": "YasuoW.png" } },
        { "name": "Sweeping Blade", "description": "Yasuo dashes through an enemy, dealing damage and marking them.", "image": { "full": "YasuoE.png" } },
        { "name": "Last Breath", "description": "Yasuo blinks to an airborne enemy champion, dealing physical damage.", "image": { "full": "YasuoR.png" } }
      ],
      "passive": {
        "name": "Way of the Wanderer",
        "description": "Yasuo's Critical Strike Chance is doubled. Additionally, Yasuo builds up a shield when moving.",
        "image": { "full": "Yasuo_Passive.png" }
      },
      "version": "14.6.1"
    }
  };
  
  try {
    fs.writeFileSync(SAMPLE_DATA_DEST, JSON.stringify(minimalData, null, 2));
    console.log(`Created sample data at ${SAMPLE_DATA_DEST}`);
    
    // Also write to src directory to have it for future
    fs.writeFileSync(SAMPLE_DATA_SRC, JSON.stringify(minimalData, null, 2));
    console.log(`Created sample data at ${SAMPLE_DATA_SRC}`);
  } catch (writeError) {
    console.error(`Error writing sample data: ${writeError.message}`);
    process.exit(1);
  }
} else {
  // Copy sample data from source to destination
  try {
    fs.copyFileSync(SAMPLE_DATA_SRC, SAMPLE_DATA_DEST);
    console.log(`Copied sample data to ${SAMPLE_DATA_DEST}`);
  } catch (copyError) {
    console.error(`Error copying sample data: ${copyError.message}`);
    
    // Try to read and write instead
    try {
      const data = fs.readFileSync(SAMPLE_DATA_SRC, 'utf8');
      fs.writeFileSync(SAMPLE_DATA_DEST, data);
      console.log(`Read and wrote sample data to ${SAMPLE_DATA_DEST}`);
    } catch (rwError) {
      console.error(`Error reading/writing sample data: ${rwError.message}`);
      process.exit(1);
    }
  }
}

// Create empty champions.json if it doesn't exist
const CHAMPIONS_CACHE_PATH = path.join(CACHE_DIR, 'champions.json');
if (!fs.existsSync(CHAMPIONS_CACHE_PATH)) {
  try {
    // Copy from sample data if available
    if (fs.existsSync(SAMPLE_DATA_DEST)) {
      fs.copyFileSync(SAMPLE_DATA_DEST, CHAMPIONS_CACHE_PATH);
      console.log(`Copied sample data to ${CHAMPIONS_CACHE_PATH}`);
    } else {
      // Create empty champions cache
      fs.writeFileSync(CHAMPIONS_CACHE_PATH, '{}');
      console.log(`Created empty champions cache at ${CHAMPIONS_CACHE_PATH}`);
    }
  } catch (error) {
    console.error(`Error creating champions cache: ${error.message}`);
  }
}

console.log('Sample data initialization complete!');