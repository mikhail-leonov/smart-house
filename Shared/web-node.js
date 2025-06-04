/**
 * SmartHub - AI powered Smart Home
 * Web Node.js Wrapper 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.8
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
