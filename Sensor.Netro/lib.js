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
const axios = require('axios');
const environment = require('../Shared/env-node');

async function getNetroData_report_weather() {
	console.log("   - getNetroData");
	let result = {};

	const env = environment.load();
	const token = env.netro.token;
	const url = 'https://api.netrohome.com/npa/v1/report_weather.json';

	try {
		const response = await axios.post(url, null, {
			params: {
				key: token
			}
		});
		
		console.log(JSON.stringify(response.data, null, 2));
		
		if (response.data && response.data.status === 'OK') {
			const schedules = response.data.data.schedules;
			if (Array.isArray(schedules)) {
				result = schedules.map(schedule => ({
					id: schedule.id,
					device: schedule.device_id,
					type: schedule.type,
					zone: schedule.zone_id,
					start_time: schedule.start,
					duration: schedule.duration,
					enabled: schedule.enabled
				}));
			}
		}
	} catch (error) {
		console.error('Error fetching Netro device status:', error.message);
	}

	return [result];
}



async function getNetroData_Events() {
	console.log("   - getNetroData");
	let result = {};

	const env = environment.load();
	const token = env.netro.token;
	const url = 'https://api.netrohome.com/npa/v1/events.json';

	try {
		const response = await axios.get(url, {
			params: {
				key: token
			}
		});
		
		console.log(JSON.stringify(response.data, null, 2));
		
		if (response.data && response.data.status === 'OK') {
			const events = response.data.data.events;
			if (Array.isArray(events)) {
				result = events.map(evt => ({
					event_id: evt.id,
					event_type: evt.event,
					timestamp: evt.time,
					message: evt.message
				}));
			}
		}
	} catch (error) {
		console.error('Error fetching Netro device status:', error.message);
	}

	return [result];
}



async function getNetroData_Schedule() {
	console.log("   - getNetroData");
	let result = {};

	const env = environment.load();
	const token = env.netro.token;
	const url = 'https://api.netrohome.com/npa/v1/schedules.json';

	try {
		const response = await axios.get(url, {
			params: {
				key: token
			}
		});
		
		if (response.data && response.data.status === 'OK') {
			const schedules = response.data.data.schedules;
			if (Array.isArray(schedules)) {
				result = schedules.map(schedule => ({
					id: schedule.id,
					device: schedule.device_id,
					type: schedule.type,
					zone: schedule.zone_id,
					start_time: schedule.start,
					duration: schedule.duration,
					enabled: schedule.enabled
				}));
			}
		}
	} catch (error) {
		console.error('Error fetching Netro device status:', error.message);
	}

	return [result];
}



async function getNetroData() {
	console.log("   - getNetroData");
	let result = {};

	const env = environment.load();
	const token = env.netro.token;
	const url = 'https://api.netrohome.com/npa/v1/info.json';

	try {
		const response = await axios.get(url, {
			params: {
				key: token
			}
		});
		if (response.data && response.data.status === 'OK') {
			const deviceData = response.data.data.device;
			if (deviceData) {
				result = {
					name: deviceData.name,
					serial: deviceData.serial,
					zone_num: deviceData.zone_num,
					status: deviceData.status,
					version: deviceData.version,
					sw_version: deviceData.sw_version,
					last_active: deviceData.last_active
				};
			}

		}
	} catch (error) {
		console.error('Error fetching Netro device status:', error.message);
	}

	return [result];
}



module.exports = {
    getNetroData
};
