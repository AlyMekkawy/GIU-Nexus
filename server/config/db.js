const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        console.error('DB connection error: MONGO_URI is not defined');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');

    try {
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (error) {
        console.error(`DB connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
