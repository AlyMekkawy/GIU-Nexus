const rateLimit = require('express-rate-limit');

// No-op middleware for testing (bypasses rate limiting)
const noOpLimiter = (req, res, next) => next();

// Skip function to avoid rate limiting for test environments/IPs
const skipForTests = (req) => {
    // Skip rate limiting for:
    // 1. Localhost/127.0.0.1 connections
    // 2. Requests with X-Cypress-Test header (from E2E tests)
    // 3. Test environment variable set
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.hostname === 'localhost';
    const isCypressTest = req.headers['x-cypress-test'] === 'true' || req.headers['X-Cypress-Test'] === 'true';
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.CYPRESS_TEST === 'true';

    return isLocalhost || isCypressTest || isTestEnv;
};

// Use no-op limiter in test mode, otherwise apply rate limiting with skip function
const authLimiter = process.env.NODE_ENV === 'test' || process.env.CYPRESS_TEST === 'true'
    ? noOpLimiter
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        skip: skipForTests,
        message: {
            success: false,
            message: 'Too many requests, please try again later.',
        },
    });

module.exports = { authLimiter };

