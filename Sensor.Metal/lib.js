/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from internet and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.2
 * @license MIT
 */

const request = require('sync-request');
const path = require('path');
const location = require('../Shared/location');
const constants = require('../Shared/constants');	
const cache = require('../Shared/cache-node');

const environment = require('../Shared/env-node');
const env = environment.load();

function getMetalData() {
	console.log("   - getMetalData");

	// Map of metal codes to human-readable names
	const metals = {
		XAU: 'gold',
		XAG: 'silver',
		XPT: 'platinum',
		XPD: 'palladium'
	};

	const currency = 'USD';
	let result = {};

	for (const code in metals) {
		const name = metals[code];
		const url = `https://www.goldapi.io/api/${code}/${currency}`;
		const res = request('GET', url, {
			headers: {
				'x-access-token': env.metal.goldapi_api_key,
				'Content-Type': 'application/json',
				'User-Agent': 'Node.js Smart Home script'
			}
		});
		if (res.statusCode === 200) {
			const data = JSON.parse(res.getBody('utf8'));
			result[name] = data.price;
		} else {
			console.error(`Failed to fetch ${name} price:`, res.statusCode);
		}
	}
    return [result];
}

module.exports = {
    getMetalData
};
