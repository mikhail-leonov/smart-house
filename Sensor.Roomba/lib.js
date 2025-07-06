/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from internet and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.4
 * @license MIT
 */

const path = require('path');
const { Local } = require('dorita980');
const location = require('../Shared/location');
const constants = require('../Shared/constants');
const cache = require('../Shared/cache-node');

// Replace this with your real Roomba configs (IP, blid, password)
const roombaConfigs = [
	{
		name: 'Roomba-2nd-floor',
		blid: 'B524DCD9605D41F19DC942908FC4D55D',
		password: ':1:1641414205:C2mlLj748EB27xos',
		ip: '192.168.1.113'
	}
];

async function getRoombaStatus(roomba) {
	console.log(`     - getRoombaStatus(${roomba.blid}, ${roomba.password}, ${roomba.ip})`);

	const local = new Local(roomba.blid, roomba.password, roomba.ip);
	try {
		const state = await local.getRobotState(['batPct', 'cleanMissionStatus', 'bin.full', 'errorCode', 'dock', 'lastCommand.command', 'state']);
		await local.end();
		return {
			name: roomba.name,
			battery: state.batPct,
			docked: state.dock?.known ?? false,
			cleaning: (state.cleanMissionStatus?.phase || '').toLowerCase() === 'run',
			bin: state.bin?.full ?? false,
			error: state.cleanMissionStatus?.errorCode ?? 0,
			cmd: state.lastCommand?.command || null,
			state: state.state || null
		};
	} catch (err) {
		console.error(`Failed to get status for ${roomba.name}:`, err.message);
		return {
			name: roomba.name,
			error: 'Unavailable'
		};
	}
}

async function getRoombaData(common) {
	console.log('   - getRoombaData');
	const statuses = [];
	for (const roomba of roombaConfigs) {
		const status = await getRoombaStatus(roomba);
		statuses.push(status);
	}
	return statuses;
}

module.exports = {
	getRoombaData
};
