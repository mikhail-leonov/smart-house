/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from internet and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

const path = require('path');
const location = require('../Shared/location');
const constants = require('../Shared/constants');
const cache = require('../Shared/cache-node');

function getThermostatData(common) {
    console.log("   - getThermostatData");

    const now = new Date();
    const hour = now.getHours();
    const result = { 
        temperature: (hour >= 8 && hour < 22) ? 76 : 74
    };
    return [result];
}

module.exports = {
    getThermostatData
};
