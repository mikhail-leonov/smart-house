/**
 * SmartHub - AI powered Smart Home
 * Web Library for any App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.1
 * @license MIT
 */

function pause(seconds) {
  const start = Date.now();
  while (Date.now() - start < 1000 * seconds) {
    // Do nothing, just block
  }
}

const webContent = { pause };

window.Jarvis = window.Jarvis || {};
window.Jarvis.web = webContent;
