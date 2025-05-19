    function getCachedKey(name, lat, lon) {
        return  `webCache:${name}:${lat},${lon}`;
    }
    function setCachedValue(value, name, lat, lon) {
        const cacheKey = getCachedKey(name, lat, lon);
        try {
          let objValue = { value: value, timestamp: Date.now() };
          let jsonValue = JSON.stringify(objValue); 
          localStorage.setItem( cacheKey, jsonValue );
        } catch (err) {

        }
    }
    function getCachedValue(name, lat, lon) {
        let result;
        const cacheKey = getCachedKey(name, lat, lon);
        const now = Date.now();
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr);
            if (now - cached.timestamp < CACHED_PERIOD) {
               result = cached.value;
            }
          } catch (err) {
          }
        } 
        return result;
    }

