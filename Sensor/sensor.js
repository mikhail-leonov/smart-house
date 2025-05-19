const mqtt = require('mqtt');
const path = require('path');
const fs = require('fs');
const lib = require('./sensor-lib'); 

function loadConfig(filePath) {

  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.split('\n');
  const config = {};
  let section = null;
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      section = line.slice(1, -1);
      config[section] = {};
    } else if (section) {
      const idx = line.indexOf('=');
      if (idx !== -1) {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        config[section][key] = value;
      }
    }
  }
  return config;
}


const CONFIG = {
  mqttBroker: 'mqtt://localhost:1883',
  scanInterval: 5 * 60 * 1000,
  configPath: path.join(__dirname, 'web.cfg')
};

const mqttClient = mqtt.connect(CONFIG.mqttBroker);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
});

function publishVariable(variable, topic, value) {
    console.log(' - - - - Submit: ' + topic + ' = ' + value );
    mqttClient.publish(topic, JSON.stringify({
      value: value, 
      type: "Sensor",
      timestamp: new Date().toISOString()
    }), { retain: true });
}

function scan() {
  const config = loadConfig(CONFIG.configPath);
  try {

    const entry = config['entry'];
    for (const [key, value] of Object.entries(entry)) {
        if (value == 1 ) { 
            if (typeof lib[key] === 'function') {
               let obj = lib[key]();  
               if (typeof obj === 'object') {
                   for (const [varName, varValue] of Object.entries(obj)) {
                      console.log(' - ' + varName );
                      const section = config[varName];
                      if (section) {

                         let topics = [];

                         if (typeof section["mqttTopics"] === 'string') {
                             topics = section["mqttTopics"].split(',').map(t => t.trim()).filter(t => t.length > 0);
                         } else if (Array.isArray(section["mqttTopics"])) {
                             topics = section["mqttTopics"].map(t => t.trim()).filter(t => t.length > 0);
                         }

                         topics.forEach(topic => { 
                            topic = topic.trim();
                            console.log(' - - ' + topic );
                            publishVariable(varName, topic, varValue);
                         }); 
                      }
                   }
               } 
            }
        }
    }

  } catch (err) {
    console.error('Error during scan:', err);
  }
}

function main() {
  scan();
  setInterval(scan, CONFIG.scanInterval);
}

main();
