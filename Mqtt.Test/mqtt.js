/**
 * SmartHub - AI powered Smart Home
 * test mqtt for node.js
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

const mqtt = require('mqtt');

const mqttUrl = "ws://mqtt.jarvis.home:9001";
const mqttPath = "#";

const client = mqtt.connect(mqttUrl);

const lastValues = {}; // Stores previous values to detect changes

client.on('connect', () => {
    console.log("Connected to MQTT broker");
    client.subscribe(mqttPath, (err) => {
        if (err) {
            console.error("Failed to subscribe:", err);
        } else {
            console.log(`Subscribed to topic: ${mqttPath}`);
        }
    });
});

client.on('message', (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        const pathParts = topic.split('/');

        const [home, location, floor, room, sensor] = pathParts;

        if (!(location && floor && room && sensor)) {
            console.warn(`Unrecognized topic format: ${topic}`);
            return;
        }

        const value = payload.value;
        const key = `${location}/${floor}/${room}/${sensor}`;
        const last = lastValues[key];

        if (last === value) {
            console.log(`${key}: no change (${value})`);
        } else {
            lastValues[key] = value;
            console.log(`${key}: ${last} -> ${value}`);
        }

    } catch (err) {
        console.error("Error processing message:", err);
    }
});
