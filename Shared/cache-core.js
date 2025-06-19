/**
 * SmartHub - AI powered Smart Home
 * Browser Cache Library (localStorage)
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.2
 * @license MIT
 */

// Cache expiration constants
const CACHED_PERIOD_01 = 1000 * 60 * 60;      // 1 hour
const CACHED_PERIOD_24 = 1000 * 60 * 60 * 24; // 24 hours

// Generate a unique cache key based on input
function getCachedKey(name, lat, lon) {
  return `webCache:${name}:${lat},${lon}`;
}

// Convert cache key to a safe "filename-like" string (not needed in localStorage but included for symmetry)
function getCacheFileName(cacheKey) {
  return cacheKey.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Set a value in the cache
function setCachedValue(value, name, lat, lon) {
  const cacheKey = getCachedKey(name, lat, lon);
  const objValue = {
    value: value,
    timestamp: Date.now()
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify(objValue));
    } else {
      console.warn('localStorage not available. Cache not set.');
    }
  } catch (err) {
    console.error('Failed to set cache:', err);
  }
}

// Get a cached value (ignores age/expiration)
function getCachedValue(name, lat, lon) {
  const cacheKey = getCachedKey(name, lat, lon);

  try {
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available. Cache cannot be read.');
      return null;
    }

    const cachedStr = localStorage.getItem(cacheKey);
    if (!cachedStr) return null;

    const cached = JSON.parse(cachedStr);
    return cached.value;
  } catch (err) {
    console.error('Failed to read or parse cached value:', err);
    return null;
  }
}

// Check if value exists and is still valid based on age
function valueCached(name, lat, lon, period = CACHED_PERIOD_24) {
  const cacheKey = getCachedKey(name, lat, lon);

  try {
    if (typeof localStorage === 'undefined') return false;

    const cachedStr = localStorage.getItem(cacheKey);
    if (!cachedStr) return false;

    const cached = JSON.parse(cachedStr);
    const age = Date.now() - cached.timestamp;
    return age < period;
  } catch (err) {
    console.error('Failed to validate cached value:', err);
    return false;
  }
}

// Expose the cache API
const cache = {
  CACHED_PERIOD_01,
  CACHED_PERIOD_24,
  getCachedKey,
  getCacheFileName,
  setCachedValue,
  getCachedValue,
  valueCached
};
