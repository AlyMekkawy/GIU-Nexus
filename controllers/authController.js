const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/user');

// Helper — signs a JWT with the user's _id as the payload
const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// Helper — builds the user object returned in every auth response
const userPayload = (user) => ({
    _id:    user._id,
    name:   user.name,
    email:  user.email,
    role:   user.role,
    ...(user.role === 'recruiter' && { status: user.status }),
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

        const token = signToken(user._id);

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

module.exports = { register };
