const JobPost = require("../models/JobPost");
const hf = require("../services/hfService");
const mongoose = require("mongoose");

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

const updateJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid job id" });
    }

    const job = await JobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (req.user.role !== "recruiter") {
      return res.status(403).json({ success: false, message: "Not authorised to edit this job" });
    }

    if (job.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorised to edit this job" });
    }

    const allowedFields = [
      "title",
      "status",
      "description",
      "requirements",
      "location",
      "type",
      "salary",
      "totalSlots",
      "company"
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    if (updateData.description && updateData.description !== job.description) {
      const candidateLabels = ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"];
      const classification = await hf.zeroShotClassification({
        model: "facebook/bart-large-mnli",
        inputs: updateData.description,
        parameters: { candidate_labels: candidateLabels }
      });

      const result = Array.isArray(classification) ? classification[0] : classification;
      const topLabel = result && Array.isArray(result.labels) ? result.labels[0] : null;
      updateData.category = candidateLabels.includes(topLabel) ? topLabel : "Other";
    }

    const updatedJob = await JobPost.findByIdAndUpdate(jobId, updateData, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({ success: true, job: updatedJob });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getJobs,
  updateJob
};
