/**
 * SmartHub - AI powered Smart Home
 * MQTT JS Library for any HTML App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.4.0
 * @license MIT
 */

let mqtt = null;

if (typeof window !== 'undefined') {
    mqtt = window.mqtt;
} else {
    try {
        mqtt = require('mqtt');
    } catch (e) {
        console.error("MQTT module not found. Please run 'npm install mqtt'");
    }
}

const mqttBrokerUrl = "mqtt://localhost:1883";
const mqttTopic = "home";
let mqttClient = null;

function connectToMqtt() {
    if (mqttClient && mqttClient.connected) return mqttClient;
    if (!mqttBrokerUrl) { return null; }

    mqttClient = mqtt.connect(mqttBrokerUrl);

    mqttClient.on('connect', () => {
        console.log("MQTT connected");
    });
    mqttClient.on('error', (err) => {
        console.log("MQTT connection error:", err.message);
    });
    mqttClient.on('close', () => {
        console.log("MQTT disconnected");
    });
    return mqttClient;
}

function disconnectFromMQTT() {
    if (mqttClient && mqttClient.connected) {
        mqttClient.end();
    }
}

function publishToMQTT(variable, topic, value, type) {
    if (mqttClient) {
        if (mqttClient.connected) {
            mqttClient.publish(topic, JSON.stringify({ value, type, timestamp: new Date().toISOString() }), { retain: true });
        } else {
            console.warn(`Cannot publish to MQTT ${mqttClient.connected}.`);
        }
    } else {
        console.warn(`Cannot publish to MQTT ${mqttClient}.`);
    }
}

const mqttLib = {
    mqttClient: () => mqttClient,
    mqttBrokerUrl,
    mqttTopic,
    connectToMqtt,
    disconnectFromMQTT,
    publishToMQTT
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = mqttLib;
} else {
    window.Jarvis = window.Jarvis || {};
    window.Jarvis.mqtt = mqttLib;
    window.addEventListener('load', connectToMqtt);
    window.addEventListener('beforeunload', disconnectMQTT);
}
