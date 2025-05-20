/**
 * SmartHub - AI powered Smart Home
 * Sensor Node.js Wrapper 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.4.0
 * @license MIT
 */

const sensorCore = require('./sensor-core');

const sensorReady = new Promise((resolve) => {
    // If initialization or async loading is needed, add it here
    resolve(sensorCore);
});

module.exports = sensorReady;
