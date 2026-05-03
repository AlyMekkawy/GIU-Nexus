const Application = require('../models/Application');

exports.getMyApplications = async (req, res, next) => {
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

exports.updateApplicationStatus = async (req, res, next) => {
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