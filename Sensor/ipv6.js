/**
 * SmartHub - AI powered Smart Home
 * App that reads values from the local network and sends them to MQTT to update the home state.
 * 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * Author: Mikhail Leonov <mikecommon@gmail.com>
 * Version: 0.5.2
 * License: MIT
 */

const fs = require('fs');
const path = require('path');
const ini = require('ini');
const { execSync } = require('child_process');

const node = require('../Shared/mqtt-node');

const CONFIG_PATH = path.join(__dirname, 'ipv6.cfg');
const MQTT_TOPIC = '/home/internal/house/network/lawn_water_controller';

/**
 * Synchronously ping an IPv6 address
 * @param {string} ip - The IPv6 address to check
 * @returns {boolean} - true if device is alive, false otherwise
 */
function isIPv6Alive(ip) {
    try {
        const output = execSync(`ping -6 -c 1 -w 2 ${ip}`, { encoding: 'utf-8' });
        return output.includes('1 packets transmitted, 1 received');
    } catch {
        return false;
    }
}

/**
 * Main function to scan IPv6 devices and publish their state
 */
function scanIPv6Devices() {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = ini.parse(configContent);
    const entry = config.entry || {};

    node.connectToMqtt().then(() => {
        for (const ip in entry) {
            const shouldScan = entry[ip] === '1' || entry[ip] === 1;
            if (!shouldScan) continue;

            const deviceConfig = config[ip] || {};
            const expectedLive = deviceConfig.live !== undefined ? String(deviceConfig.live) === '1' : true;

            const actualLive = isIPv6Alive(ip);
            const result = actualLive ? 1 : 0;

            console.log(`Checking ${ip} - expected live: ${expectedLive}, actual: ${result}`);

            node.publishToMQTT(
                'status',
                MQTT_TOPIC,
                result
            ).catch(err => {
                console.error(`Failed to publish MQTT message for ${ip}: ${err.message}`);
            });
        }
    }).catch(err => {
        console.error(`MQTT connection failed: ${err.message}`);
    });
}

// Run once
scanIPv6Devices();
