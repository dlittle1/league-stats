require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { fetchChampionData } = require('./api/riotApi');
const { analyzeChampionAbilities } = require('./utils/itemMatcher');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/api/champions', async (req, res) => {
  try {
    console.log('API request received for champion data');
    const champions = await fetchChampionData();
    console.log(`Returning data for ${Object.keys(champions).length} champions`);
    res.json(champions);
  } catch (error) {
    console.error('Error fetching champions:', error);
    res.status(500).json({ error: 'Failed to fetch champion data', details: error.message });
  }
});

app.get('/api/recommendations/:championId', async (req, res) => {
  try {
    const { championId } = req.params;
    const { teamComp } = req.query; // Get teamComp from query parameters
    
    console.log(`Analyzing champion abilities for: ${championId}, Team Composition: ${teamComp || 'balanced'}`);
    
    // Check if championId is valid
    if (!championId || championId.trim() === '') {
      return res.status(400).json({ error: 'Invalid champion ID provided' });
    }
    
    const recommendations = await analyzeChampionAbilities(championId, teamComp);
    
    // Validate recommendations before sending
    if (!recommendations || !recommendations.champion) {
      return res.status(404).json({ error: 'Champion not found or analysis failed' });
    }
    
    console.log(`Successfully analyzed ${recommendations.champion.name}`);
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add a test endpoint for champion lookup
app.get('/api/test/champion/:championId', async (req, res) => {
  try {
    const { championId } = req.params;
    console.log(`Test looking up champion: ${championId}`);
    
    const champions = await fetchChampionData();
    console.log(`Loaded ${Object.keys(champions).length} champions`);
    
    // Try to find the champion
    let foundChampion = null;
    
    for (const key in champions) {
      const champ = champions[key];
      if (
        champ.id === championId || 
        champ.key === championId || 
        key.toLowerCase() === championId.toLowerCase() ||
        champ.name.toLowerCase() === championId.toLowerCase()
      ) {
        foundChampion = champ;
        break;
      }
    }
    
    if (!foundChampion) {
      // Try partial match
      const lowerSearchId = championId.toLowerCase();
      for (const key in champions) {
        const champ = champions[key];
        if (champ.name.toLowerCase().includes(lowerSearchId)) {
          foundChampion = champ;
          break;
        }
      }
    }
    
    if (foundChampion) {
      res.json({
        success: true,
        champion: {
          id: foundChampion.id,
          key: foundChampion.key,
          name: foundChampion.name,
          title: foundChampion.title
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Champion not found: ${championId}`,
        availableChampions: Object.values(champions).map(c => c.name).slice(0, 10) // List first 10 champions
      });
    }
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});