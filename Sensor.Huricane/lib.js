/**
 * SmartHub - AI powered Smart Home
 * Library for App which reads values from sensors and sends them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.3
 * @license MIT
 */

const https = require('https');
const lib = require('./lib'); 
const request = require('sync-request');
const location = require('../Shared/location.js');
const constants = require('../Shared/constants.js');

function haversineDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) {
    return x * Math.PI / 180;
  }
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks for hurricane near a given lat/lon.
 * Returns a Promise resolving to an object:
 * { hurricane: 0 | 1 | 2 }
 */
function getHurricaneData() {
    console.log("   - getHurricaneData");
  return new Promise((resolve, reject) => {
    https.get('https://www.nhc.noaa.gov/CurrentStorms.json', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          const storms = Array.isArray(parsed) ? parsed : parsed?.activeStorms || parsed?.storms || [];

          if (!Array.isArray(storms) || storms.length === 0) {
            return resolve([{ hurricane: 0 }]);
          }

          let status = 0;

          for (const storm of storms) {
            if (storm.stormType === "HU") { // Hurricane only
              const dist = haversineDistance(location.LAT, location.LON, storm.lat, storm.lon);
              if (dist <= 10) {
                return resolve([{ hurricane: 2 }]);
              } else if (dist <= 100) {
                status = 1;
              }
            }
          }

          resolve([{ hurricane: status }]);
        } catch (e) {
          reject('Failed to parse storm data: ' + e.message);
        }
      });
    }).on('error', err => reject(err));
  });
}

module.exports = {
  getHurricaneData
};
