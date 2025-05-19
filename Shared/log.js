        // Log messages to console div
        function logToConsole(message, type = 'info') {
            try {
                const now = new Date();
                const timeString = now.toLocaleTimeString();
                
                const logEntry = document.createElement('div');
                logEntry.textContent = `[${timeString}] ${message}`;
                
                if (type === 'error') {
                    logEntry.style.color = '#dc3545';
                } else if (type === 'success') {
                    logEntry.style.color = '#28a745';
                }
                if (typeof logDiv !== 'undefined') {
                    if (logDiv) {
                       logDiv.appendChild(logEntry);
                       logDiv.scrollTop = logDiv.scrollHeight;
                    }
                }
            } catch (error) {
                console.error('Error logging to console:', error);
            }
        }
