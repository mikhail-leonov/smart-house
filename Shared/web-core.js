/**
 * SmartHub - AI powered Smart Home
 * Web Library for any App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.4.0
 * @license MIT
 */

function pause(seconds) {
  const start = Date.now();
  while (Date.now() - start < 1000 * seconds) {
    // Do nothing, just block
  }
}


const webContent = {
    pause
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    // Node.js
    module.exports = webContent;
} else {
    // Browser
    window.Jarvis = window.Jarvis || {};
    window.Jarvis.web = webContent;
}
