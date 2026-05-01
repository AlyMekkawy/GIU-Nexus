const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const User   = require('../models/user');
const { addToBlacklist } = require('../config/tokenBlacklist');

// Helper — signs a JWT with _id, role, and a unique jti for blacklisting
const signToken = (user) =>
    jwt.sign(
        { id: user._id, role: user.role, jti: crypto.randomUUID() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );

// Helper — builds the user object returned in every auth response
const userPayload = (user) => ({
    _id:            user._id,
    name:           user.name,
    email:          user.email,
    role:           user.role,
    ...(user.role === 'recruiter' && { status: user.status }),
    profilePicture: user.profilePicture || '',
    skills:         user.skills || [],
});

// ── POST /api/v1/auth/register ────────────────────────────────────────────────
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Basic presence check (Mongoose validates types/lengths)
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'name, email, password and role are all required' });
        }

        // Role guard — only public-facing roles allowed at registration
        if (!['jobSeeker', 'recruiter'].includes(role)) {
            return res.status(400).json({ success: false, message: "role must be 'jobSeeker' or 'recruiter'" });
        }

        // Password strength rules
        const passwordErrors = [];
        if (password.length < 8)          passwordErrors.push('at least 8 characters');
        if (!/[A-Z]/.test(password))      passwordErrors.push('one uppercase letter');
        if (!/[a-z]/.test(password))       passwordErrors.push('one lowercase letter');
        if (!/[0-9]/.test(password))       passwordErrors.push('one digit');
        if (!/[^A-Za-z0-9]/.test(password)) passwordErrors.push('one special character (!@#$%...)');

        if (passwordErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Password must contain: ${passwordErrors.join(', ')}`,
            });
        }

        // Hash password
        const salt           = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user (Mongoose handles unique email & validation errors)
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
        });

        const token = signToken(user);

        res.status(201).json({
            success: true,
            token,
            user: userPayload(user),
        });
    } catch (err) {
        // Duplicate email — surface a friendly message instead of the raw driver error
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        next(err);
    }
};

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Find user and explicitly include the password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Compare plaintext password against the stored hash
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = signToken(user);

        res.status(200).json({
            success: true,
            token,
            user: userPayload(user),
        });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/v1/auth/logout ──────────────────────────────────────────────────
const logout = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorised – no token provided' });
        }

        const token = authHeader.split(' ')[1];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Not authorised – invalid token' });
        }

        // Add the token's unique ID to the blacklist
        addToBlacklist(decoded.jti);

        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, logout };
