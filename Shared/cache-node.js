/**
 * SmartHub - AI powered Smart Home
 * Cache Node.js Wrapper 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.4.0
 * @license MIT
 */

const cacheCore = require('./cache-core');

const cacheReady = new Promise((resolve) => {
    resolve(cacheCore);
});

module.exports = cacheReady;
