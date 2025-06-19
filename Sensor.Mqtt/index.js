/**
 * SmartHub - AI powered Smart Home
 * App which reads values from one mqtt and write them to another MQTT to update home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.2
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const mqtt = require('../Shared/mqtt-node');
const configLoader = require('../Shared/config-node');  

const CONFIG = {
  configPath: path.join(__dirname, 'config.cfg')
};

let topicMappings = {};

function parseConfig() {
  const cfg = configLoader.loadConfig(CONFIG.configPath);

  const source = cfg.urls?.source || "mqtt://mqtt.jarvis.home:1883";
  const destination = cfg.urls?.destination || "mqtt://mqtt.jarvis.home:1883";

  const subscriptions = [];
  for (const topic in cfg.topics) {
    const mapping = cfg[topic];
    if (mapping) {
      subscriptions.push({ sourceTopic: topic, ...mapping });
      topicMappings[topic] = mapping;
    }
  }

  return { source, destination, subscriptions };
}

async function startForwarder() {
  const { subscriptions } = parseConfig();

  await mqtt.connectToMqtt();

  for (const { sourceTopic } of subscriptions) {
    await mqttClientSubscribe(sourceTopic);
  }

  mqtt.getClient().on('message', async (topic, message) => {
    try {
      const mapping = topicMappings[topic];
      if (!mapping) return;

      const json = JSON.parse(message.toString());

      // Safely extract value via dot-path (e.g., payload.value)
      let value = json;
      const pathParts = mapping.value.split(".");
      for (const part of pathParts) {
        if (value && value.hasOwnProperty(part)) {
          value = value[part];
        } else {
          value = null;
          break;
        }
      }

      if (value === null) return;

      const destTopic = mapping.topic;
      const varName = topic.split("/").pop(); // crude fallback if variable name not provided
      const script = path.basename(path.dirname(__filename));
      await mqtt.publishToMQTT(varName, destTopic, value, "sensor", script);

      console.log(`Forwarded ${value} from ${topic} to ${destTopic}`);
    } catch (err) {
      console.warn(`Error forwarding message from ${topic}:`, err.message);
    }
  });

  console.log("MQTT forwarding started.");
}

function mqttClientSubscribe(topic) {
  return new Promise((resolve, reject) => {
    mqtt.getClient().subscribe(topic, { qos: 0 }, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}:`, err.message);
        return reject(err);
      }
      console.log(`Subscribed to ${topic}`);
      resolve();
    });
  });
}

(async () => {
  try {
    await startForwarder();
  } catch (e) {
    console.error("Startup error:", e);
  }
})();
