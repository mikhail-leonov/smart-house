/**
 * SmartHub - AI powered Smart Home
 * Const Library Core (for Browser & Node.js)
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.4
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
