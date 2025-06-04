/**
 * SmartHub - Node-based IP Scanner using ping
 * Uses `ping` npm package instead of relying on ARP table
 * 
 * @version 0.6.7
 * @license MIT
 */

const path = require('path');
const util = require('util');
const ping = require('ping');
const mqtt = require('../Shared/mqtt-node');
const config = require('../Shared/config-node');

const CONFIG = {
  configPath: path.join(__dirname, 'config.cfg'),
};

// Ping IP and return true/false
async function isHostAlive(ip) {
  try {
    const res = await ping.promise.probe(ip, {
      timeout: 2,
      extra: ['-c', '1'],
    });
    return res.alive;
  } catch (err) {
    console.error(`Ping error for ${ip}:`, err.message);
    return false;
  }
}

async function scan() {
  console.log("Starting scan...");

  const cfg = config.loadConfig(CONFIG.configPath);
  const entry = cfg['entry'] || {};

  try {
    await mqtt.connectToMqtt();

    for (const [deviceName, isEnabled] of Object.entries(entry)) {
      if (String(isEnabled).trim() !== "1") {
        console.log(`Skipping ${deviceName} (disabled in config)`);
        continue;
      }

      const deviceCfg = cfg[deviceName];
      const ip = deviceCfg?.ip;
      const topic = deviceCfg?.mqttTopic;
      const varName = deviceCfg?.mqttVar || deviceName;

      if (!ip || !topic) {
        console.log(`Skipping ${deviceName}: missing IP or MQTT topic`);
        continue;
      }

      console.log(`Pinging ${deviceName} at ${ip}...`);

      const isAlive = await isHostAlive(ip);
      const status = isAlive ? 1 : 0;
      const script = path.basename(path.dirname(__filename));
      await mqtt.publishToMQTT(varName, topic, status, "sensor", script);
	  
      console.log(`${deviceName} (${ip}) status = ${status}`);
    }

    await mqtt.disconnectFromMQTT();
  } catch (err) {
    console.error('Error during scan:', err);
  }

  console.log("Scan complete.");
}

(async function main() {
  await scan();
})();
