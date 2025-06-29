/**
 * SmartHub - Direct MQTT over TLS Roomba Listener (No dorita980)
 * Author: Mikhail's SmartHouse
 */

// === CONFIG ===
const IP = '192.168.1.113'; 
const BLID = 'B524DCD9605D41F19DC942908FC4D55D';
const PASS = ':1:1641414205:C2mlLj748EB27xos';
const dorita980 = require('dorita980');


const myRobotViaLocal = new dorita980.Local(BLID, PASS, IP);

myRobotViaLocal.on('connect', () => {
	console.log('[Roomba] Connected via Local HTTPS API.');
	myRobotViaLocal.getRobotState(['batPct', 'cleanMissionStatus']).then((state) => {
		console.log('[Roomba] State:', state);
		myRobotViaLocal.end();
	}).catch((err) => {
		console.error('[Roomba] Error reading state:', err);
		myRobotViaLocal.end();
	});
});

myRobotViaLocal.on('error', (err) => {
	console.error('[Roomba] Connection error:', err);
});