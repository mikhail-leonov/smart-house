/**
 * SmartHub - AI powered Smart Home
 * Cache Node.js Wrapper 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @version 0.6.1
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

const CACHED_PERIOD_01 = 1000 * 60 * 60 *  1; // 1 Hr
const CACHED_PERIOD_24 = 1000 * 60 * 60 * 24; // 24 Hr
const CACHE_DIR = path.resolve(__dirname, 'cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) { fs.mkdirSync(CACHE_DIR); }

// Helper to get a safe filename from cache key
function getCacheFileName(cacheKey) {
  const result = cacheKey.toLowerCase() + '.json';
  return result;
}

function getCachedKey(name, lat, lon) {
  const result = `webCache_${name}_${lat}_${lon}`;
  return result;
}

function setCachedValue(value, cacheKey, lat, lon) {
  const filename = path.join(CACHE_DIR, getCacheFileName(cacheKey));
  try {
    const objValue = { value: value, timestamp: Date.now() };
    fs.writeFileSync(filename, JSON.stringify(objValue), 'utf8');
  } catch (err) {
    console.error('Failed to set cache:', err);
  }
}

function getCachedValue(cacheKey, lat, lon) {
  const filename = path.join(CACHE_DIR, getCacheFileName(cacheKey));
  if (!fs.existsSync(filename)) { return null; }
  try {
    const content = fs.readFileSync(filename, 'utf8');
    const cached = JSON.parse(content);
    return cached.value;
  } catch (err) {
    console.error('Failed to read or parse cached file:', err);
    return null;
  }
}

// New: Check if cache exists and is still valid
function valueCached(cacheKey, period = CACHED_PERIOD_24) {
  const filename = path.join(CACHE_DIR, getCacheFileName(cacheKey));
  if (!fs.existsSync(filename)) { return false; }
  try {
    const content = fs.readFileSync(filename, 'utf8');
    const cached = JSON.parse(content);
    const age = Date.now() - cached.timestamp;
    return age < period;
  } catch (err) {
    console.error('Failed to validate cached file:', err);
    return false;
  }
}

const cache = {
  CACHED_PERIOD_01,
  CACHED_PERIOD_24,
  getCacheFileName,
  getCachedKey,
  setCachedValue,
  getCachedValue,
  valueCached
};

module.exports = cache;
