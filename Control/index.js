/**
 * SmartHub - AI powered Smart Home
 * Web server which is waiting commands vide /coomand enpoint and execute them 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.4.0
 * @license MIT
 */

const express = require('express');
const mqtt = require('mqtt');
const axios = require('axios'); // For HTTP requests
const WebSocket = require('ws'); // For WebSocket connections
const { exec } = require('child_process'); // For shell commands
const app = express();
const PORT = 8080;
const HOST = "http://localhost";

// Middleware to parse JSON bodies
app.use(express.json());

// MQTT Configuration
const MQTT_BROKER = 'mqtt://localhost'; // Change to your broker address if needed
const mqttClient = mqtt.connect(MQTT_BROKER);
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
});

// WebSocket client connections storage
const wsConnections = {};

// Protocol handler functions
const protocolHandlers = {
    mqtt: (command, callback) => {
        const payload = JSON.stringify(command.payload);
        mqttClient.publish(command.topic, payload, {}, (err) => {
            if (err) {
                console.error('MQTT publish error:', err.message);
                return callback(err);
            }
            console.log(`MQTT command executed: ${command.topic} => ${payload}`);
            callback(null, `MQTT command sent to ${command.topic}`);
        });
    },
    
    http: (command, callback) => {
        const method = command.method?.toLowerCase() || 'get';
        const options = {
            url: command.url,
            method: method,
            ...(command.headers && { headers: command.headers }),
            ...(method !== 'get' && command.data && { data: command.data })
        };
        
        axios(options)
            .then(response => {
                console.log(`HTTP ${method} request successful: ${command.url}`);
                callback(null, `HTTP ${method} request completed with status ${response.status}`);
            })
            .catch(error => {
                console.error('HTTP request failed:', error.message);
                callback(error);
            });
    },
    
    websocket: (command, callback) => {
        // Connect to WebSocket if not already connected
        if (!wsConnections[command.url]) {
            try {
                const ws = new WebSocket(command.url);
                
                ws.on('open', () => {
                    console.log(`WebSocket connected: ${command.url}`);
                    wsConnections[command.url] = ws;
                    
                    // Send the message
                    ws.send(JSON.stringify(command.message));
                    console.log(`WebSocket message sent to ${command.url}`);
                    callback(null, `WebSocket message sent`);
                });
                
                ws.on('error', (err) => {
                    console.error(`WebSocket connection error: ${err.message}`);
                    delete wsConnections[command.url];
                    callback(err);
                });
                
                ws.on('close', () => {
                    console.log(`WebSocket connection closed: ${command.url}`);
                    delete wsConnections[command.url];
                });
            } catch (err) {
                console.error(`WebSocket setup error: ${err.message}`);
                callback(err);
            }
        } else {
            // Use existing connection
            try {
                wsConnections[command.url].send(JSON.stringify(command.message));
                console.log(`WebSocket message sent to ${command.url}`);
                callback(null, `WebSocket message sent`);
            } catch (err) {
                console.error(`WebSocket send error: ${err.message}`);
                delete wsConnections[command.url];
                callback(err);
            }
        }
    },
    
    shell: (command, callback) => {
        if (!command.cmd) {
            return callback(new Error('No shell command provided'));
        }
        
        exec(command.cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Shell command error: ${error.message}`);
                return callback(error);
            }
            if (stderr) {
                console.warn(`Shell command stderr: ${stderr}`);
            }
            console.log(`Shell command executed: ${command.cmd}`);
            callback(null, `Shell command executed: ${stdout}`);
        });
    }
};

// Command mapping: define your commands and their protocols
const commandMap = {
    // MQTT commands (original)
    light_on: {
        protocol: 'mqtt',
        topic: 'zigbee2mqtt/livingroom_light/set',
        payload: {
            state: 'ON'
        }
    },
    light_off: {
        protocol: 'mqtt',
        topic: 'zigbee2mqtt/livingroom_light/set',
        payload: {
            state: 'OFF'
        }
    },
    heater_on: {
        protocol: 'mqtt',
        topic: 'zigbee2mqtt/heater_plug/set',
        payload: {
            state: 'ON'
        }
    },
    heater_off: {
        protocol: 'mqtt',
        topic: 'zigbee2mqtt/heater_plug/set',
        payload: {
            state: 'OFF'
        }
    },
    toggle_desk: {
        protocol: 'mqtt',
        topic: 'zigbee2mqtt/desk_light/set',
        payload: {
            toggle: true
        }
    },
    
    // HTTP commands (examples)
    tv_power: {
        protocol: 'http',
        method: 'post',
        url: 'http://192.168.1.100:8080/api/power',
        data: { power: 'toggle' }
    },
    get_temp: {
        protocol: 'http',
        method: 'get',
        url: 'http://192.168.1.101/api/temperature'
    },
    
    // WebSocket commands (examples)
    speaker_play: {
        protocol: 'websocket',
        url: 'ws://192.168.1.102:8089',
        message: { action: 'play', source: 'spotify' }
    },
    
    // Shell commands (examples)
    system_reboot: {
        protocol: 'shell',
        cmd: 'sudo reboot'
    },
    network_scan: {
        protocol: 'shell',
        cmd: 'nmap -sP 192.168.1.0/24'
    }
};

// Route to handle commands
app.get('/command', (req, res) => {
    const command = req.query.c;
    if (!command) {
        return res.status(400).send('Missing c=COMMAND parameter');
    }
    
    const cmd = commandMap[command];
    if (!cmd) {
        return res.status(404).send(`Unknown command: ${command}`);
    }
    
    const protocol = cmd.protocol || 'mqtt'; // Default to mqtt for backward compatibility
    
    if (!protocolHandlers[protocol]) {
        return res.status(500).send(`Unsupported protocol: ${protocol}`);
    }
    
    protocolHandlers[protocol](cmd, (err, result) => {
        if (err) {
            console.error(`${protocol} command error:`, err.message);
            return res.status(500).send(`Command execution failed: ${err.message}`);
        }
        res.send(`Command '${command}' executed: ${result}`);
    });
});

// API to add new commands dynamically
app.post('/commands', (req, res) => {
    const { name, configuration } = req.body;
    
    if (!name || !configuration || !configuration.protocol) {
        return res.status(400).send('Missing required parameters: name, configuration with protocol');
    }
    
    // Validate that the protocol is supported
    if (!protocolHandlers[configuration.protocol]) {
        return res.status(400).send(`Unsupported protocol: ${configuration.protocol}`);
    }
    
    // Add the new command
    commandMap[name] = configuration;
    res.status(201).send(`Command '${name}' added successfully`);
});

// API to list all available commands
app.get('/commands', (req, res) => {
    const commandList = Object.keys(commandMap).map(key => ({
        name: key,
        protocol: commandMap[key].protocol || 'mqtt'
    }));
    
    res.json(commandList);
});

// API to delete commands
app.delete('/commands/:name', (req, res) => {
    const { name } = req.params;
    
    if (!commandMap[name]) {
        return res.status(404).send(`Command '${name}' not found`);
    }
    
    delete commandMap[name];
    res.send(`Command '${name}' deleted successfully`);
});

// Clean up WebSocket connections on server close
process.on('SIGINT', () => {
    console.log('Closing WebSocket connections...');
    Object.values(wsConnections).forEach(ws => {
        try {
            ws.close();
        } catch (e) {
            // Ignore errors during cleanup
        }
    });
    process.exit(0);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Enhanced Smart Home Command Server running at ${HOST}:${PORT}`);
    console.log(`Supported protocols: ${Object.keys(protocolHandlers).join(', ')}`);
});