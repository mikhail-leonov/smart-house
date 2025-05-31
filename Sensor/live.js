/**
 * SmartHub - Minimal IP Scanner
 * App which Checks if listed IPs are alive and sends 0/1 to MQTT
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.4
 * @license MIT
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const mqtt = require('../Shared/mqtt-node');
const config = require('../Shared/config-node');

const execAsync = util.promisify(exec);

const CONFIG = {
  configPath: path.join(__dirname, 'live.cfg')
};

async function pingIP(ip) {
  try {
    const { stdout } = await execAsync(`ping -n 1 -w 300 ${ip}`);
    return stdout.includes('Reply from');
  } catch {
    return false;
  }
}

async function scan() {
  console.log("Scan started");

  const cfg = config.loadConfig(CONFIG.configPath);
  const entry = cfg['entry'] || {};

  try {
    await mqtt.connectToMqtt();

    for (const [deviceName, enabled] of Object.entries(entry)) {
      if (String(enabled).trim() === "1") {
        const deviceCfg = cfg[deviceName];
        const ip = deviceCfg?.ip;
        const topic = deviceCfg?.mqttTopic;
        const varName = deviceCfg?.mqttVar || deviceName;

        if (!ip || !topic) {
          console.log(` - Skipping ${deviceName}: missing IP or topic`);
          continue;
        }

        const isAlive = await pingIP(ip);
        const status = isAlive ? 1 : 0;

        await mqtt.publishToMQTT(varName, topic, status, "Sensor");
        console.log(` - ${deviceName} (${ip}) = ${status}`);
      }
    }

    await mqtt.disconnectFromMQTT();

  } catch (err) {
    console.error('Error during scan:', err);
  }

  console.log("Scan done");
}

(async function main() {
  await scan();
})();
