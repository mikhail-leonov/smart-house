/**
 * SmartHub - AI powered Smart Home
 * Command Node.js Wrapper
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.4
 * @license MIT
 */

const http = require('http');
const querystring = require('querystring');

function execCommand(command) {
  return new Promise((resolve, reject) => {
    if (!command) {
      return reject(new Error('Command is required'));
    }

    const query = querystring.stringify({ c: command });
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/command?' + query,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Command failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', err => reject(err));
    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timed out'));
    });

    req.end();
  });
}

const contentCommand = { execCommand };

module.exports = contentCommand;
