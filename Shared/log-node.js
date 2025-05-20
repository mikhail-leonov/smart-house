/**
 * SmartHub - AI powered Smart Home
 * Log Node.js Wrapper 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.4.0
 * @license MIT
 */

const logCore = require('./log-core');

const logReady = new Promise((resolve) => {
    // Log module is sync — nothing async to wait for
    resolve(logCore);
});

module.exports = logReady;
