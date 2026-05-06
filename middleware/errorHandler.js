// Centralized error handling middleware
// Must be registered LAST with app.use() in server.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `Duplicate value for field: ${field}`,
        });
    }

    // Mongoose bad ObjectId — treat as resource not found
    if (err.name === 'CastError') {
        return res.status(404).json({
            success: false,
            message: `Resource not found with id: ${err.value}`,
        });
    }

    // Body parser errors (invalid JSON)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
    }

    // Default server error
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
};

module.exports = errorHandler;