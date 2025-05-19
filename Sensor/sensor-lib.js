const request = require('sync-request');

let LAT = +26.2700;
let LON = -80.2700;

let OCEAN_LAT =  26.291471;
let OCEAN_LON = -80.073096;

function getSensorData(lon, lat) {
  console.log("getSensorData");
  let result = {};
  return result;
}

module.exports = {
    getSensorData
};
