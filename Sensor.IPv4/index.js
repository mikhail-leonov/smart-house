/**
 * SmartHub - Full Network IP Tracker (Ping Edition)
 * Pings all IPs in subnet, reports presence via MQTT with named logs
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.6.8
 * @license MIT
 */

const path = require('path');
const ping = require('ping');
const mqtt = require('../Shared/mqtt-node');
const config = require('../Shared/config-node');

const CONFIG = {
  configPath: path.join(__dirname, 'config.cfg'),
};

const lastSeen = {};
let lastGuests = new Set();

function getTopic(desc) {
  return `home/inside/house/${desc}/status`;
}

// Ping IP and return true/false
async function isHostAlive(ip) {
  try {
    const res = await ping.promise.probe(ip, {
      timeout: 2,
      extra: ['-c', '1'],
    });
    return res.alive;
  } catch (err) {
    // Log: Ping failure (error)
    console.error(`${ip} - error`, err.message);
    return false;
  }
}

// Helper to get device name from config maps
function resolveName(ip, tracked, guests, ignored) {
  return (
    tracked[ip] ||
    guests[ip] ||
    ignored[ip] ||
    ip // fallback to IP if name not found
  );
}

async function scan() {
  // Log: Start of scan (info)
  console.log("Scan started");

  const cfg = config.loadConfig(CONFIG.configPath);
  const networkPrefix = cfg['config']?.networkPrefix || '192.168.1';
  const ignored = cfg['ignored'] || {};
  const tracked = cfg['tracked'] || {};
  const guests = cfg['guests'] || {};

  await mqtt.connectToMqtt();

  const allIPs = new Set();
  for (let i = 1; i <= 254; i++) {
    allIPs.add(`${networkPrefix}.${i}`);
  }

  const foundNow = [];

  for (const ip of allIPs) {
    const name = resolveName(ip, tracked, guests, ignored);

    if (ignored[ip]) {
      // Log: IP is ignored (skip)
      console.log(`${ip} - ${name} (ignored)`);
      continue;
    }

    // Log: IP being pinged (action)
    console.log(`${ip} - ${name}`);
    const alive = await isHostAlive(ip);

    if (alive) {
      foundNow.push(ip);

      if (tracked[ip]) {
        const desc = tracked[ip];
        const topic = getTopic(desc);
        if (!lastSeen[ip]) {
          // Log: Tracked device just came online (status change)
          await mqtt.publishToMQTT(desc, topic, "Online", "Sensor");
        }
        lastSeen[ip] = true;
      } else {
        const desc = guests[ip] || ip;
        const topic = getTopic(desc);
        if (!lastGuests.has(ip)) {
          // Log: Guest device just came online (status change)
          await mqtt.publishToMQTT(desc, topic, "Online", "Sensor");
        }
      }
    }
  }

  // Check tracked devices that are now offline
  for (const ip in tracked) {
    if (!foundNow.includes(ip) && lastSeen[ip]) {
      const desc = tracked[ip];
      const topic = getTopic(desc);
      // Log: Tracked device just went offline (status change)
      await mqtt.publishToMQTT(desc, topic, "Offline", "Sensor");
      lastSeen[ip] = false;
    }
  }

  lastGuests = new Set(foundNow.filter(ip => !tracked[ip] && !ignored[ip]));

  await mqtt.disconnectFromMQTT();
  // Log: End of scan (info)
  console.log("Scan done");
}

(async function main() {
  await scan();
})();
