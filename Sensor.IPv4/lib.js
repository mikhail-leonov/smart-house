/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from loca;l network IPv4
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.1
 * @license MIT
 */

const { spawnSync } = require('child_process');

function isHostAliveSync(ip) {
    const result = spawnSync('ping', ['-c', '1', '-W', '1', ip], { stdio: 'ignore' });
    return result.status === 0;
}

function getIPv4Data(common) {
    console.log("   - getIPv4Data");
    const networkPrefix = '192.168.1';
    const result = {};
    for (let i = 1; i <= 254; i++) {
        const ip = `${networkPrefix}.${i}`;
        const alive = isHostAliveSync(ip);
        result[ip] = alive ? 1 : 0;
    }
    return [result];
}

module.exports = {
    getIPv4Data
};
