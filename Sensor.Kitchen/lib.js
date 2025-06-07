/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from internet and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

const request = require('sync-request');
const path = require('path');
const location = require('../Shared/location');
const constants = require('../Shared/constants');
const cache = require('../Shared/cache-node');

function getKitchenData(common) {
    console.log("   - getKitchenData");

    const now = new Date();
    const month = now.getMonth(); // 0-based: Jan = 0
    const day = now.getDate(); // 1-based
	let result = { action: 0 };	
    const quarterMonths = [0, 3, 6, 9];
    if (quarterMonths.includes(month)) {
        if (day === 1) { return result = { action: 1 }; }
    }
    return [result];
}

module.exports = {
    getKitchenData
};
