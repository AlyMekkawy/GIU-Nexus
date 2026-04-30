const mongoose = require('mongoose');
const User = require('../models/user');

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user id format' });
        }

        const user = await User.findById(userId).select('name email bio skills profilePicture role status');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getProfile,
};

