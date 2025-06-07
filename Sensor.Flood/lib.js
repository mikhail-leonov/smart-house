/**
 * SmartHub - AI powered Smart Home
 * Library for App which monitor flooding
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

const https = require('https');
const lib = require('./lib'); 
const request = require('sync-request');
const location = require('../Shared/location.js');
const constants = require('../Shared/constants.js');

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = x => x * Math.PI / 180;
  const R = 3958.8; // Miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Fetches flood warnings near a given location from NOAA API.
 * Returns a Promise resolving to { flood: 0 | 1 }
 * 0 - No active warnings nearby
 * 1 - At least one active flood warning near location (within 100 miles)
 */
function getFloodData() {
    console.log("   - getFloodData");
  return new Promise((resolve, reject) => {
    const url = `https://api.weather.gov/alerts/active?event=Flood%20Warning`;

    https.get(url, { headers: { 'User-Agent': 'smart-house/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          if (!Array.isArray(parsed.features) || parsed.features.length === 0) {
            return resolve([{ flood: 0 }]);
          }

          for (const alert of parsed.features) {
            const area = alert.geometry;
            if (!area || !Array.isArray(area.coordinates)) continue;

            for (const polygon of area.coordinates) {
              for (const [lon, lat] of polygon) {
                const dist = haversineDistance(location.LAT, location.LON, lat, lon);
                if (dist <= 10) {
                  return resolve([{ flood: 1 }]);
                }
              }
            }
          }

          resolve({ flood: 0 });
        } catch (err) {
          reject(new Error('Failed to parse JSON: ' + err.message));
        }
      });
    }).on('error', err => reject(new Error('Error fetching flood warnings: ' + err.message)));
  });
}

module.exports = {
  getFloodData
};
