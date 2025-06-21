/**
 * SmartHub - AI powered Smart Home
 * Config Node.js Wrapper
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.3
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

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
};


module.exports = { loadConfig };
