/**
 * SmartHub - AI powered Smart Home
 * App which is running and wait for scene command and sending a bunch mqtt/web commands from config file 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.5
 * @license MIT
 */

const http = require('http');
const fs = require('fs');
const url = require('url');
const ini = require('ini');
const mqtt = require('mqtt');

const CONFIG_PATH = './index.cfg';
const MQTT_BROKER_URL = 'ws://localhost:9001';

// Connect to MQTT over WebSocket
const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker at', MQTT_BROKER_URL);
});

mqttClient.on('error', (err) => {
  console.error('MQTT error:', err.message);
});

function parseConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return ini.parse(raw);
}

function extractSceneValues(config, sceneName = null) {
  const active = config.entry;
  const result = [];

  for (const scene of Object.keys(active)) {
    if (active[scene] === '1' && config[scene]) {
      if (!sceneName || scene === sceneName) {
        for (const key in config[scene]) {
          result.push({ topic: key, value: config[scene][key] });
        }
      }
    }
  }

  return result;
}

function publishToMQTT(values) {
  values.forEach(({ topic, value }) => {
    console.log(topic, value);
    mqttClient.publish(topic, String(value), { qos: 1, retain: true }, (err) => {
      if (err) {
        console.error(`Publish error for ${topic}:`, err.message);
      } else {
        console.log(`Published: ${topic} = ${value}`);
      }
    });
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === 'GET' && parsedUrl.pathname === '/scene') {
    try {
      const config = parseConfig();
      const sceneParam = parsedUrl.query.s;
      const values = extractSceneValues(config, sceneParam);

      if (sceneParam && values.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Scene '${sceneParam}' not found or not active.` }));
        return;
      }
      // Send values over MQTT
      publishToMQTT(values);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(values, null, 2));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Scene server running at http://localhost:${PORT}`);
});
