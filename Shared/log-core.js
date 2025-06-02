/**
 * SmartHub - AI powered Smart Home
 * Log Library for any App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.6
 * @license MIT
 */

// Log messages to browser console area (if available) or just the console
function logToConsole(message, type = 'info') {
    try {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const logEntry = `[${timeString}] ${message}`;

        // Browser UI console div logging
        if (typeof document !== 'undefined' && typeof logDiv !== 'undefined' && logDiv) {
            const entryDiv = document.createElement('div');
            entryDiv.textContent = logEntry;

            if (type === 'error') {
                entryDiv.style.color = '#dc3545';
            } else if (type === 'success') {
                entryDiv.style.color = '#28a745';
            }

            logDiv.appendChild(entryDiv);
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        // Fallback to regular console log
        if (type === 'error') {
            console.error(logEntry);
        } else {
            console.log(logEntry);
        }

    } catch (error) {
        console.log(message);
    }
}

const logContent = {
    logToConsole
};

window.Jarvis = window.Jarvis || {};
window.Jarvis.log = logContent;
