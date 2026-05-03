const Application = require('../models/Application');

// @route   GET /api/v1/applications
// @desc    Get a paginated list of all applications on the platform
// @access  Private/Admin
const getAllApplications = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;

        const total = await Application.countDocuments();

        const applications = await Application.find()
            .populate('user', 'name email')
            .populate('job', 'title company')
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({
            success: true,
            total,
            page,
            applications
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllApplications
};
