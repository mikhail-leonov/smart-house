/**
 * SmartHub - Gmail-to-MQTT Notification (Async MQTT)
 * Pools working status EMULATOR send MQTT notice asynchronously
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov
 * @version 0.6.1
 * @license MIT
 */

const path = require('path');
const configNode = require('../Shared/config-node');
const mqtt = require('../Shared/mqtt-node');

const CONFIG_PATH = path.join(__dirname, 'pool.cfg');

let config;
try {
    config = configNode.loadConfig(CONFIG_PATH);
} catch (err) {
    console.error("Failed to read config file:", err.message);
    process.exit(1);
}

const {
    location,
    floor,
    room,
    var_name: varName,
    on_time: onTime,
    off_time: offTime
} = config.pool || {};

if (!location || !room || !varName) {
    console.error("Missing required pool config values: location, room, or var_name.");
    process.exit(1);
}

function getTargetValue() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const parseTime = (timeStr) => {
        if (!timeStr) return null;
        const parts = timeStr.split(':');
        if (parts.length !== 2) return null;
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);
        if (isNaN(hour) || isNaN(minute)) return null;
        return hour * 60 + minute;
    };

    const onTime = parseTime(config.pool?.on_time);
    const offTime = parseTime(config.pool?.off_time);

    if (onTime !== null && currentMinutes >= onTime && currentMinutes < onTime + 10) return "on";
    if (offTime !== null && currentMinutes >= offTime && currentMinutes < offTime + 10) return "off";
    return null;
}

// Blocking pause function (seconds)
function pause(seconds) {
  const start = Date.now();
  while (Date.now() - start < 1000 * seconds) {
    // Busy wait
  }
}

async function scan() {
    console.log("Scan started");
    const varValue = getTargetValue();
    if (varValue) {
      try {
          const topic = mqtt.buildMqttTopic(location, floor, room, varName);
          await mqtt.connectToMqtt();
          await mqtt.publishToMQTT(varName, topic, varValue, "Sensor");
          pause(5);
          await mqtt.disconnectFromMQTT();
  
      } catch (err) {
          console.error(`[${new Date().toISOString()}] Error:`, err.message);
      }
    } else {
      console.log(` - Outside of time frame`);
    }
    console.log("Scan done");
}

(async () => {
  await scan();
})();

