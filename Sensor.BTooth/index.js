/**
 * SmartHub - Gmail-to-MQTT Notification (Async MQTT)
 * Scans Blue toothe devices and sends MQTT notice asynchronously
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.9
 * @license MIT
 */

const noble = require('@abandonware/noble');
const mqtt = require('../Shared/mqtt-node');

const BASE_TOPIC = 'home/inside/house/bluetooth';
const DEVICE_TIMEOUT_MS = 60 * 1000; // Mark device OFF if not seen in 60s
const CHECK_INTERVAL_MS = 30 * 1000; // Every 30s check for expired devices
const SCAN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const SCAN_DURATION_MS = 15 * 1000; // 15 seconds

const devicesSeen = new Map(); // deviceName => { lastSeen, status }

async function init() {
    try {
        console.log('Connecting to MQTT...');
        await mqtt.connectToMqtt();
        console.log('MQTT connected. Waiting for BLE state...');
    } catch (err) {
        console.error('MQTT connection failed:', err);
        process.exit(1);
    }
}

// Start BLE scanning (called every 10 minutes)
async function runBleScanCycle() {
    if (noble.state !== 'poweredOn') {
        console.warn('BLE not powered on, skipping scan.');
        return;
    }

    try {
        console.log('Starting BLE scan...');
        await noble.startScanningAsync([], true);

        setTimeout(async () => {
            console.log('Stopping BLE scan...');
            await noble.stopScanningAsync();
        }, SCAN_DURATION_MS);

    } catch (err) {
        console.error('BLE scan error:', err.message);
    }
}

// Handle found devices
noble.on('discover', async (peripheral) => {
    const { localName } = peripheral.advertisement;
    const deviceName = (localName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const topic = `${BASE_TOPIC}/${deviceName}`;
    const now = Date.now();

    const existing = devicesSeen.get(deviceName);
    if (!existing || existing.status === 'off') {
        console.log(`Publishing ON for ${deviceName}`);
        try {
            await mqtt.publishToMQTT(deviceName, topic, 'on', 'status');
            devicesSeen.set(deviceName, { lastSeen: now, status: 'on' });
        } catch (err) {
            console.error('Failed to publish ON:', err.message);
        }
    } else {
        // Update timestamp only
        devicesSeen.set(deviceName, { ...existing, lastSeen: now });
    }
});

// Every 30 seconds, check if devices are stale and mark them as off
setInterval(async () => {
    const now = Date.now();

    for (const [deviceName, { lastSeen, status }] of devicesSeen.entries()) {
        if (status === 'on' && now - lastSeen > DEVICE_TIMEOUT_MS) {
            const topic = `${BASE_TOPIC}/${deviceName}`;
            console.log(`Publishing OFF for ${deviceName}`);
            try {
                await mqtt.publishToMQTT(deviceName, topic, 'off', 'status');
                devicesSeen.set(deviceName, { lastSeen, status: 'off' });
            } catch (err) {
                console.error('Failed to publish OFF:', err.message);
            }
        }
    }
}, CHECK_INTERVAL_MS);

// BLE adapter ready
noble.on('stateChange', async (state) => {
    console.log(`BLE adapter state: ${state}`);
    if (state === 'poweredOn') {
        // First scan starts immediately
        runBleScanCycle();
        // Then every 10 minutes
        setInterval(runBleScanCycle, SCAN_INTERVAL_MS);
    }
});

init();
