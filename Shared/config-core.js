/**
 * SmartHub - AI powered Smart Home
 * Config Library for any App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.4.0
 * @license MIT
 */

function loadConfig(filePath) {
    alert("Cannot be implemented");
}

configContent = { loadConfig };

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = configContent;
} else {
    window.Jarvis = window.Jarvis || {};
    window.Jarvis.config = configContent;
}
