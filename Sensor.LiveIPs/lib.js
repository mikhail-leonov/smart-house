/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads ping IPs
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.2
 * @license MIT
 */

const ping = require('ping');

// Ping IP and return true/false
async function isHostAlive(ip) {
	try {
		const res = await ping.promise.probe(ip, {
			timeout: 2,
			extra: ['-c', '1'],
		});
		return res.alive;
	} catch (err) {
		return false;
	}
}

async function getLiveData() {
	console.log("   - getLiveData");

	const base = "192.168.1.";
	const result = {};
	for (let i = 1; i <= 254; i++) {
		const ip = `${base}${i}`;
		const alive = await isHostAlive(ip);
		result[ip] = alive ? 1 : 0;
	}
    return [result];
}

module.exports = {
	getLiveData
};
