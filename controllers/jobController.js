const JobPost = require("../models/JobPost");

const getJobs = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.location) filters.location = req.query.location;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.status) filters.status = req.query.status;

    const search = req.query.search || req.query.keyword;
    if (search) {
      const regex = new RegExp(search, "i");
      filters.$or = [{ title: regex }, { company: regex }, { description: regex }];
    }

    const [total, jobs] = await Promise.all([
      JobPost.countDocuments(filters),
      JobPost.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      jobs: jobs
    });
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    if (req.user.role !== 'admin' && job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorised to delete this job"
      });
    }

    await job.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Job deleted"
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getJobs,
  deleteJob
};
