/**
 * SmartHub - AI powered Smart Home
 * Web server which is logging all what happens inside the home 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.3
 * @license MIT
 */

const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const MQTT_BROKER_URL = 'ws://localhost:9001';
const MQTT_TOPIC = '#';
const LOG_FILE_PATH = path.join(__dirname, 'home.log');
const HTTP_PORT = 3131;

function getFormattedTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function logToFile(entry) {
  fs.appendFile(LOG_FILE_PATH, entry + '\n', (err) => {
    if (err) console.error('Failed to write to log:', err);
  });
}

// === MQTT Logging ===
const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on('connect', () => {
  console.log(`[${getFormattedTime()}] Connected to MQTT broker`);
  mqttClient.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error(`[${getFormattedTime()}] MQTT subscribe error:`, err);
    } else {
      console.log(`[${getFormattedTime()}] Subscribed to topic "${MQTT_TOPIC}"`);
    }
  });
});

mqttClient.on('message', (topic, message) => {
  const msg = message.toString();
  const logEntry = `[${getFormattedTime()}] [MQTT] ${topic}: ${msg}`;
  console.log(logEntry);
  logToFile(logEntry);
});

mqttClient.on('error', (err) => {
  console.error(`[${getFormattedTime()}] MQTT error:`, err);
});

// === Express App for LLM Logging ===
const app = express();
app.use(bodyParser.json());

// Log just the question via GET
app.get('/log', (req, res) => {
  const msg = req.query.msg;
  const time = getFormattedTime();

  if (!msg) {
    return res.status(400).send('Missing "msg" query parameter.');
  }

  const logEntry = `[${time}] [LLM] Q: ${msg}`;
  console.log(logEntry);
  logToFile(logEntry);
  res.send('Question logged');
});

// Optional: serve the log viewer
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/show', (req, res) => {
  fs.readFile(LOG_FILE_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading log file');
    const lines = data.trim().split('\n').slice(-1000);
    res.type('text/plain').send(lines.join('\n'));
  });
});

// Start server
app.listen(HTTP_PORT, () => {
  console.log(`[${getFormattedTime()}] LLM log server listening on http://localhost:${HTTP_PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  mqttClient.end();
  process.exit();
});
