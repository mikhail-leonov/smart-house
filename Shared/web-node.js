/**
 * SmartHub - AI powered Smart Home
 * Web Node.js Wrapper 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.4.0
 * @license MIT
 */





const webCore = require('./web-core');

const webReady = new Promise((resolve) => {
    // If there's async logic to run before it's ready, put it here.
    // For now, just resolve immediately with the module
    resolve(webCore);
});

module.exports = webReady;
