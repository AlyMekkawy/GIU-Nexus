const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const User   = require('../models/user');
const { addToBlacklist } = require('../config/tokenBlacklist');
const sendEmail = require('../services/emailService');

// Helper — signs a JWT with _id, role, and a unique jti for blacklisting
const signToken = (user) =>
    jwt.sign(
        { id: user._id, role: user.role, jti: crypto.randomUUID() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );

// Helper — builds the user object returned in register response
const registerPayload = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
});

// Helper — builds the user object returned in every auth response
const userPayload = (user) => ({
    _id:            user._id,
    name:           user.name,
    email:          user.email,
    role:           user.role,
    status:         user.status ?? (user.role === 'recruiter' ? 'pending' : 'approved'),
    profilePicture: user.profilePicture || '',
    skills:         user.skills || [],
});

// ── POST /api/v1/auth/register ────────────────────────────────────────────────
const register = async (req, res, next) => {
    try {
        const body = req.body || {};
        const { name, email, password, role } = body;

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
            status: role === 'recruiter' ? 'pending' : 'approved',
        });

        const token = signToken(user);

        res.status(201).json({
            success: true,
            token,
            user: registerPayload(user),
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
        const { email, password } = req.body || {};

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

// ── POST /api/v1/auth/forgot-password ─────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });

        // Always respond 200 to avoid email enumeration
        if (!user) {
            return res.status(200).json({ success: true, message: 'Password reset email sent' });
        }


        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash it before storing
        user.resetPasswordOtp = crypto.createHash('sha256').update(otp).digest('hex');
        user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });

        try {
            await sendEmail({
                to: user.email,
                subject: 'GIU Nexus — Password Reset OTP',
                text: `You requested a password reset. Your OTP is: ${otp}\n\nIt expires in 10 minutes. If you did not request this, ignore this email.`,
                html: `<p>You requested a password reset. Your OTP is:</p>
                       <h2>${otp}</h2>
                       <p>It expires in <strong>10 minutes</strong>. If you did not request this, ignore this email.</p>`,
            });
        } catch (emailErr) {
            // Roll back the OTP if email fails
            user.resetPasswordOtp = undefined;
            user.resetPasswordOtpExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }

        res.status(200).json({ success: true, message: 'Password reset email sent' });
    } catch (err) {
        next(err);
    }
};


// ── POST /api/v1/auth/verify-otp ──────────────────────────────────────────────
const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        // Hash the incoming OTP to compare with DB
        const hashedOtp = crypto.createHash('sha256').update(otp.toString()).digest('hex');

        const user = await User.findOne({
            email,
            resetPasswordOtp: hashedOtp,
            resetPasswordOtpExpire: { $gt: Date.now() },
        }).select('+resetPasswordOtp +resetPasswordOtpExpire');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Generate the actual reset token now that OTP is verified
        const rawToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Clear OTP fields
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpire = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ 
            success: true, 
            message: 'OTP verified successfully',
            resetToken: rawToken
        });
    } catch (err) {
        next(err);
    }
};

// ── PATCH /api/v1/auth/reset-password/:token ──────────────────────────────────
const resetPassword = async (req, res, next) => {
    try {
        const password = req.body?.password;

        if (!password) {
            return res.status(400).json({ success: false, message: 'New password is required' });
        }

        // Password strength rules (same as register)
        const passwordErrors = [];
        if (password.length < 8)             passwordErrors.push('at least 8 characters');
        if (!/[A-Z]/.test(password))         passwordErrors.push('one uppercase letter');
        if (!/[a-z]/.test(password))         passwordErrors.push('one lowercase letter');
        if (!/[0-9]/.test(password))         passwordErrors.push('one digit');
        if (!/[^A-Za-z0-9]/.test(password))  passwordErrors.push('one special character (!@#$%...)');

        if (passwordErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Password must contain: ${passwordErrors.join(', ')}`,
            });
        }

        // Hash the incoming raw token and look it up
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        }).select('+resetPasswordToken +resetPasswordExpire');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear reset fields
        user.resetPasswordToken  = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

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


module.exports = { register, login, logout, forgotPassword, verifyOtp, resetPassword };
