/**
 * SmartHub - AI powered Smart Home
 * MQTT Node.JS Library (Async Version)
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.1
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
    console.log(` - mqtt.buildMqttTopic(${location}, ${floor}, ${room}, ${variable})`);
    let topic = location;
    if (floor) topic += `/${floor}`;
    topic += `/${room}/${variable}`;
    return `${mqttTopic}/${topic}`;
}

// Connect asynchronously (returns a promise you can await)
function connectToMqtt() {
    console.log(` - mqtt.connectToMqtt()`);
    if (mqttConnected) { return Promise.resolve(); }
    if (connectionPromise) { return connectionPromise; }

    connectionPromise = new Promise((resolve, reject) => {
        mqttClient = mqtt.connect(mqttBrokerUrl);

        mqttClient.on('connect', () => {
            mqttConnected = true;
            console.log(" - mqtt.connected == true");
            resolve();
        });

        mqttClient.on('error', (err) => {
            console.log(" - mqtt.error == " + err.message);
            reject(err);
        });

        mqttClient.on('close', () => {
            mqttConnected = false;
            console.log(" - mqtt.close == true");
        });
    });

    return connectionPromise;
}

// Gracefully disconnect
async function disconnectFromMQTT() {
    console.log(` - mqtt.disconnectFromMQTT()`);
    if (mqttClient && mqttConnected) {
        await new Promise(resolve => mqttClient.end(true, resolve));
        mqttConnected = false;
    }
}

// Async publish method
async function publishToMQTT(variable, topic, value, type) {
    console.log(` - mqtt.publishToMQTT(${variable}, ${topic}, ${value}, ${type})`);
    if (!mqttConnected) {
        try {
            await connectToMqtt();
        } catch (err) {
            console.warn("MQTT connection failed.");
            return;
        }
    }
    const payload = JSON.stringify({ variable, value, type, timestamp: new Date().toISOString() });

    return new Promise((resolve, reject) => {
        mqttClient.publish(topic, payload, { retain: true }, (err) => {
            if (err) {
                console.error(" - - mqtt publish failed:", err.message);
                reject(err);
            } else {
                console.error(" - - mqtt published succesfully");
                resolve();
            }
        });
    });
}

async function subscribeToMQTT(topic, variableName = null) {
    console.log(` - mqtt.Subscribe(${topic}, ${variableName})`);

    if (!mqttConnected) {
        try {
            await connectToMqtt();
        } catch (err) {
            console.warn("MQTT connection failed.");
            return;
        }
    }
    return new Promise((resolve) => {

        mqttClient.on('connect', () => {
            mqttClient.subscribe(topic, { qos: 0 }, (err) => {
                if (err) {
                    resolve(null);
                }
            });
        });

        mqttClient.on('message', (_, msg) => {
            try {
                const payload = JSON.parse(msg.toString());
                if (!variableName || payload.variable === variableName) {
                    resolve(payload.value);
                } else {
                    resolve(null);
                }
            } catch {
                resolve(null);
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
    subscribeToMQTT,
    publishToMQTT
};
