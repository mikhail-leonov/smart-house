/**
 * SmartHub - AI powered Smart Home
 * Web server which is logging all what happens inside the home 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.1
 * @license MIT
 */

const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const MQTT_BROKER_URL = 'ws://mqtt.jarvis.home:9001';
const MQTT_TOPIC = '#';
const LOG_FILE_PATH = path.join(__dirname, 'home.log');
const LOCK_FILE_PATH = path.join(__dirname, 'home.lock');
const HTTP_PORT = 3131;

const LOCK_RETRY_INTERVAL = 1000; // ms
const LOCK_MAX_RETRIES = 30; // max attempts

// === Memory log buffer ===
const LOG_BUFFER_LIMIT = 200;
let logBuffer = [];



return;




function getFormattedTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function flushLogBuffer() {
  if (logBuffer.length === 0) return;

  const tryWrite = (retries = 0) => {
    if (fs.existsSync(LOCK_FILE_PATH)) {
      if (retries >= LOCK_MAX_RETRIES) {
        console.error(`[${getFormattedTime()}] Log lock held too long. Skipping log write.`);
        return;
      }
      return setTimeout(() => tryWrite(retries + 1), LOCK_RETRY_INTERVAL);
    }

    // Acquire lock
    try {
      fs.writeFileSync(LOCK_FILE_PATH, process.pid.toString());

      const combined = logBuffer.join('\n') + '\n';
      fs.appendFile(LOG_FILE_PATH, combined, (err) => {
        if (err) {
          console.error(`[${getFormattedTime()}] Failed to write to log file:`, err);
        }

        // Release lock
        fs.unlink(LOCK_FILE_PATH, (err) => {
          if (err) console.error('Error removing lock file:', err);
        });
      });

      logBuffer = [];
    } catch (e) {
      console.error(`[${getFormattedTime()}] Error during locked log write:`, e);
      if (fs.existsSync(LOCK_FILE_PATH)) {
        try { fs.unlinkSync(LOCK_FILE_PATH); } catch (_) {}
      }
    }
  };

  tryWrite();
}

function log(entry) {
  logBuffer.push(entry);
  if (logBuffer.length >= LOG_BUFFER_LIMIT) flushLogBuffer();
}

// === MQTT Logging ===
const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on('connect', () => {
  const entry = `[${getFormattedTime()}] Connected to MQTT broker`;
  console.log(entry);
  log(entry);

  mqttClient.subscribe(MQTT_TOPIC, (err) => {
    const msg = err
      ? `[${getFormattedTime()}] MQTT subscribe error: ${err}`
      : `[${getFormattedTime()}] Subscribed to topic "${MQTT_TOPIC}"`;
    console.log(msg);
    log(msg);
  });
});

mqttClient.on('message', (topic, message) => {
  const msg = message.toString();
  const logEntry = `[${getFormattedTime()}] [MQTT] ${topic}: ${msg}`;
  console.log(logEntry);
  log(logEntry);
});

mqttClient.on('error', (err) => {
  const errorEntry = `[${getFormattedTime()}] MQTT error: ${err}`;
  console.error(errorEntry);
  log(errorEntry);
});

// === Express App for LLM Logging ===
const app = express();
app.use(bodyParser.json());

app.get('/log', (req, res) => {
  const msg = req.query.msg;
  const time = getFormattedTime();

  if (!msg) {
    return res.status(400).send('Missing "msg" query parameter.');
  }

  const logEntry = `[${time}] [LLM] Q: ${msg}`;
  console.log(logEntry);
  log(logEntry);
  res.send('Question logged');
});

// Optional: serve the log viewer
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/show', (req, res) => {
  fs.readFile(LOG_FILE_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading log file');
    const lines = data.trim().split('\n').reverse().slice(-1000);
    res.type('text/plain').send(lines.join('\n'));
  });
});

// Start server
app.listen(HTTP_PORT, () => {
  const startMsg = `[${getFormattedTime()}] Log server listening on http://log.jarvis.home:${HTTP_PORT}`;
  console.log(startMsg);
  log(startMsg);
});

// Graceful shutdown: flush anything left in memory
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  flushLogBuffer();
  mqttClient.end();
  process.exit();
});
