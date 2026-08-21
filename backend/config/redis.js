/**
 * Redis / In-Memory Caching Service for FinFlow
 * Caches frequent dashboard analytics queries to accelerate response times and reduce database load.
 */

const cacheMap = new Map();

/**
 * Retrieve cached value by key
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
const getCache = async (key) => {
  if (cacheMap.has(key)) {
    const item = cacheMap.get(key);
    if (Date.now() < item.expiry) {
      return JSON.parse(item.value);
    }
    cacheMap.delete(key);
  }
  return null;
};

/**
 * Set value in cache with Time-To-Live (TTL)
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds Default: 300 seconds (5 mins)
 */
const setCache = async (key, value, ttlSeconds = 300) => {
  const expiry = Date.now() + (ttlSeconds * 1000);
  cacheMap.set(key, { value: JSON.stringify(value), expiry });
};

/**
 * Invalidate cache entries by key prefix
 * @param {string} keyPrefix 
 */
const clearCache = async (keyPrefix) => {
  for (const key of cacheMap.keys()) {
    if (key.startsWith(keyPrefix)) {
      cacheMap.delete(key);
    }
  }
};

module.exports = { getCache, setCache, clearCache };
