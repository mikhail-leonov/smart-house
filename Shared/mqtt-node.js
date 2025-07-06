/**
 * SmartHub - AI powered Smart Home
 * MQTT Node.JS Library (Async Version)
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.4
 * @license MIT
 */

const mqtt = require('mqtt');
const mqttBrokerUrl = "mqtt://mqtt.jarvis.home:1883";
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
function connectToMqtt(mqttUrl = "") {
    console.log(` - mqtt.connectToMqtt()`);
    if (mqttConnected) { return Promise.resolve(); }
    if (connectionPromise) { return connectionPromise; }

    connectionPromise = new Promise((resolve, reject) => {
        mqttClient = mqtt.connect(mqttUrl || mqttBrokerUrl);

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
async function publishToMQTT(variable, topic, value, type, script) {

    variable = variable.toLowerCase();
    topic = topic.toLowerCase();
    type = type.toLowerCase();
	if (!script) { script = "Undefined"; } 
	script = script.toLowerCase();
		
    console.log(`       - mqtt.publishToMQTT(${variable}, ${topic}, ${value}, ${type}, ${script})`);
    if (!mqttConnected) {
        try {
            await connectToMqtt();
        } catch (err) {
            console.warn("MQTT connection failed.");
            return;
        }
    }
    const payload = JSON.stringify({ 
		variable, 
		value, 
		type, 
		timestamp: new Date().toISOString(),
		script
	});

    return new Promise((resolve, reject) => {
        mqttClient.publish(topic, payload, { retain: true }, (err) => {
            if (err) {
                console.error("         - mqtt publish failed:", err.message);
                reject(err);
            } else {
                console.error("         - mqtt published succesfully");
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

function getClient() {
    return mqttClient;
}

// Export async API
module.exports = {
    mqttTopic,
    buildMqttTopic,
    getClient,
    connectToMqtt,
    disconnectFromMQTT,
    subscribeToMQTT,
    publishToMQTT
};
