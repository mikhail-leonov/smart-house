/**
 * SmartHub - ARP-based IP Scanner with Nmap Pre-sweep
 * Wakes up subnet using `nmap -sn`, then checks ARP table for live IPs
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.6.6
 * @license MIT
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const mqtt = require('../Shared/mqtt-node');
const config = require('../Shared/config-node');

const execAsync = util.promisify(exec);

const CONFIG = {
  configPath: path.join(__dirname, 'config.cfg'),
};

// Ping IP to populate ARP cache
async function pingIP(ip) {
  try {
    await execAsync(`ping -c 1 -W 1 ${ip}`);
  } catch {
    // Ignore ping failures � we're just trying to refresh ARP
  }
}

// Check ARP cache for the IP
async function isInARP(ip) {
  try {
    const { stdout } = await execAsync(`arp -an`);
    return stdout.includes(`(${ip})`);
  } catch {
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

      console.log(`Checking ${deviceName} at ${ip}...`);

      await pingIP(ip);
      const isAlive = await isInARP(ip);
      const status = isAlive ? 1 : 0;

      await mqtt.publishToMQTT(varName, topic, status, "Sensor");
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
