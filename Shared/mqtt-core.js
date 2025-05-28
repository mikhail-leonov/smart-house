/**
 * SmartHub - AI powered Smart Home
 * MQTT JS Library for any HTML App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.3
 * @license MIT
 */

let mqttBrokerUrl = "ws://localhost:9001";

const mqttTopic = "home";
let mqttClient = null;

function buildMqttTopic(l, f, r, v) {
    let topic = l;
    if (f) {
        topic += `/${f}`;
    }
    topic += `/${r}/${v}`;
    return "home/" + topic;
}

function connectToMqtt() {
    if (mqttClient && mqttClient.connected) return mqttClient;
    if (!mqttBrokerUrl) { return null; }

    mqttClient = connect(mqttBrokerUrl);

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

const mqttContent = {
    mqttClient,
    mqttTopic,
    buildMqttTopic,
    connectToMqtt,
    disconnectFromMQTT,
    publishToMQTT
};

window.Jarvis = window.Jarvis || {};
window.Jarvis.mqtt = mqttContent;
connectToMqtt();
window.addEventListener('load', connectToMqtt);
window.addEventListener('beforeunload', disconnectFromMQTT);

