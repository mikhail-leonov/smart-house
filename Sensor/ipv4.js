/**
 * SmartHub - AI powered Smart Home
 * App which reads values from local network and sends them to MQTT to update home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.5.2
 * @license MIT
 */

const { exec } = require('child_process');
const mqtt = require('mqtt');
const util = require('util');

const execAsync = util.promisify(exec);

// IPs to ignore completely
const IGNORED_IPS = {
  "192.168.1.75": "media",
  "192.168.1.82": "Brother-BW-printer",
  "192.168.1.92": "NAS",
  "192.168.1.93": "NAS",
  "192.168.1.103": "DESKTOP-BHA979S",
  "192.168.1.141": "Samsung",
  "192.168.1.154": "unknown30b4b802c067",
  "192.168.1.190": "Air-Ties-Extender",
  "192.168.1.211": "unknownacccfcc5733f",
  "192.168.1.254": "ATT-Router"
};

const TRACKED_IPS = {
  "192.168.1.78": "INNA-phone",
  "192.168.1.102": "INNA-tablet",
  "192.168.1.108": "Lawn-Watering-controller",
  "192.168.1.172": "Galaxy-Tab-S6-Lite",
  "192.168.1.174": "MIKE-desktop",
  "192.168.1.184": "INNA-laptop",
  "192.168.1.203": "Mikhail-tablet",
  "192.168.1.208": "Mikhail-phone",
  "192.168.1.207": "Dasha-tablet",
  "192.168.1.237": "Dasha-phone"
};

const KNOWN_GUESTS = {
  // Add known guests if needed
};

const CONFIG = {
  networkPrefix: '192.168.1',
  mqttBroker: 'mqtt://localhost:1883'
};

const mqttClient = mqtt.connect(CONFIG.mqttBroker);
let lastSeen = {};
let lastGuests = new Set();

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  main().then(() => {
    mqttClient.end();
    process.exit(0);
  });
});

function publish2MQTT(topic, value) {
  mqttClient.publish(topic, JSON.stringify({
    value: value,
    type: "Sensor",
    timestamp: new Date().toISOString()
  }), { retain: true });
}

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
  console.log('\nScan - started');
  const foundNow = [];
  const ipPromises = [];

  for (let i = 1; i <= 254; i++) {
    const ip = `${CONFIG.networkPrefix}.${i}`;

    if (IGNORED_IPS[ip]) {
      const desc = IGNORED_IPS[ip];
      console.log(`${ip} - Skipped (${desc})`);
      continue;
    }

    ipPromises.push(
      (async () => {
        const isAlive = await pingIP(ip);
        if (isAlive) {
          foundNow.push(ip);
          if (TRACKED_IPS[ip]) {
            const desc = TRACKED_IPS[ip];
            const topic = getTopic(desc);
            if (!lastSeen[ip]) {
              console.log(`${ip} - Online (${desc})`);
              publish2MQTT(topic, "Online");
            }
            lastSeen[ip] = true;
          } else {
            if (!lastGuests.has(ip)) {
              const desc = KNOWN_GUESTS[ip] || ip;
              const topic = getTopic(desc);
              console.log(`${ip} - Guest`);
              publish2MQTT(topic, "Online");
            }
          }
        } else {
          if (TRACKED_IPS[ip] && lastSeen[ip]) {
            const desc = TRACKED_IPS[ip];
            const topic = getTopic(desc);
            console.log(`${ip} - Offline (${desc})`);
            publish2MQTT(topic, "Offline");
            lastSeen[ip] = false;
          }
        }
      })()
    );
  }

  await Promise.all(ipPromises);
  lastGuests = new Set(foundNow.filter(ip => !TRACKED_IPS[ip] && !IGNORED_IPS[ip]));
  console.log('\nScan - done');
}

async function main() {
  await scan();
}
