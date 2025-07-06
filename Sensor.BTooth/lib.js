/**
 * SmartHub - BLE Scanner Integration (Library for Full Scan)
 * Used by scan orchestrator to fetch BLE device data in compatible format
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov
 * @version 0.7.4
 * @license MIT
 */

/**
 * SmartHub - BLE Scanner Integration (Library for Full Scan)
 * Used by scan orchestrator to fetch BLE device data in compatible format
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov
 * @version 0.7.4
 * @license MIT
 */
const noble = require('@abandonware/noble');

const SCAN_DURATION_MS = 15 * 1000;

let devicesSeen;
let resolve;
let reject;
let scanTimeout;
let isScanning = false;

function onDiscover(peripheral) {
    const { localName } = peripheral.advertisement;
    const deviceName = (localName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
    devicesSeen.set(deviceName, 'on');
}

function onStateChange(state) {
    if (state === 'poweredOn' && !isScanning) {
        isScanning = true;
        noble.startScanningAsync([], true)
            .then(() => {
                scanTimeout = setTimeout(() => {
                    cleanupAndResolve();
                }, SCAN_DURATION_MS);
            })
            .catch(err => {
                cleanup();
                reject(err);
            });
    } else if (state !== 'poweredOn') {
        cleanup();
        reject(new Error(`BLE state is ${state}, cannot scan`));
    }
}

function cleanup() {
    // Clear timeout
    if (scanTimeout) {
        clearTimeout(scanTimeout);
        scanTimeout = null;
    }
    
    // Stop scanning
    if (isScanning) {
        noble.stopScanningAsync().catch(() => {});
        isScanning = false;
    }
    
    // Remove all listeners
    noble.removeAllListeners('discover');
    noble.removeAllListeners('stateChange');
    
    // Reset noble state if possible
    try {
        if (noble.reset && typeof noble.reset === 'function') {
            noble.reset();
        }
    } catch (e) {
        // Ignore reset errors
    }
}

function cleanupAndResolve() {
    cleanup();
    
    const obj = {};
    for (const [name, state] of devicesSeen.entries()) {
        obj[name] = state;
    }
    
    resolve([obj]);
}

async function getBToothData() {
    // Prevent multiple concurrent scans
    if (isScanning) {
        throw new Error('BLE scan already in progress');
    }
    
    devicesSeen = new Map();
    
    return new Promise((res, rej) => {
        resolve = res;
        reject = rej;
        
        // Set up listeners
        noble.on('discover', onDiscover);
        noble.on('stateChange', onStateChange);
        
        // Add error handling
        const errorHandler = (error) => {
            cleanup();
            reject(error);
        };
        
        noble.once('error', errorHandler);
        
        // Add timeout as backup
        const backupTimeout = setTimeout(() => {
            cleanup();
            reject(new Error('BLE scan timeout - backup cleanup'));
        }, SCAN_DURATION_MS + 5000); // 5 seconds extra
        
        // Override cleanup to also clear backup timeout
        const originalCleanup = cleanup;
        cleanup = () => {
            clearTimeout(backupTimeout);
            noble.removeListener('error', errorHandler);
            originalCleanup();
        };
        
        // Check current state
        if (noble.state === 'poweredOn') {
            onStateChange('poweredOn');
        } else if (noble.state === 'unknown' || noble.state === 'resetting') {
            // Wait for state to be determined
        } else {
            // Invalid state
            cleanup();
            reject(new Error(`BLE state is ${noble.state}, cannot scan`));
        }
    });
}

// Graceful shutdown function
function shutdown() {
    cleanup();
    // Force exit if noble doesn't release properly
    setTimeout(() => {
		console.log("ha");
        process.exit(0);
    }, 1000);
}

// Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', cleanup);

module.exports = { getBToothData, shutdown };