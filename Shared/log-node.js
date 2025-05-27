/**
 * SmartHub - AI powered Smart Home
 * Log Node.js Wrapper 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.2
 * @license MIT
 */

// Log messages to browser console area (if available) or just the console
function logToConsole(message, type = 'info') {   
   console.log(message);
}

const logContent = { logToConsole }; 

module.exports = logContent;
