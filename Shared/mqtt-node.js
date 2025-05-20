/**
 * SmartHub - AI powered Smart Home
 * MQTT Node.JS Library for any mode.js App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.4.0
 * @license MIT
 */

/**
 * SmartHub - AI powered Smart Home
 * MQTT Node.JS Library for any node.js App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.4.0
 * @license MIT
 */

const mqttCore = require('./mqtt-core');

const mqttReady = new Promise((resolve, reject) => {
    const client = mqttCore.connectToMqtt();
    if (!client) {
        return reject(new Error("MQTT client could not be initialized"));
    }

    client.on('connect', () => {
        console.log("MQTT ready in Node wrapper");
        resolve(mqttCore);
    });

    client.on('error', (err) => {
        console.error("MQTT connection error in wrapper:", err.message);
        reject(err);
    });
});

module.exports = mqttReady;

