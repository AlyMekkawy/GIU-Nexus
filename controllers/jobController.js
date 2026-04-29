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

    const search = req.query.search;
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
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items: jobs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs
};
