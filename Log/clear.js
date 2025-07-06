/**
 * SmartHub - Log Cleaner
 * Removes all entries in the log file older than 7 days
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.4
 * @license MIT
 */

return;

const fs = require('fs');
const path = require('path');

const LOG_FILE_PATH = path.join(__dirname, 'home.log');
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getFormattedTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function cleanOldLogs() {
  const cutoff = Date.now() - ONE_WEEK_MS;

  fs.readFile(LOG_FILE_PATH, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.log('No log file found � nothing to clean.');
        return;
      }
      console.error('Error reading log file:', err);
      return;
    }

    const lines = data.trim().split('\n');
    const keptLines = lines.filter(line => {
      const match = line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})]/);
      if (!match) return true; // Keep lines that don't match date pattern
      const time = new Date(match[1]).getTime();
      return isNaN(time) || time >= cutoff;
    });

    fs.writeFile(LOG_FILE_PATH, keptLines.join('\n') + '\n', 'utf8', (err) => {
      if (err) {
        console.error('Error writing cleaned log file:', err);
      } else {
        console.log(`[${getFormattedTime()}] Old log entries cleaned. Remaining lines: ${keptLines.length}`);
      }
    });
  });
}

cleanOldLogs();
