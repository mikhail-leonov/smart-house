/**
 * SmartHub - AI powered Smart Home
 * Web server which is waiting commands via /command endpoint and executes them
 * GitHub: https://github.com/mikhail-leonov/smart-house
 *
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.3
 * @license MIT
 */

const express = require('express');
const mqtt = require('mqtt');
const axios = require('axios');
const WebSocket = require('ws');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8090;
const HOST = "http://mqtt.jarvis.home";

// Load command map from external JSON file
const commandMapPath = path.join(__dirname, 'commands.json');
let commandMap = {};

try {
    commandMap = JSON.parse(fs.readFileSync(commandMapPath, 'utf-8'));
    console.log('Command map loaded from JSON file.');
} catch (err) {
    console.error('Failed to load command map:', err.message);
    process.exit(1);
}

app.use(express.json());

// MQTT configuration
const MQTT_BROKER = "mqtt://mqtt.jarvis.home:1883";
const mqttClient = mqtt.connect(MQTT_BROKER);
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
});

// WebSocket connection store
const wsConnections = {};

// Bootstrap HTML rendering helper
function renderHTML(title, alertType, content) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f8f9fa; }
        .container { max-width: 700px; margin-top: 50px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="alert alert-${alertType}">
            <h2>${title}</h2>
            <pre>${content}</pre>
            <hr>
            <a href="/commands" class="btn btn-outline-secondary">View All Commands</a>
        </div>
    </div>
</body>
</html>`;
}

// Protocol handlers
const protocolHandlers = {
    mqtt: (command, callback) => {
        const payload = JSON.stringify(command.payload);
        mqttClient.publish(command.topic, payload, {}, (err) => {
            if (err) return callback(err);
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
            .then(response => callback(null, `HTTP ${method.toUpperCase()} request to ${command.url} responded with status ${response.status}`))
            .catch(error => callback(error));
    },

    websocket: (command, callback) => {
        if (!wsConnections[command.url]) {
            try {
                const ws = new WebSocket(command.url);
                ws.on('open', () => {
                    wsConnections[command.url] = ws;
                    ws.send(JSON.stringify(command.message));
                    callback(null, `WebSocket message sent to ${command.url}`);
                });
                ws.on('error', err => {
                    delete wsConnections[command.url];
                    callback(err);
                });
                ws.on('close', () => delete wsConnections[command.url]);
            } catch (err) {
                callback(err);
            }
        } else {
            try {
                wsConnections[command.url].send(JSON.stringify(command.message));
                callback(null, `WebSocket message sent to ${command.url}`);
            } catch (err) {
                delete wsConnections[command.url];
                callback(err);
            }
        }
    },

    shell: (command, callback) => {
        if (!command.cmd) return callback(new Error('No shell command provided'));
        exec(command.cmd, (error, stdout, stderr) => {
            if (error) return callback(error);
            callback(null, stdout || stderr || 'Command executed');
        });
    }
};

// Execute a named command via GET /command?c=name
app.get('/command', (req, res) => {
    const command = req.query.c;
    if (!command) {
        return res.send(renderHTML("Missing Command", "danger", "Missing c=COMMAND parameter"));
    }

    const cmd = commandMap[command];
    if (!cmd) {
        return res.send(renderHTML("Unknown Command", "warning", `Command '${command}' not found in command map.`));
    }

    const protocol = cmd.protocol || 'mqtt';
    if (!protocolHandlers[protocol]) {
        return res.send(renderHTML("Unsupported Protocol", "danger", `Protocol '${protocol}' is not supported.`));
    }

    protocolHandlers[protocol](cmd, (err, result) => {
        if (err) {
            return res.send(renderHTML("Command Execution Failed", "danger", err.message));
        }
        return res.send(renderHTML("Command Executed", "success",
            `Command: ${command}\nProtocol: ${protocol}\nResult: ${result}`));
    });
});

// Add a new command via POST /commands
app.post('/commands', (req, res) => {
    const { name, configuration } = req.body;
    if (!name || !configuration || !configuration.protocol) {
        return res.status(400).send('Missing required parameters: name, configuration with protocol');
    }

    if (!protocolHandlers[configuration.protocol]) {
        return res.status(400).send(`Unsupported protocol: ${configuration.protocol}`);
    }

    commandMap[name] = configuration;

    try {
        fs.writeFileSync(commandMapPath, JSON.stringify(commandMap, null, 2));
        res.status(201).send(`Command '${name}' added and saved.`);
    } catch (err) {
        res.status(500).send('Failed to save command to config file.');
    }
});

// List all available commands via GET /commands
app.get('/commands', (req, res) => {
    const list = Object.keys(commandMap).map(key => {
        const cmd = commandMap[key];
        return `• ${key} (${cmd.protocol || 'mqtt'})`;
    }).join('\n');

    res.send(renderHTML("Available Commands", "info", list || "No commands found."));
});

// Delete a command via DELETE /commands/:name
app.delete('/commands/:name', (req, res) => {
    const { name } = req.params;
    if (!commandMap[name]) {
        return res.status(404).send(`Command '${name}' not found`);
    }

    delete commandMap[name];

    try {
        fs.writeFileSync(commandMapPath, JSON.stringify(commandMap, null, 2));
        res.send(`Command '${name}' deleted successfully.`);
    } catch (err) {
        res.status(500).send('Failed to update config file.');
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Closing WebSocket connections...');
    Object.values(wsConnections).forEach(ws => {
        try { ws.close(); } catch (_) {}
    });
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`SmartHub Command Server running at ${HOST}:${PORT}`);
    console.log(`Supported protocols: ${Object.keys(protocolHandlers).join(', ')}`);
});
