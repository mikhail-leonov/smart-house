/**
 * SmartHub - AI powered Smart Home
 * App which is reads values from internet and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
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
		await common.processConfig(cfg, lib, mqtt);
        await mqtt.disconnectFromMQTT();
    } catch (err) {
        console.error('Error during scan:', err);
    }
    console.log("Scan done");
}

(async function main() {
    await scan();
})();
