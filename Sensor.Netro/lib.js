/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from internet and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.8
 * @license MIT
 */

const request = require('sync-request');
const path = require('path');
const location = require('../Shared/location');
const constants = require('../Shared/constants');
const cache = require('../Shared/cache-node');
const axios = require('axios');
const environment = require('../Shared/env-node');

async function getNetroData() {
	console.log("getNetroData");
	let result = {};
	
	const env = environment.load();
	const token = env.netro.token;

	const url = 'https://api.netrohome.com/npa/v1/info.json';

	try {
		const response = await axios.post(url, {
			params: {
				key: token
			}
		});
		if (response.data && response.data.status === 'ok') {
			const deviceData = response.data.result;
			// Flatten only what you care about
			result = {
				device_serial: deviceData.serial,
				device_type: deviceData.type,
				battery_level: deviceData.battery,
				wifi_strength: deviceData.signal,
				watering: deviceData.watering,
				last_connected: deviceData.time,
				rain_sensor: deviceData.rain_sensor,
				rain_delay: deviceData.rain_delay,
				watering_mode: deviceData.mode,
				temperature: deviceData.temp,
				zone_count: deviceData.zonecnt
			};
		} else {
			console.warn('Unexpected Netro response:', response.data);
		}
	} catch (error) {
		console.error('Error fetching Netro device status:', error.message);
	}
	return result;
}


module.exports = {
    getNetroData
};
