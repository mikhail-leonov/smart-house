/**
 * SmartHub Jarvis - AI powered Smart Home
 * Location Node.js Wrapper
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.4.0
 * @license MIT
 */

const locationCore = require('./location-core');

const locationReady = new Promise((resolve) => {
    resolve(locationCore);
});

module.exports = locationReady;
