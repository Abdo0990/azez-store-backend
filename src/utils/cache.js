const NodeCache = require('node-cache');

// إنشاء Cache لمدة افتراضية 10 دقائق
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// تفريغ الكاش بناءً على بادئة الـ Key (مثلاً: تفريغ كل كاش الفئات عند تعديل فئة)
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