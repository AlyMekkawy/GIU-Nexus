const jwt  = require('jsonwebtoken');
const User = require('../models/user');
const { isBlacklisted } = require('../config/tokenBlacklist');

// ── protect ───────────────────────────────────────────────────────────────────
// Verifies the Bearer token, fetches the full user from the DB, and attaches
// it to req.user.  Every protected route must use this middleware first.
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Not authorised – no token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        const message = err.name === 'TokenExpiredError'
            ? 'Not authorised – token has expired'
            : 'Not authorised – invalid token';
        return res.status(401).json({ success: false, message });
    }

    // Reject tokens that have been invalidated by logout
    if (decoded.jti && isBlacklisted(decoded.jti)) {
        return res.status(401).json({ success: false, message: 'Not authorised – token has been revoked' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Not authorised – user no longer exists' });
    }

    req.user = user;
    next();
};

// ── authorize ─────────────────────────────────────────────────────────────────
// Factory that returns a middleware restricting access to the given roles.
// Must always be chained AFTER protect.
// Usage: router.post('/', protect, authorize('recruiter', 'admin'), handler)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden – role '${req.user.role}' is not allowed to perform this action`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
