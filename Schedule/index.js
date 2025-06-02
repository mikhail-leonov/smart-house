/**
 * SmartHub - AI powered Smart Home
 * Crontab update from config file
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.7
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const ini = require('ini');
const { execSync } = require('child_process');

function updateCrontab(cfgFilePath, isRoot = false) {
  const raw = fs.readFileSync(cfgFilePath, 'utf-8');
  const config = ini.parse(raw);

  const newEntries = Object.values(config)
    .filter(entry => entry.schedule && entry.command)
    .map(entry => `${entry.schedule} ${entry.command}`);

  let currentCrontab = '';
  try {
    currentCrontab = execSync(isRoot ? 'sudo crontab -l' : 'crontab -l', { encoding: 'utf8' });
  } catch (err) {
    if (err.status !== 1) { throw err; }
  }

  const currentLines = currentCrontab.split('\n').filter(Boolean);
  const filtered = currentLines.filter(line =>
    !newEntries.some(entry => line.includes(entry.split(' ')[5]))
  );

  const combined = [...filtered, ...newEntries];
  const finalCrontab = combined.join('\n') + '\n';
  const tempFile = path.join(__dirname, `temp.${isRoot ? 'root' : 'user'}.crontab`);

  fs.writeFileSync(tempFile, finalCrontab);
  execSync(`${isRoot ? 'sudo ' : ''}crontab ${tempFile}`);
  fs.unlinkSync(tempFile);
}

// Update user crontab
updateCrontab(path.join(__dirname, 'config.cfg'), false);

// Update root crontab
updateCrontab(path.join(__dirname, 'root.cfg'), true);
