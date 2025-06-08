/**
 * SmartHub - AI powered Smart Home
 * Library for App which reads values from internet and sends them to MQTT to update home state
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
const { Client } = require('tplink-smarthome-api');

async function discoverDevice(device) {
	let result = {};
	if (!device || !device.deviceType) return null;
	try {
		await device.getSysInfo(); // Wake it up
		const name = device.alias || device.deviceId || `Device_${Date.now()}`;
		result = {
			name: name,
			id: device.deviceId,
			type: device.deviceType,
			host: device.host
		};
		if (device.deviceType === 'plug') {
			result.power = await device.getPowerState();
		} else if (device.deviceType === 'bulb') {
			const lightState = await device.lighting.getLightState();
			result.power = lightState.on;
			result.brightness = lightState.brightness;
			result.color_temp = lightState.color_temp;
		} else {
			result.message = 'Unsupported device type';
		}
	} catch (err) {
		result.message = `? Error with device: ${err.message}`;
		return null;
	}
	return result;
}

async function getKasaData(common) {
	console.log("   - getKasaData");

	const client = new Client();
	const result = [];
	const seen = new Set(); // Unique deviceId tracker

	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			client.stopDiscovery();
			resolve(result);
		}, 5000); // 5 seconds max wait

		const handleDevice = async (device) => {
			if (device && device.deviceId && !seen.has(device.deviceId)) {
				const data = await discoverDevice(device);
				if (data) {
					seen.add(device.deviceId);
					result.push(data);
				}
			}
		};

		client
			.startDiscovery()
			.on('device-new', handleDevice)
			.on('device-online', handleDevice);

		client.on('error', (err) => {
			clearTimeout(timeout);
			console.error("Discovery error:", err);
			reject(err);
		});
	});
}

module.exports = {
	getKasaData
};
