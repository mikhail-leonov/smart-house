/**
 * SmartHub - AI powered Smart Home
 * Const Node.js Wrapper
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.4.0
 * @license MIT
 */

const constantCore = require('./constant-core');

const constantReady = new Promise((resolve) => {
    resolve(constantCore);
});

module.exports = constantReady;
