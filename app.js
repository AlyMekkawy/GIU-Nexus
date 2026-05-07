const express = require('express');

const adminRoutes = require('./routes/adminRoutes.js');
const applicationRoutes = require('./routes/applicationRoutes');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');
const swaggerSpec = require('./config/swagger');
const {serve, setup} = require("swagger-ui-express");

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api-docs', serve, setup(swaggerSpec));

// Health-check
app.get('/', (req, res) => {
    res.json({ message: 'Nexus API running.' });
});

// Centralized error handler must be last
app.use(errorHandler);

module.exports = app;