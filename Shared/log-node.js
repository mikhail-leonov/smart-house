/**
 * SmartHub - AI powered Smart Home
 * Log Node.js Wrapper 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.5.0
 * @license MIT
 */

// Log messages to browser console area (if available) or just the console
function logToConsole(message, type = 'info') {   
   console.log(message);
}

const logContent = { logToConsole }; 

module.exports = logContent;
