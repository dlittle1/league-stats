/**
 * API Module - Handles all API communication with the server
 */

// API endpoints
const API_ENDPOINTS = {
    HEALTH: '/api/health',
    CHAMPIONS: '/api/champions',
    RECOMMENDATIONS: '/api/recommendations',
    TEST_CHAMPION: '/api/test/champion'
  };
  
  /**
   * Check server health
   * @returns {Promise<{status: string, timestamp: string}>}
   */
  async function checkServerHealth() {
    try {
      const response = await fetch(API_ENDPOINTS.HEALTH);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Server health check failed');
    } catch (error) {
      console.warn('Server health check failed:', error);
      throw error;
    }
  }
  
  /**
   * Test if a champion exists
   * @param {string} championId - ID of the champion to test
   * @returns {Promise<Object>} - Champion data if found
   */
  async function testChampion(championId) {
    try {
      const response = await fetch(`${API_ENDPOINTS.TEST_CHAMPION}/${encodeURIComponent(championId)}`);
      return await response.json();
    } catch (error) {
      console.error('Error testing champion:', error);
      throw error;
    }
  }
  
  /**
   * Fetch all champions data
   * @returns {Promise<Object>} - Object containing all champions
   */
  async function fetchChampionsData() {
    try {
      console.log('Fetching champion data...');
      const response = await fetch(API_ENDPOINTS.CHAMPIONS);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Champion data loaded:', Object.keys(data).length, 'champions');
      return data;
    } catch (error) {
      console.error('Error fetching champion data:', error);
      throw error;
    }
  }
  
  /**
   * Get recommendations for a champion
   * @param {string} championId - ID of the champion
   * @param {string} teamComp - Team composition type (balanced, squishy, tanky, cc-heavy)
   * @returns {Promise<Object>} - Recommendations data
   */
  async function getChampionRecommendations(championId, teamComp = 'balanced') {
    try {
      if (!championId || typeof championId !== 'string') {
        throw new Error('Invalid champion ID');
      }
      
      console.log(`Searching for champion: ${championId} with team composition: ${teamComp}`);
      
      // Set up API URL with team composition parameter
      const apiUrl = `${API_ENDPOINTS.RECOMMENDATIONS}/${encodeURIComponent(championId)}?teamComp=${encodeURIComponent(teamComp)}`;
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
        
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Server might be busy.');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error getting champion recommendations:', error);
      throw error;
    }
  }
  
  // Export the API functions
  export default {
    checkServerHealth,
    testChampion,
    fetchChampionsData,
    getChampionRecommendations
  };