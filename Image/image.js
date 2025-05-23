/**
 * SmartHub - AI powered Smart Home
 * App which reads images from a folder, detects objects, and sends MQTT messages
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.5.1
 * @license MIT
 */

const lib = require('./image-lib'); 
const path = require('path');
const fs = require('fs/promises');
const config = require('../Shared/config-node');
const mqtt = require('../Shared/mqtt-node');

const CONFIG = {
  scanInterval: 5 * 60 * 1000,
  configPath: path.join(__dirname, 'image.cfg'),
  imageDir: path.join(__dirname, 'images')
};

async function scan() {
  console.log("Scan started");
  const cfg = config.loadConfig(CONFIG.configPath);

  try {
    const files = await fs.readdir(CONFIG.imageDir);
    const imageFiles = files.filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'));

    if (imageFiles.length === 0) {
      console.log("No images to process.");
      return; // Exit early
    }

    for (const filename of imageFiles) {
      const filePath = path.join(CONFIG.imageDir, filename);

      try {
        const obj = await lib.getImageObjects(filePath);  // Must return { varName: value }

        if (typeof obj === 'object' && obj !== null) {
          for (const [varName, varValue] of Object.entries(obj)) {
            const section = cfg[varName];

            if (!section) {
              console.log(` - Section ${varName} missing in config.`);
              continue;
            }

            let topics = [];

            if (typeof section["mqttTopics"] === 'string') {
              topics = section["mqttTopics"].split(',').map(t => t.trim()).filter(t => t.length > 0);
            } else if (Array.isArray(section["mqttTopics"])) {
              topics = section["mqttTopics"].map(t => t.trim()).filter(t => t.length > 0);
            }

            for (const topic of topics) {
              await mqtt.publishToMQTT(varName, topic, varValue, "web");
              console.log(` - publishToMQTT(${varName}, ${topic}, ${varValue}, "web")`);
            }
          }
        }

        await fs.unlink(filePath).catch(err => {
          console.warn(`Could not delete ${filePath}: ${err.message}`);
        });

      } catch (err) {
        console.error(`Error processing ${filename}:`, err);
      }
    }

  } catch (err) {
    console.error('Error during scan:', err);
  }
}

async function main() {
  await scan();
  console.log("Scan done");
}

main();
