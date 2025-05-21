/**
 * SmartHub - AI powered Smart Home
 * Cache Library for any App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.4.0
 * @license MIT
 */

const CACHED_PERIOD = 1000 * 60 * 10; // 10 minutes

function getCachedKey(name, lat, lon) {
    return `webCache:${name}:${lat},${lon}`;
}

function setCachedValue(value, name, lat, lon) {
    const cacheKey = getCachedKey(name, lat, lon);
    try {
        const objValue = { value: value, timestamp: Date.now() };
        const jsonValue = JSON.stringify(objValue);

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(cacheKey, jsonValue);
        } else if (typeof global !== 'undefined' && global._jarvisCache) {
            global._jarvisCache[cacheKey] = jsonValue;
        }
    } catch (err) {
        console.error('Failed to set cache:', err);
    }
}

function getCachedValue(name, lat, lon) {
    let result;
    const cacheKey = getCachedKey(name, lat, lon);
    const now = Date.now();
    let cachedStr = null;

    if (typeof localStorage !== 'undefined') {
        cachedStr = localStorage.getItem(cacheKey);
    } else if (typeof global !== 'undefined' && global._jarvisCache) {
        cachedStr = global._jarvisCache[cacheKey];
    }

    if (cachedStr) {
        try {
            const cached = JSON.parse(cachedStr);
            if (now - cached.timestamp < CACHED_PERIOD) {
                result = cached.value;
            }
        } catch (err) {
            console.error('Failed to parse cached value:', err);
        }
    }
    return result;
}

const cacheContent = {
    getCachedKey,
    setCachedValue,
    getCachedValue
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = cacheContent;
} else {
    window.Jarvis = window.Jarvis || {};
    window.Jarvis.cache = cacheContent;
}
