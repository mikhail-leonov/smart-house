/**
 * SmartHub - Full Network IP Tracker (ARP Edition)
 * Scans ARP table for active IPs, tracks selected IPs, reports guests, and sends MQTT status
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov
 * @version 0.6.7
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
  networkPrefix: '192.168.1',
  concurrencyLimit: 25
};

const lastSeen = {};
let lastGuests = new Set();

// Optional: trigger ARP cache fill by pinging the subnet (skip if unnecessary)
async function populateARPTable() {
  const promises = [];
  for (let i = 1; i <= 254; i++) {
    const ip = `${CONFIG.networkPrefix}.${i}`;
    promises.push(execAsync(`ping -c 1 -W 1 ${ip}`).catch(() => {}));
  }
  await Promise.all(promises);
}

// Parses `arp -a` output to extract IPs
async function getARPDevices() {
  const { stdout } = await execAsync('arp -a');
  const devices = [];
  const lines = stdout.split('\n');

  for (const line of lines) {
    const match = line.match(/\(([\d.]+)\)\s+at\s+([0-9a-f:]+)/i);
    if (match) {
      devices.push({ ip: match[1], mac: match[2] });
    }
  }
  return devices;
}

function getTopic(desc) {
  return `home/inside/house/${desc}/status`;
}

async function scan() {
  console.log("ARP Scan started");

  const cfg = config.loadConfig(CONFIG.configPath);
  const ignored = cfg['ignored'] || {};
  const tracked = cfg['tracked'] || {};
  const guests = cfg['guests'] || {};

  await mqtt.connectToMqtt();

  // Optional: uncomment this to populate ARP table before reading it
  // await populateARPTable();
  // await new Promise(res => setTimeout(res, 3000)); // wait a bit

  const arpDevices = await getARPDevices();
  const foundNow = [];

  for (const { ip } of arpDevices) {
    if (ignored[ip]) {
      console.log(`${ip} - Skipped (ignored)`);
      continue;
    }

    console.log(`${ip} found in ARP table`);

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
  }

  // Detect offline tracked devices
  for (const ip in tracked) {
    if (!foundNow.includes(ip) && lastSeen[ip]) {
      const desc = tracked[ip];
      const topic = getTopic(desc);
      await mqtt.publishToMQTT(desc, topic, "Offline", "Sensor");
      lastSeen[ip] = false;
    }
  }

  lastGuests = new Set(foundNow.filter(ip => !tracked[ip] && !ignored[ip]));

  await mqtt.disconnectFromMQTT();
  console.log("ARP Scan done");
}

(async function main() {
  await scan();
})();
