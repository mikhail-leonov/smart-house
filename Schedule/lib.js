/**
 * SmartHub - AI powered Smart Home
 * Lib for Crontab update from config file
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.2
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const ini = require('ini');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

const args = process.argv.slice(2);


// Parse arguments into an object
const params = {};
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, val] = arg.slice(2).split('=');
    params[key] = val === undefined ? true : val;
  }
});

const cfgFilePath = path.join(__dirname, 'config.cfg');

function getScheduleData(common) {

	let result = {};

	// Update user crontab
	updateCrontab(path.join(__dirname, 'schedule.user.cfg'), false);
	result['user'] = 1; 

	// Update root crontab
	updateCrontab(path.join(__dirname, 'schedule.root.cfg'), true);
	result['root'] = 1; 

	// test run all scripts
	result['test'] = 0; 
	const testFlag = params.test || false;
	if (testFlag) {
		handleTestFlag(path.join(__dirname, 'schedule.user.cfg'));
		result['test'] = 1; 
	}
	
	return [result];
}




function handleTestFlag(cfgFilePath) {

  const raw = fs.readFileSync(cfgFilePath, 'utf-8');
  const config = ini.parse(raw);

  const commands = Object.values(config)
    .filter(entry => entry.schedule && entry.command)
    .map(entry => entry.command);

  if (commands.length === 0) {
    return;
  }

  const results = [];

  commands.forEach((cmd, i) => {
    console.log(`\n[${i + 1}] Running: ${cmd}`);
    const start = performance.now();
    try {
      const output = execSync(cmd, { encoding: 'utf8' });
      const end = performance.now();
      const duration = Math.round(end - start);
      console.log(output.trim());

      results.push({ cmd, duration, success: true });
    } catch (err) {
      const end = performance.now();
      const duration = Math.round(end - start);
      console.error(`Error: ${err.message}`);
      results.push({ cmd, duration, success: false });
    }
  });

  console.log("\n=== Execution Report ===");
  results.forEach((r, i) => {
    const status = r.success ? 'OK' : 'ERROR';
    console.log(`[${i + 1}] ${r.cmd}`);
    console.log(`     Time: ${r.duration} ms | Status: ${status}`);
  });
}

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
  
  console.log(finalCrontab);  
}


module.exports = {
    getScheduleData
};

