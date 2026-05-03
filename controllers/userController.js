const User = require('../models/user')

const getUsers = async (req, res, next) => {
    try {
        const { role, status } = req.query
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20

        const filter = {}
        if (role) filter.role = role
        if (status) filter.status = status

        const skip = (page - 1) * limit
        const users = await User.find(filter).skip(skip).limit(limit).select('-password')
        const total = await User.countDocuments(filter)

        res.status(200).json({ success: true, total, page, users })
    } catch (error) {
        next(error)
    }
}

const updateUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body

        const allowedStatuses = ['approved', 'rejected', 'pending']
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value. Must be approved, rejected, or pending' })
        }

        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        if (user.role !== 'recruiter') {
            return res.status(400).json({ success: false, message: 'Status can only be updated for recruiters' })
        }

        user.status = status
        await user.save()

        res.status(200).json({ success: true, user })
    } catch (error) {
        next(error)
    }
}

module.exports = { getUsers, updateUserStatus }