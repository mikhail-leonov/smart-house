/**
 * SmartHub - AI powered Smart Home
 * Env content file reader for Node.js
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.1
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

function load() {
    const data = fs.readFileSync("../.env", 'utf8');
    const lines = data.split('\n');
    const env = {};
    let section = null;

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith(';') || line.startsWith('#')) continue;
        if (line.startsWith('[') && line.endsWith(']')) {
            section = line.slice(1, -1);
            env[section] = {};
        } else if (section) {
            const idx = line.indexOf('=');
            if (idx !== -1) {
                const key = line.slice(0, idx).trim();
                const value = line.slice(idx + 1).trim();
                env[section][key] = value;
            }
        }
    }

    return env;
};


module.exports = { load };
