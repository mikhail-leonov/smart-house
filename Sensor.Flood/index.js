const https = require('https');

function haversineDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) {
    return x * Math.PI / 180;
  }
  
  const R = 3958.8; // miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Fetch JSON via HTTPS GET
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject('Failed to parse JSON: ' + e.message);
        }
      });
    }).on('error', err => reject(err));
  });
}

/**
 * Returns { floodWarning: 0 | 1 | 2 }
 * 0 - No flood warning near (more than 100 miles)
 * 1 - Flood warning near (within 100 miles)
 * 2 - Flood warning right here (within 10 miles)
 */
async function checkFloodWarning(lat, lon) {
  const url = 'https://api.weather.gov/alerts/active';
  
  try {
    const data = await fetchJson(url);
    
    let status = 0;
    
    // Alerts are in data.features array
    for (const alert of data.features) {
      const properties = alert.properties;
      const eventName = properties.event.toLowerCase();
      
      // Filter only flood-related alerts
      if (eventName.includes('flood')) {
        // Get center point of affected area from geometry
        // geometry can be Polygon or MultiPolygon or Point
        let centroid = null;
        const geom = alert.geometry;
        
        if (!geom) continue; // no geometry
        
        if (geom.type === 'Point') {
          centroid = geom.coordinates; // [lon, lat]
        } else if (geom.type === 'Polygon') {
          centroid = polygonCentroid(geom.coordinates[0]); // outer ring
        } else if (geom.type === 'MultiPolygon') {
          centroid = polygonCentroid(geom.coordinates[0][0]); // first polygon outer ring
        }
        
        if (centroid) {
          const [alertLon, alertLat] = centroid;
          const dist = haversineDistance(lat, lon, alertLat, alertLon);
          if (dist <= 10) {
            return { floodWarning: 2 };
          } else if (dist <= 100) {
            status = 1; // keep checking for closer alerts
          }
        }
      }
    }
    return { floodWarning: status };
  } catch (err) {
    throw new Error('Error fetching flood warnings: ' + err);
  }
}

/**
 * Calculates centroid of a polygon given array of points [[lon, lat], [lon, lat], ...]
 * Uses simple centroid formula for polygon.
 */
function polygonCentroid(points) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  let factor = 0;
  
  for (let i = 0, len = points.length, j = len - 1; i < len; j = i++) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    factor = (xi * yj - xj * yi);
    area += factor;
    cx += (xi + xj) * factor;
    cy += (yi + yj) * factor;
  }
  area /= 2;
  cx /= (6 * area);
  cy /= (6 * area);
  
  return [cx, cy];
}

// Example usage:
const myLat = 29.76; // Houston, TX
const myLon = -95.37;

checkFloodWarning(myLat, myLon)
  .then(result => {
    if (result.floodWarning === 2) {
      console.log('Flood warning is right here (within 10 miles)!');
    } else if (result.floodWarning === 1) {
      console.log('Flood warning is near (within 100 miles).');
    } else {
      console.log('No flood warning nearby.');
    }
  })
  .catch(console.error);