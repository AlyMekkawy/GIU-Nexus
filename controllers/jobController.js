const JobPost = require("../models/JobPost");
const Application = require("../models/application");
const User = require("../models/user");
const hf = require("../services/hfService");
const mongoose = require("mongoose");

// ── Helper: Cosine Similarity ──────────────────────────────────────
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

// ─────────────────────────────────────────────
// Helper – AI category classification
// ─────────────────────────────────────────────
async function classifyJobCategory(description) {
  try {
    const result = await hf.zeroShotClassification({
      model: "facebook/bart-large-mnli",
      inputs: [description],
      parameters: {
        candidate_labels: [
          "Frontend",
          "Backend",
          "AI/ML",
          "DevOps",
          "Data Engineering",
          "Other",
        ],
      },
    });
    return Array.isArray(result) && result[0] && Array.isArray(result[0].labels)
      ? result[0].labels[0]
      : "Other";
  } catch (err) {
    console.error("[HF] Job classification failed:", err.message);
    return "Other";
  }
}

// ─────────────────────────────────────────────
// POST /api/v1/jobs
// Access: Recruiter (status: "approved")
// ─────────────────────────────────────────────
const createJob = async (req, res, next) => {
  try {
    if (req.user.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is pending approval. Wait for admin approval before posting jobs.",
      });
    }

    const {
      title,
      company,
      description,
      requirements,
      location,
      type,
      salary,
      totalSlots,
    } = req.body;

    if (!title || !company || !description || !requirements || !location || !type) {
      return res.status(400).json({
        success: false,
        message:
          "title, company, description, requirements, location, and type are all required.",
      });
    }

    const allowedTypes = ["full-time", "part-time", "internship"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${allowedTypes.join(", ")}`,
      });
    }

    const category = await classifyJobCategory(description);

    const job = await JobPost.create({
      title,
      company,
      description,
      requirements,
      location,
      type,
      salary,
      totalSlots: totalSlots ?? 1,
      category,
      status: "open",
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      job,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/v1/jobs/:id
// Access: Public
// ─────────────────────────────────────────────
const getJobById = async (req, res, next) => {
  try {
    const job = await JobPost.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    next(err);
  }
};

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

// ── GET /api/v1/jobs/recommended ──────────────────────────────────
// Job Seeker only. Returns jobs ranked by similarity to user skills.
const getRecommendedJobs = async (req, res, next) => {
  try {
    // Check user is authenticated and is a jobSeeker
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorised – no token provided' });
    }

    if (req.user.role !== 'jobSeeker') {
      return res.status(403).json({
        success: false,
        message: `Forbidden – role '${req.user.role}' is not allowed to access this resource`
      });
    }

    // Get user's skills
    const userSkills = req.user.skills || [];
    if (userSkills.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No skills found. Add skills to your profile to get recommendations.',
        jobs: []
      });
    }

    // Fetch all open jobs
    const jobs = await JobPost.find({ status: 'open' }).lean();

    if (jobs.length === 0) {
      return res.status(200).json({
        success: true,
        jobs: []
      });
    }

    // Get embeddings for user skills
    const userSkillsText = userSkills.join(' ');
    let userEmbedding;
    try {
      userEmbedding = await hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: userSkillsText
      });
    } catch (err) {
      console.error('HuggingFace embedding error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to compute skill embeddings'
      });
    }

    // Score each job based on similarity
    const jobsWithScores = await Promise.all(
      jobs.map(async (job) => {
        const jobRequirementsText = (job.requirements || []).join(' ');
        
        if (!jobRequirementsText.trim()) {
          return { ...job, score: 0 };
        }

        try {
          const jobEmbedding = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: jobRequirementsText
          });

          const score = cosineSimilarity(userEmbedding, jobEmbedding);
          return { ...job, score };
        } catch (err) {
          console.error(`Error embedding job ${job._id}:`, err.message);
          return { ...job, score: 0 };
        }
      })
    );

    // Sort by score (highest first) and return
    const recommendedJobs = jobsWithScores
      .sort((a, b) => b.score - a.score)
      .filter(job => job.score > 0); // Optional: filter out zero-score jobs

    res.status(200).json({
      success: true,
      jobs: recommendedJobs
    });
  } catch (error) {
    next(error);
  }
};

const getJobApplicants = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!jobId || !mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid job id" });
    }

    // Verify the job exists and belongs to this recruiter
    const job = await JobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized — you do not own this job' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('user', 'name email skills')
      .select('status coverLetter appliedAt user')
      .lean();

    res.status(200).json({ success: true, applications });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/jobs/saved ────────────────────────────────────────
// Job Seeker only. Returns all saved jobs for the logged-in user.
const getSavedJobs = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorised – no token provided" });
    }

    if (req.user.role !== "jobSeeker") {
      return res.status(403).json({
        success: false,
        message: `Forbidden – role '${req.user.role}' is not allowed to access this resource`
      });
    }

    const user = await User.findById(req.user._id).populate({
      path: "savedJobs",
      options: { sort: { createdAt: -1 } }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      jobs: user.savedJobs || []
    });
  } catch (error) {
    return next(error);
  }
};

// ── GET /api/v1/jobs/my-jobs ─────────────────────────────────────
// Recruiter only. Returns jobs created by the logged-in recruiter.
const getMyJobs = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorised – no token provided" });
    }

    if (req.user.role !== "recruiter") {
      return res.status(403).json({
        success: false,
        message: `Forbidden – role '${req.user.role}' is not allowed to access this resource`
      });
    }

    const jobs = await JobPost.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      jobs
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getJobs,
  createJob,
  getJobById,
  deleteJob,
  updateJob,
  getRecommendedJobs,
  getJobApplicants
  getSavedJobs,
  getMyJobs
};

