/**
 * SmartHub - AI powered Smart Home
 * Crontab update from config file
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.4
 * @license MIT
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Load config
const configPath = path.join(__dirname, 'cron-config.json');
let entries;

try {
  const raw = fs.readFileSync(configPath);
  entries = JSON.parse(raw);
} catch (err) {
  console.error('Failed to load or parse cron-config.json:', err);
  process.exit(1);
}

// Read current crontab
let currentCrontab = '';
try {
  currentCrontab = execSync('crontab -l', { encoding: 'utf8' });
} catch (err) {
  if (err.status !== 1) { // 1 means "no crontab for this user", that's fine
    console.error('Error reading crontab:', err);
    process.exit(1);
  }
}

const newEntries = entries.map(e => `${e.schedule} ${e.command}`);
const lines = currentCrontab.split('\n').filter(Boolean);

// Filter out existing lines that match any of the new commands
const filtered = lines.filter(line => {
  return !newEntries.some(entry => line.includes(entry.split(' ')[5]));
});

// Combine and deduplicate
const combined = [...filtered, ...newEntries];

// Write back to crontab
try {
  const finalCrontab = combined.join('\n') + '\n';
  const tempFile = path.join(__dirname, 'temp.crontab');

  fs.writeFileSync(tempFile, finalCrontab);
  execSync(`crontab ${tempFile}`);
  fs.unlinkSync(tempFile);

  console.log('Crontab updated successfully.');
} catch (err) {
  console.error('Failed to update crontab:', err);
  process.exit(1);
}
