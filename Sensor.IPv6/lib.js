/**
 * SmartHub - AI powered Smart Home
 * Library for App which is reads values from loca;l network IPv4
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.2
 * @license MIT
 */

const { spawnSync } = require('child_process');

function isHostAliveSync(ip) {
    const result = spawnSync('ping6', ['-c', '1', '-W', '1', ip], { stdio: 'ignore' });
    return result.status === 0;
}

function getIPv6Data(common) {
    console.log("   - getIPv6Data");
    const networkPrefix = '2600:1700:23c0:9390::'; 
    const result = {};
    for (let i = 1; i <= 20; i++) {
        const suffix = i.toString(16).padStart(4, '0');
        const ip = `${networkPrefix}${suffix}`;
        const alive = isHostAliveSync(ip);
        result[ip] = alive ? 1 : 0;
    }
    return [result];
}

module.exports = { getIPv6Data };
