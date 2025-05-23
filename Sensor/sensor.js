/**
 * SmartHub - AI powered Smart Home
 * App which is reads values from sensors and send them to MQTT to update a home state
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.4.0
 * @license MIT
 */

const lib = require('./sensor-lib'); 
const path = require('path');
const fs = require('fs');
const config = require('../Shared/config-node');
const mqtt = require('../Shared/mqtt-node');
const web = require('../Shared/web-node');
const cache = require('../Shared/cache-node');


const CONFIG = {
  scanInterval: 5 * 60 * 1000,
  configPath: path.join(__dirname, 'sensor.cfg')
};

function pause(seconds) {
  const start = Date.now();
  while (Date.now() - start < 1000 * seconds) {
    // Do nothing, just block
  }
}

function scan() {

    console.log("Scan started");

    const cfg = config.loadConfig(CONFIG.configPath);
    try {
        const entry = cfg['entry'];
        for (const [key, value] of Object.entries(entry)) {
            if (String(value).trim() == "1" ) {
                if (typeof lib[key] === 'function') {
                    const obj = lib[key]();
                    if (typeof obj === 'object') {
                        for (const [varName, varValue] of Object.entries(obj)) {
                            const section = cfg[varName];
                            // Check if variable is enabled = 1 in its parent section (e.g., getAirData)
                            const parentSection = cfg[key];
                            const isEnabled = parentSection && String(parentSection[varName]).trim() == '1';
                            if (section && isEnabled) {
                                let topics = [];

                                if (typeof section["mqttTopics"] === 'string') {
                                    topics = section["mqttTopics"].split(',').map(t => t.trim()).filter(t => t.length > 0);
                                } else if (Array.isArray(section["mqttTopics"])) {
                                    topics = section["mqttTopics"].map(t => t.trim()).filter(t => t.length > 0);
                                }
                                topics.forEach(topic => {
                                    mqtt.publishToMQTT(varName, topic, varValue, "sensor");
        			    console.log(` - publishToMQTT(${varName}, ${topic}, ${varValue}, "web")`);
                                    pause(1);
                                });
                            } else {
        			    console.log(` - ${varName} = 0`);
                            }
                        }
                    }
                }
            }
        }

    } catch (err) {
        console.error('Error during scan:', err);
    }
    console.log("Scan done");
}


(async () => { scan(); })();
