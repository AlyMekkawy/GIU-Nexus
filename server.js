require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const adminRoutes = require('./routes/adminRoutes.js');
const applicationRoutes = require('./routes/applicationRoutes');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';


// ── Middleware ────────────────────────────────────────────────────

// Body parser
app.use(express.json());


// ── Routes ────────────────────────────────────────────────────────
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/applications', applicationRoutes)
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);


// Health-check
app.get('/', (req, res) => {
    res.json({ message: 'Nexus API running.' });
});

// ── Centralized error handler (must be last) ──────────────────────
app.use(errorHandler);

// ── Connect to DB, then start server ─────────────────────────────
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port: ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
