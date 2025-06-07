/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from CPU and Mem 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

const os = require('os');

function getSystemData(common) {
    console.log("   - getSystemData");

	// Memory Usage
	const totalMem = os.totalmem();
	const freeMem = os.freemem();
	const usedMem = totalMem - freeMem;
	const memVal = Math.round((usedMem / totalMem) * 100);

	// CPU Usage (averaged over all cores)
	const cpus = os.cpus();
	const idleMs = cpus.reduce((sum, core) => sum + core.times.idle, 0);
	const totalMs = cpus.reduce((sum, core) => {
	const t = core.times;
	return sum + t.user + t.nice + t.sys + t.irq + t.idle;
	}, 0);

	const cpuVal = 100 - Math.round((idleMs / totalMs) * 100);

	const result = {
		cpu: Math.round(cpuVal * 100) / 100,
		mem: Math.round(memVal * 100) / 100
	};
    return [result];
}

module.exports = {
    getSystemData
};
