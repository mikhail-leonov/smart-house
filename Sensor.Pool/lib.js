/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from internet and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.3
 * @license MIT
 */

const request = require('sync-request');
const path = require('path');
const location = require('../Shared/location');
const constants = require('../Shared/constants');
const cache = require('../Shared/cache-node');

function getPoolData(common) {
    console.log("   - getPoolData");
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const result = { action: 0 };
    if ((hour === 10 || hour === 17) && minute === 0) {
        result.action = 1;
    }
    return [result];
}

module.exports = {
    getPoolData
};
