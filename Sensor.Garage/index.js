/**
 * SmartHub - Full Network IP Tracker (Ping Edition)
 * Pings all IPs in subnet, reports presence via MQTT with named logs
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.1
 * @license MIT
 */

const lib = require('./lib'); 
const path = require('path');
const common = require('../Shared/common-node'); 
const config = require('../Shared/config-node');
const mqtt = require('../Shared/mqtt-node');

const CONFIG = {
    configPath: path.join(__dirname, 'config.cfg')
};

async function scan() {
    console.log("Scan started");
    const cfg = config.loadConfig(CONFIG.configPath);
    try {
        await mqtt.connectToMqtt(); 
		const script = path.basename(path.dirname(__filename));
		await common.processConfig(cfg, lib, mqtt, script);
        await mqtt.disconnectFromMQTT();
    } catch (err) {
        console.error('Error during scan:', err);
    }
    console.log("Scan done");
}

(async function main() {
    await scan();
})();
