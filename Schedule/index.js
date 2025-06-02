/**
 * SmartHub - AI powered Smart Home
 * Crontab update from config file
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.6
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const ini = require('ini');
const { execSync } = require('child_process');


// Load config
const CONFIG_PATH = path.join(__dirname, 'config.cfg');

let config;
try {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  config = ini.parse(raw);
} catch (err) {
  console.error("Failed to read config file:", err.message);
  process.exit(1);
}

// Convert config sections into cron entries
const newEntries = Object.values(config).map(entry => {
  if (!entry.schedule || !entry.command) {
    console.warn('Skipping invalid entry (missing schedule or command):', entry);
    return null;
  }
  return `${entry.schedule} ${entry.command}`;
}).filter(Boolean);

// Read current crontab
let currentCrontab = '';
try {
  currentCrontab = execSync('crontab -l', { encoding: 'utf8' });
} catch (err) {
  if (err.status !== 1) {
    console.error('Error reading crontab:', err);
    process.exit(1);
  }
}

const currentLines = currentCrontab.split('\n').filter(Boolean);

// Filter out lines that match new commands to avoid duplicates
const filtered = currentLines.filter(line => {
  return !newEntries.some(entry => line.includes(entry.split(' ')[5]));
});

// Combine old and new entries
const combined = [...filtered, ...newEntries];

// Write updated crontab to system
try {
  const finalCrontab = combined.join('\n') + '\n';
  const tempFile = path.join(__dirname, 'temp.crontab');

  fs.writeFileSync(tempFile, finalCrontab);
  execSync(`crontab ${tempFile}`);
  fs.unlinkSync(tempFile);


try {
  currentCrontab = execSync('crontab -l', { encoding: 'utf8' });
  console.log(currentCrontab);
} catch (err) {
  if (err.status !== 1) {
    console.error('Error reading crontab:', err);
    process.exit(1);
  }
}


  console.log('Crontab updated successfully!');
} catch (err) {
  console.error('Failed to update crontab:', err);
  process.exit(1);
}
