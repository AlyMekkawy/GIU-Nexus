const Application = require('../models/application');

const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate('job', 'title company type status');

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (err) {
    next(err);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowed = ['pending', 'shortlisted', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const application = await Application.findById(req.params.id).populate('job');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!application.job) {
      return res.status(404).json({
        success: false,
        message: 'Job for this application no longer exists',
      });
    }

    if (application.job.createdBy.toString() !== req.user._id.toString()) {
        console.log(application.job.createdBy.toString())
        console.log(req.user._id.toString())
      return res.status(403).json({
        success: false,
        message: 'Not authorised to update this application',
      });
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      application,
    });
  } catch (err) {
    next(err);
  }
};
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
    getMyApplications,
    updateApplicationStatus,
    getAllApplications
};
