/**
 * SmartHub - AI powered Smart Home
 * Const Library Core (for Browser & Node.js)
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.5.0
 * @license MIT
 */

const LOG_URL = 'http://localhost:3000/log';
const TIMEZONE = 'GMT-5';

const constantsContent = { 
    LOG_URL, 
    TIMEZONE 
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = constantsContent;
} else {
    window.Jarvis = window.Jarvis || {};
    window.Jarvis.constant = constantsContent;
}
