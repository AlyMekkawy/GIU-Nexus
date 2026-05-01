// In-memory blacklist of invalidated JWT IDs (jti claims).
// In production, replace with Redis for persistence across restarts.
const blacklistedTokens = new Set();

const addToBlacklist  = (jti) => blacklistedTokens.add(jti);
const isBlacklisted   = (jti) => blacklistedTokens.has(jti);

module.exports = { addToBlacklist, isBlacklisted };
