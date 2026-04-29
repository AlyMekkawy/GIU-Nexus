require('dotenv').config();
const express   = require('express');
const connectDB = require('./config/db');
const os = require('os');

const applicationRoutes   = require('./routes/applicationRoutes');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

const getLocalIPv4 = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
};

// ── Middleware ────────────────────────────────────────────────────
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/v1/job',   jobRoutes);

// Health-check
app.get('/', (req, res) => {
    res.json({ message: 'BookStore API is running!' });
});

// ── Centralized error handler (must be last) ──────────────────────
app.use(errorHandler);

// ── Connect to DB, then start server ─────────────────────────────
connectDB();
app.listen(PORT, () => {
    const host = getLocalIPv4();
    console.log(`Server running on http://${host}:${PORT}`);
});
