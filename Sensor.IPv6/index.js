/**
 * SmartHub - Full Network IPv6 Tracker
 * App which scans IPv6 devices from config, tracks selected IPs, reports guests, and sends MQTT status
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.8
 * @license MIT
 */

const { execSync } = require('child_process');
const path = require('path');
const config = require('../Shared/config-node');
const mqtt = require('../Shared/mqtt-node');

// ?? Set your actual network interface here (e.g., eth0, enp3s0, wlan0)
const DEFAULT_INTERFACE = 'eth0';

const CONFIG = {
  configPath: path.join(__dirname, 'config.cfg'),
  mqttBaseTopic: '/home/internal/house/network'
};

const lastSeen = {};
let lastGuests = new Set();

/**
 * Format IPv6 address with interface if it's link-local
 * @param {string} ip - IPv6 address
 * @returns {string} - formatted IPv6 with %interface if needed
 */
function formatIPv6(ip) {
  if (ip.startsWith('fe80::') && !ip.includes('%')) {
    return `${ip}%${DEFAULT_INTERFACE}`;
  }
  return ip;
}

/**
 * Synchronously ping an IPv6 address
 * @param {string} ip - The IPv6 address to check
 * @returns {boolean} - true if device is alive, false otherwise
 */
function isIPv6Alive(ip) {
  try {
    const output = execSync(`ping -6 -c 1 -w 2 ${formatIPv6(ip)}`, { encoding: 'utf-8' });
    return output.includes('1 packets transmitted, 1 received');
  } catch {
    return false;
  }
}

function getTopic(desc) {
  return `${CONFIG.mqttBaseTopic}/${desc}/status`;
}

async function scan() {
  console.log('Scan started');

  try {
    const cfg = config.loadConfig(CONFIG.configPath);
    const ignored = cfg['ignored'] || {};
    const tracked = cfg['tracked'] || {};
    const guests = cfg['guests'] || {};

    const foundNow = [];
    const ipList = Object.keys(cfg['entry'] || {});

    await mqtt.connectToMqtt();

    for (const ip of ipList) {
      if (!String(cfg['entry'][ip]).trim() === '1') continue;

      if (ignored[ip]) {
        console.log(`${ip} - Skipped (ignored)`);
        continue;
      }

      const script = path.basename(path.dirname(__filename));

      const isAlive = isIPv6Alive(ip);
      if (isAlive) {
        foundNow.push(ip);

        if (tracked[ip]) {
          const desc = tracked[ip];
          const topic = getTopic(desc);
          if (!lastSeen[ip]) {
            await mqtt.publishToMQTT(desc, topic, 'Online', 'sensor', script);
            console.log(`${ip} - Online (tracked: ${desc})`);
          }
          lastSeen[ip] = true;
        } else {
          if (!lastGuests.has(ip)) {
            const desc = guests[ip] || ip;
            const topic = getTopic(desc);
            await mqtt.publishToMQTT(desc, topic, 'Online', 'sensor', script);
            console.log(`${ip} - Online (guest: ${desc})`);
          }
        }
      } else {
        if (tracked[ip] && lastSeen[ip]) {
          const desc = tracked[ip];
          const topic = getTopic(desc);
          await mqtt.publishToMQTT(desc, topic, 'Offline', 'sensor', script);
          lastSeen[ip] = false;
          console.log(`${ip} - Offline (tracked: ${desc})`);
        }
      }
    }

    lastGuests = new Set(foundNow.filter(ip => !tracked[ip] && !ignored[ip]));

    await mqtt.disconnectFromMQTT();

    console.log('Scan done');
  } catch (err) {
    console.error('Error during scan:', err);
  }
}

(async function main() {
  await scan();
})();
