/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from sensors and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.4
 * @license MIT
 */

const request = require('sync-request');
const location = require('../Shared/location.js');
const constants = require('../Shared/constants.js');
const common = require('../Shared/common-node'); 

/*
function parseData(data) {
  return {
    temperature: data.outTemp,                // Celsius
    humidity: data.outHumidity,               // Percentage
    windSpeed: data.windSpeed,                // m/s or km/h depending on unit settings
    windDirection: data.windDir,              // Degrees
    weatherCode: mapToWeatherCode(data),      // Optional mapping function
    precipitation: data.hourlyRain            // mm or inches depending on config
  };
}
function getStationData2(common) {
    console.log("   - getStationData");

    const ipAddress = "";
    const baseUrl = `http://${ipAddress}/data.json`; // Assumed WS-5000 endpoint
    const res = request('GET', baseUrl);
    const data = JSON.parse(res.getBody('utf8'));

    let result = parseData(data);
    return result;
}

*/
function getStationData(common) {
    console.log("   - getStationData");
    const result = { temperature: 21, humidity: 50, windSpeed: 0,  windDirection: 10, weatherCode: 3, precipitation: 0 };
    return [result];
} 

module.exports = {
    getStationData
};
