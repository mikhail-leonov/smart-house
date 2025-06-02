const https = require('https');

function haversineDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) {
    return x * Math.PI / 180;
  }
  
  const R = 3958.8; // Radius of Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Checks for hurricane near a given lat/lon.
 * Returns a Promise resolving to an object:
 * { hurricane: 0 | 1 | 2 }
 * 
 * 0 - No hurricane near (more than 100 miles away)
 * 1 - Hurricane near (within 100 miles)
 * 2 - Hurricane right here (within 10 miles)
 */
function checkHurricane(lat, lon) {
  return new Promise((resolve, reject) => {
    https.get('https://www.nhc.noaa.gov/CurrentStorms.json', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const storms = JSON.parse(data);
          let status = 0;
          
          for (const storm of storms) {
            if (storm.stormType === "HU") { // Hurricane only
              const dist = haversineDistance(lat, lon, storm.lat, storm.lon);
              if (dist <= 10) {
                // Hurricane right here
                resolve({ hurricane: 2 });
                return;
              } else if (dist <= 100) {
                // Hurricane near but not right here
                status = 1;
              }
            }
          }
          resolve({ hurricane: status });
        } catch (e) {
          reject('Failed to parse storm data: ' + e.message);
        }
      });
    }).on('error', err => reject(err));
  });
}

// Example usage:
const myLat = 29.76;  // Houston, TX
const myLon = -95.37;

checkHurricane(myLat, myLon)
  .then(result => {
    if (result.hurricane === 2) {
      console.log("Hurricane is right here (within 10 miles)!");
    } else if (result.hurricane === 1) {
      console.log("Hurricane is near (within 100 miles).");
    } else {
      console.log("No hurricane nearby.");
    }
  })
  .catch(console.error);