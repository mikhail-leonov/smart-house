/**
 * SmartHub - AI powered Smart Home
 * MQTT Node.JS Library (Async Version)
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.5.0
 * @license MIT
 */

const mqtt = require('mqtt');
const mqttBrokerUrl = "mqtt://localhost:1883";
const mqttTopic = "home";

let mqttClient = null;
let mqttConnected = false;
let connectionPromise = null;

// Build a hierarchical MQTT topic
function buildMqttTopic(location, floor, room, variable) {
    let topic = location;
    if (floor) topic += `/${floor}`;
    topic += `/${room}/${variable}`;
    return `${mqttTopic}/${topic}`;
}

// Connect asynchronously (returns a promise you can await)
function connectToMqtt() {
    if (mqttConnected) return Promise.resolve();
    if (connectionPromise) return connectionPromise;

    connectionPromise = new Promise((resolve, reject) => {
        mqttClient = mqtt.connect(mqttBrokerUrl);

        mqttClient.on('connect', () => {
            mqttConnected = true;
            console.log("MQTT connected");
            resolve();
        });

        mqttClient.on('error', (err) => {
            console.error("MQTT error:", err.message);
            reject(err);
        });

        mqttClient.on('close', () => {
            mqttConnected = false;
            console.warn("MQTT disconnected");
        });
    });

    return connectionPromise;
}

// Gracefully disconnect
async function disconnectFromMQTT() {
    if (mqttClient && mqttConnected) {
        await new Promise(resolve => mqttClient.end(true, resolve));
        mqttConnected = false;
    }
}

// Async publish method
async function publishToMQTT(variable, topic, value, type = 'text') {
    if (!mqttConnected) {
        try {
            await connectToMqtt();
        } catch (err) {
            console.warn("MQTT connection failed, cannot publish.");
            return;
        }
    }
    const payload = JSON.stringify({ variable, value, type, timestamp: new Date().toISOString() });

    return new Promise((resolve, reject) => {
        mqttClient.publish(topic, payload, { retain: true }, (err) => {
            if (err) {
                console.error("MQTT publish failed:", err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Export async API
module.exports = {
    mqttTopic,
    buildMqttTopic,
    connectToMqtt,
    disconnectFromMQTT,
    publishToMQTT
};
