/**
 * SmartHub - AI powered Smart Home
 * Web Library for any App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.4.0
 * @license MIT
 */




const content = {
    // Define your shared functions or state here
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    // Node.js
    module.exports = content;
} else {
    // Browser
    window.Jarvis = window.Jarvis || {};
    window.Jarvis.web = content;
}
