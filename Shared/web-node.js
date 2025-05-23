/**
 * SmartHub - AI powered Smart Home
 * Web Node.js Wrapper 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.5.0
 * @license MIT
 */

function pause(seconds) {
  const start = Date.now();
  while (Date.now() - start < 1000 * seconds) {
    // Do nothing, just block
  }
}

const webContent = { pause };

module.exports = webContent;
