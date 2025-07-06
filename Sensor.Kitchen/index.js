/**
 * SmartHub - Gmail-to-MQTT Notification (Stateless Quarterly Filter)
 * Fires MQTT "on" only on 1st day of Jan/Apr/Jul/Oct, "off" on the 2nd day. Stateless.
 * Fixed topic and variable name, no config dependency.
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.4
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
