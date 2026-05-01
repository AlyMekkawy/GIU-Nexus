const User = require('../models/user')

const getUsers = async (req, res) => {
    const { role, status, page = 1, limit = 20 } = req.query

    const filter = {}
    if (role) filter.role = role
    if (status) filter.status = status

    const skip = (page - 1) * limit
    const users = await User.find(filter).skip(skip).limit(limit).select('-password')
    const total = await User.countDocuments(filter)

    res.status(200).json({ success: true, total, page: Number(page), users })
}

const updateUserStatus = async (req, res) => {
    const { status } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.status(200).json({ success: true, user });
}

module.exports = { getUsers, updateUserStatus }