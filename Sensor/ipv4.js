/**
 * SmartHub - Full Network IP Tracker
 * App which scans full subnet, tracks selected IPs, reports guests, and sends MQTT status
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.1
 * @license MIT
 */

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const mqtt = require('../Shared/mqtt-node');
const config = require('../Shared/config-node');

const execAsync = util.promisify(exec);

const CONFIG = {
  configPath: path.join(__dirname, 'ipv4.cfg'),
  networkPrefix: '192.168.1'
};

const lastSeen = {};
let lastGuests = new Set();

async function pingIP(ip) {
  try {
    const { stdout } = await execAsync(`ping -n 1 -w 300 ${ip}`);
    return stdout.includes('Reply from');
  } catch {
    return false;
  }
}

function getTopic(desc) {
  return `home/inside/house/${desc}/status`;
}

async function scan() {
  console.log("Scan started");

  const cfg = config.loadConfig(CONFIG.configPath);
  const ignored = cfg['ignored'] || {};
  const tracked = cfg['tracked'] || {};
  const guests = cfg['guests'] || {};

  const foundNow = [];
  const ipPromises = [];

  await mqtt.connectToMqtt();

  for (let i = 1; i <= 254; i++) {
    const ip = `${CONFIG.networkPrefix}.${i}`;

    if (ignored[ip]) {
      const desc = ignored[ip];
      console.log(`${ip} - Skipped (${desc})`);
      continue;
    }

    ipPromises.push(
      (async () => {
        const isAlive = await pingIP(ip);
        if (isAlive) {
          foundNow.push(ip);
          if (tracked[ip]) {
            const desc = tracked[ip];
            const topic = getTopic(desc);
            if (!lastSeen[ip]) {
              await mqtt.publishToMQTT(desc, topic, "Online", "Sensor");
            }
            lastSeen[ip] = true;
          } else {
            if (!lastGuests.has(ip)) {
              const desc = guests[ip] || ip;
              const topic = getTopic(desc);
              await mqtt.publishToMQTT(desc, topic, "Online", "Sensor");
            }
          }
        } else {
          if (tracked[ip] && lastSeen[ip]) {
            const desc = tracked[ip];
            const topic = getTopic(desc);
            await mqtt.publishToMQTT(desc, topic, "Offline", "Sensor");
            lastSeen[ip] = false;
          }
        }
      })()
    );
  }

  await Promise.all(ipPromises);
  lastGuests = new Set(foundNow.filter(ip => !tracked[ip] && !ignored[ip]));

  await mqtt.disconnectFromMQTT();

  console.log("Scan done");
}

(async function main() {
  await scan();
})();
