const NodeCache = require('node-cache');

// تعطيل useClones لتخزين البيانات بأعلى كفاءة وبدون أخطاء Cloned Mongoose Documents
const cache = new NodeCache({
    stdTTL: 600,
    checkperiod: 120,
    useClones: false
});

// تفريغ الكاش بناءً على بادئة الـ Key
const clearCacheByPrefix = (prefix) => {
    const keys = cache.keys();
    const matchingKeys = keys.filter((key) => key.startsWith(prefix));
    if (matchingKeys.length > 0) {
        cache.del(matchingKeys);
    }
};

module.exports = {
    cache,
    clearCacheByPrefix,
};