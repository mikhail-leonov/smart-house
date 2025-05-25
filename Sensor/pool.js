/**
 * SmartHub - Gmail-to-MQTT Notification (Async MQTT)
 * Pools working status EMULATOR send MQTT notice asynchronously
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov
 * @version 0.5.5
 * @license MIT
 */

const path = require('path');
const mqtt = require('../Shared/mqtt-node');
const configNode = require('../Shared/config-node');

const CONFIG_PATH = path.join(__dirname, 'pool.cfg');

let config;
try {
    config = configNode.loadConfig(CONFIG_PATH);
} catch (err) {
    console.error("Failed to read config file:", err.message);
    process.exit(1);
}

const LOCATION = "outside";
const FLOOR = "first_floor";
const ROOM = "pool";
const varName = "vac_status";

const topic = mqtt.buildMqttTopic(LOCATION, FLOOR, ROOM, varName);

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

async function run() {
    await mqtt.connectToMqtt();

    const varValue = getTargetValue();

    if (!varValue) {
        console.log(`[${new Date().toISOString()}] Out of time frame borders.`);
        return;
    }

    try {
        const currentValue = await mqtt.subscribeToMQTT(topic, varName);

        if (currentValue === varValue) {
            console.log(`[${new Date().toISOString()}] Already '${varValue}', skipping publish.`);
            return;
        }

        await mqtt.publishToMQTT(varName, topic, varValue, "Random");

        console.log(` - publishToMQTT(${varName}, ${topic}, ${varValue}, "sensor")`);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error:`, err.message);
    } finally {
        await mqtt.disconnectFromMQTT();
    }
}

run();
