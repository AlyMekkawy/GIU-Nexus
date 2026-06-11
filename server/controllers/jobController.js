const JobPost = require("../models/JobPost");
const Application = require("../models/application");
const User = require("../models/user");
const hf = require("../services/hfService");
const mongoose = require("mongoose");



// ─────────────────────────────────────────────
// Helper – AI category classification
// ─────────────────────────────────────────────
async function classifyJobCategory(description) {
  try {
    const result = await hf.zeroShotClassification({
      model: "facebook/bart-large-mnli",
      inputs: description, // not [description]
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

    //console.log("[HF] zero-shot result:", JSON.stringify(result, null, 2));

    return Array.isArray(result) && result[0]?.label
        ? result[0].label
        : "Other";
  } catch (err) {
    console.error("[HF] Job classification failed:", err.message);
    return "Other";
  }
}

// ── Helper: Mean-pool token embeddings into one sentence vector ────
// The HF inference API sometimes returns [n_tokens × 384] instead of
// a single pooled [384] vector. This collapses it either way.
const meanPool = (embedding) => {
  if (!Array.isArray(embedding) || embedding.length === 0) return embedding;
  if (!Array.isArray(embedding[0])) return embedding; // already 1-D
  const dims = embedding[0].length;
  const pooled = new Array(dims).fill(0);
  for (const tokenVec of embedding) {
    for (let i = 0; i < dims; i++) pooled[i] += tokenVec[i];
  }
  return pooled.map(v => v / embedding.length);
};

// ── Helper: Cosine Similarity ──────────────────────────────────────
const cosineSimilarity = (vecA, vecB) => {
  const a = meanPool(vecA);
  const b = meanPool(vecB);
  if (!a || !b || a.length === 0 || b.length === 0) return 0;

  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};
// ─────────────────────────────────────────────
// POST /api/v1/jobs
// Access: Recruiter (status: "approved")
// ─────────────────────────────────────────────
const createJob = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body cannot be empty",
      });
    }

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

    if (!Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({
        success: false,
        message: "requirements must be a non-empty array of strings.",
      });
    }

    const allowedTypes = ["full-time", "part-time", "internship"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${allowedTypes.join(", ")}`,
      });
    }

    const allowedLocations = ["City", "Remote"];
    if (!allowedLocations.includes(location)) {
      return res.status(400).json({
        success: false,
        message: `location must be one of: ${allowedLocations.join(", ")}`,
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
      job: {
        _id: job._id,
        title: job.title,
        category: job.category,
        status: job.status,
        salary: job.salary,
        totalSlots: job.totalSlots,
        createdBy: job.createdBy,
      },
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

    const {
      _id,
      title,
      description,
      requirements,
      salary,
      category,
      status,
      createdBy,
    } = job;

    return res.status(200).json({
      success: true,
      job: {
        _id,
        title,
        description,
        requirements,
        salary,
        category,
        status,
        createdBy: {
          name: createdBy.name,
          email: createdBy.email,
        },
      },
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
    }).select(Object.keys(updateData).join(" "));

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

    // ── Keyword fallback scorer (no AI needed) ────────────────────────
    // Returns fraction of job requirements matched by user skills.
    const keywordScore = (job) => {
      const jobReqs = job.requirements || [];
      if (jobReqs.length === 0) return 0;
      const matched = jobReqs.filter(req =>
        userSkills.some(skill => req.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(req.toLowerCase()))
      ).length;
      return matched / jobReqs.length;
    };

    // ── Try AI embeddings, fall back to keyword matching if HF is down ─
    const userSkillsText = `Experienced developer with skills in ${userSkills.join(', ')}.`;
    let useEmbeddings = true;
    let userEmbedding;

    try {
      userEmbedding = await hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: userSkillsText,
        options: { wait_for_model: true }
      });
    } catch (err) {
      console.warn('HuggingFace embedding unavailable, using keyword fallback:', err.message);
      useEmbeddings = false;
    }

    // Score each job
    const jobsWithScores = await Promise.all(
      jobs.map(async (job) => {
        if (!useEmbeddings) {
          return { ...job, score: keywordScore(job) };
        }

        const reqs = job.requirements || [];
        if (reqs.length === 0) return { ...job, score: 0 };
        const jobRequirementsText = `This role requires experience with ${reqs.join(', ')}.`;

        try {
          const jobEmbedding = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: jobRequirementsText,
            options: { wait_for_model: true }
          });
          return { ...job, score: cosineSimilarity(userEmbedding, jobEmbedding) };
        } catch (err) {
          // Single job embedding failed — fall back to keyword for this job
          return { ...job, score: keywordScore(job) };
        }
      })
    );

    const recommendedJobs = jobsWithScores
      .sort((a, b) => b.score - a.score)
      .filter(job => job.score > 0);

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
      .populate('user', 'name email skills academicInformation')
      .select('status coverLetter appliedAt user')
      .lean();

    res.status(200).json({ success: true, applications });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/jobs/:jobId/applicant-summary ─────────────────────
// Recruiter only. Scores each applicant via cosine similarity and
// returns an aggregate summary for the job posting.
const getApplicantSummary = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!jobId || !mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }

    const job = await JobPost.findById(jobId).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized — you do not own this job' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('user', 'name email skills academicInformation')
      .select('status user')
      .lean();

    if (applications.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          total: 0, strong: 0, medium: 0, weak: 0,
          topSkills: [], missingSkills: [], averageScore: 0,
          recommended: []
        }
      });
    }

    const reqs = job.requirements || [];
    const jobRequirementsText = reqs.length > 0
      ? `This role requires experience with ${reqs.join(', ')}.`
      : '';

    // ── Keyword fallback scorer ───────────────────────────────────
    const keywordScore = (skills) => {
      if (!skills || skills.length === 0 || reqs.length === 0) return 0;
      const reqsLower = reqs.map(r => r.toLowerCase());
      const matches = skills.filter(s => reqsLower.some(r => r.includes(s.toLowerCase()) || s.toLowerCase().includes(r))).length;
      return matches / reqs.length;
    };

    // ── Try HuggingFace embeddings ────────────────────────────────
    let useEmbeddings = true;
    let jobEmbedding;

    if (jobRequirementsText) {
      try {
        jobEmbedding = await hf.featureExtraction({
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          inputs: jobRequirementsText,
          options: { wait_for_model: true }
        });
      } catch (err) {
        console.warn('[Summary] HF unavailable, using keyword fallback:', err.message);
        useEmbeddings = false;
      }
    } else {
      useEmbeddings = false;
    }

    // ── Score each applicant ──────────────────────────────────────
    const scored = await Promise.all(
      applications.map(async (app) => {
        const skills = app.user?.skills || [];
        let score = 0;

        if (useEmbeddings && skills.length > 0) {
          try {
            const userEmbedding = await hf.featureExtraction({
              model: 'sentence-transformers/all-MiniLM-L6-v2',
              inputs: `Experienced developer with skills in ${skills.join(', ')}.`,
              options: { wait_for_model: true }
            });
            score = cosineSimilarity(userEmbedding, jobEmbedding);
          } catch {
            score = keywordScore(skills);
          }
        } else {
          score = keywordScore(skills);
        }

        return { app, skills, score };
      })
    );

    // ── Aggregate stats ───────────────────────────────────────────
    const STRONG = 0.55, MEDIUM = 0.35;
    let strong = 0, medium = 0, weak = 0, scoreSum = 0;

    const skillFreq = {};
    scored.forEach(({ skills, score }) => {
      scoreSum += score;
      if (score >= STRONG) strong++;
      else if (score >= MEDIUM) medium++;
      else weak++;

      skills.forEach(s => {
        const key = s.toLowerCase();
        skillFreq[key] = (skillFreq[key] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));

    // Skills in job requirements not commonly held by applicants
    const missingSkills = (job.requirements || []).filter(req => {
      const count = skillFreq[req.toLowerCase()] || 0;
      return count < applications.length * 0.5;
    });

    const recommended = scored
      .filter(({ score }) => score >= MEDIUM)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ app, score }) => ({
        _id: app._id,
        name: app.user?.name || 'Unknown',
        email: app.user?.email || '',
        score: Math.round(score * 100),
        skills: app.user?.skills || [],
        academicInformation: app.user?.academicInformation || null,
      }));

    // Build a compact academic context string for Nexi insight
    const topCandidateAcademic = recommended[0]?.academicInformation;
    let academicContext = '';
    if (topCandidateAcademic?.gpa) {
      academicContext += ` The top candidate maintains a GPA of ${topCandidateAcademic.gpa.toFixed(2)}`;
      if (topCandidateAcademic.major) academicContext += ` while pursuing ${topCandidateAcademic.major}`;
      if (topCandidateAcademic.degree) academicContext += ` (${topCandidateAcademic.degree})`;
      academicContext += '.';
    }
    const avgGpa = (() => {
      const gpas = scored.map(s => s.app.user?.academicInformation?.gpa).filter(g => g != null && g > 0);
      if (!gpas.length) return null;
      return (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2);
    })();

    res.status(200).json({
      success: true,
      summary: {
        total: applications.length,
        strong,
        medium,
        weak,
        topSkills,
        missingSkills,
        averageScore: Math.round((scoreSum / applications.length) * 100),
        recommended,
        academicContext,
        avgGpa,
      }
    });
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

// ── POST /api/v1/jobs/:id/save ────────────────────────────────────
const toggleSaveJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid job id" });
    }

    const job = await JobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (job.status !== "open") {
      return res.status(400).json({ success: false, message: "Cannot save a closed job" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isSaved = user.savedJobs.includes(jobId);

    if (isSaved) {
      user.savedJobs.pull(jobId);
      await user.save();
      return res.status(200).json({ success: true, message: "Job removed from saved", saved: false });
    } else {
      user.savedJobs.push(jobId);
      await user.save();
      return res.status(200).json({ success: true, message: "Job saved", saved: true });
    }
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/jobs/:id/report
const reportJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid job id" });
    }

    const updatedJob = await JobPost.findByIdAndUpdate(
      jobId,
      { $addToSet: { reports: req.user._id } },
      { returnDocument: "after", runValidators: true }
    ).select("reports");

    if (!updatedJob) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Job reported",
      reported: true
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/jobs/:jobId/apply ──────────────────────────────────
const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body || {};

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid job id" });
    }

    if (coverLetter !== undefined) {
      if (typeof coverLetter !== "string") {
        return res.status(400).json({ success: false, message: "coverLetter must be a string" });
      }
      if (coverLetter.trim().length > 4098) {
        return res.status(400).json({ success: false, message: "coverLetter exceeds maximum length" });
      }
    }

    const job = await JobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (job.status !== "open") {
      return res.status(400).json({ success: false, message: "Cannot apply to a closed job" });
    }

    const application = new Application({
      user: req.user._id,
      job: jobId,
      coverLetter: typeof coverLetter === "string" ? coverLetter.trim() : undefined
    });

    await application.save();

    return res.status(201).json({
      success: true,
      application: {
        _id: application._id,
        user: application.user,
        job: application.job,
        status: application.status,
        appliedAt: application.appliedAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already applied to this job" });
    }
    next(error);
  }
};

// ── POST /api/v1/jobs/:id/cover-letter-suggestion ─────────────────
// Job Seeker only. Generates an AI cover letter draft.
const getCoverLetterSuggestion = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid job id" });
    }

    const job = await JobPost.findById(jobId)
        .select("title company location requirements type description")
        .lean();

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const studentBio = typeof req.user?.bio === "string" ? req.user.bio.trim() : "";
    if (!studentBio) {
      return res.status(400).json({ success: false, message: "Student bio is required" });
    }

    const jobDescription = typeof job.description === "string" ? job.description.trim() : "";
    if (!jobDescription) {
      return res.status(400).json({ success: false, message: "Job description is required" });
    }

    const requirements = Array.isArray(job.requirements)
        ? job.requirements
            .filter((item) => typeof item === "string" && item.trim())
            .join(", ")
        : "";

    const prompt = buildCoverLetterPrompt({
      studentBio,
      jobTitle: job.title,
      company: job.company,
      jobType: job.type,
      location: job.location,
      requirements: requirements || "Not specified",
      jobDescription,
    });

    if (!process.env.HF_TOKEN) {
      return res.status(503).json({
        success: false,
        message: "Hugging Face API token is not configured",
      });
    }

    let result;
    try {
      result = await hf.chatCompletion({
        model: "Qwen/Qwen2.5-7B-Instruct:fastest",
        messages: prompt,
        max_new_tokens: 280,
        temperature: 0.7,
        top_p: 0.9,
      });
    } catch (error) {
      const message = String(error?.message || "");

      if (/provider|http error|inference|503|502|gateway/i.test(message)) {
        return res.status(502).json({
          success: false,
          message: "Hugging Face generation failed",
        });
      }

      return res.status(503).json({
        success: false,
        message: "Hugging Face generation failed",
      });
    }


    const coverLetter =
        typeof result?.choices?.[0]?.message?.content === "string"
            ? result.choices[0].message.content.trim()
            : "";

    if (!coverLetter) {
      return res.status(503).json({
        success: false,
        message: "Hugging Face returned empty output",
      });
    }

    return res.status(200).json({
      success: true,
      coverLetter,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/jobs/rewrite-requirements ────────────────────────
// Recruiter only (approved). Rewrites rough requirements into polished
// professional bullet points using the same Qwen model as cover letters.
const rewriteRequirements = async (req, res, next) => {
  try {
    if (req.user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval.',
      });
    }

    const { title, description, requirements } = req.body || {};

    if (!Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'requirements must be a non-empty array of strings.',
      });
    }

    if (!process.env.HF_TOKEN) {
      return res.status(503).json({
        success: false,
        message: 'Hugging Face API token is not configured.',
      });
    }

    const requirementsText = requirements
      .filter((r) => typeof r === 'string' && r.trim())
      .map((r) => `- ${r.trim()}`)
      .join('\n');

    const messages = [
      {
        role: 'system',
        content:
          'You are Nexi, a recruiter assistant for GIU Nexus. ' +
          'Rewrite rough job requirements into clear, professional, concise bullet points ' +
          'suitable for a job posting. Keep the meaning intact. ' +
          'Do not invent unrealistic requirements. ' +
          'Return ONLY the improved requirements as a list — one per line starting with a dash. ' +
          'No explanations, no headers, no extra text.',
      },
      {
        role: 'user',
        content:
          `Job Title: ${(title || '').trim()}\n` +
          `Job Description: ${(description || '').trim()}\n` +
          `Requirements:\n${requirementsText}`,
      },
    ];

    let result;
    try {
      result = await hf.chatCompletion({
        model: 'Qwen/Qwen2.5-7B-Instruct:fastest',
        messages,
        max_new_tokens: 400,
        temperature: 0.5,
        top_p: 0.9,
      });
    } catch (err) {
      console.error('[rewriteRequirements] HF error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Nexi could not polish this job post right now.',
      });
    }

    const raw = result?.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== 'string' || !raw.trim()) {
      return res.status(500).json({
        success: false,
        message: 'Nexi could not polish this job post right now.',
      });
    }

    // Parse lines: strip leading dashes, bullets, numbers, whitespace
    const rewrittenRequirements = raw
      .split('\n')
      .map((line) => line.replace(/^[\s\-\*\•\d\.]+/, '').trim())
      .filter(Boolean);

    if (rewrittenRequirements.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Nexi could not polish this job post right now.',
      });
    }

    return res.status(200).json({
      success: true,
      rewrittenRequirements,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/jobs/market-trends ───────────────────────────────
// Job seeker only. Aggregates open job requirements into skill/category
// frequency data and asks Nexi for a market insight paragraph.
const getMarketTrends = async (req, res, next) => {
  try {
    const jobs = await JobPost.find({ status: 'open' }).select('requirements category').lean();

    if (!jobs.length) {
      return res.status(200).json({
        success: true,
        topSkills: [],
        topCategories: [],
        recommendedSkills: [],
        insight: 'No open jobs found at the moment. Check back soon!',
      });
    }

    // Aggregate skill frequencies across all requirements arrays
    const skillFreq = {};
    const categoryFreq = {};

    for (const job of jobs) {
      // Category counts
      const cat = job.category || 'Other';
      categoryFreq[cat] = (categoryFreq[cat] || 0) + 1;

      // Skill counts (each requirement treated as a skill token)
      for (const req of job.requirements || []) {
        const key = req.trim().toLowerCase();
        if (key) skillFreq[key] = (skillFreq[key] || 0) + 1;
      }
    }

    const topSkills = Object.entries(skillFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    const topCategories = Object.entries(categoryFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));

    // Recommended = in-demand skills the user does NOT already have
    const userDoc = await User.findById(req.user._id).select('skills').lean();
    const userSkillSet = new Set(
      (userDoc?.skills || []).map(s => s.trim().toLowerCase())
    );

    const recommendedSkills = Object.entries(skillFreq)
      .filter(([skill, count]) => count >= 2 && !userSkillSet.has(skill))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill]) => skill);

    // Generate Nexi insight via HF if token present
    let insight = '';
    if (process.env.HF_TOKEN) {
      try {
        const top5 = topSkills.slice(0, 5).map(s => s.skill).join(', ');
        const topCat = topCategories.slice(0, 3).map(c => c.category).join(', ');
        const lacking = recommendedSkills.slice(0, 4).join(', ');

        const messages = [
          {
            role: 'system',
            content:
              'You are Nexi, an AI career assistant for GIU Nexus. ' +
              'Write a single paragraph (3-4 sentences) summarizing job market trends for students. ' +
              'Be helpful, friendly, and specific. No lists. No headers. Just a paragraph.',
          },
          {
            role: 'user',
            content:
              `Based on ${jobs.length} open jobs on the platform:\n` +
              `Top skills employers want: ${top5}.\n` +
              `Most active hiring categories: ${topCat}.\n` +
              `Skills the user is missing that employers want: ${lacking || 'varied'}.\n` +
              `Summarize what this specific student should focus on learning next.`,
          },
        ];

        const result = await hf.chatCompletion({
          model: 'Qwen/Qwen2.5-7B-Instruct:fastest',
          messages,
          max_new_tokens: 180,
          temperature: 0.6,
          top_p: 0.9,
        });

        const raw = result?.choices?.[0]?.message?.content;
        if (raw && typeof raw === 'string' && raw.trim()) {
          insight = raw.trim();
        }
      } catch (err) {
        console.error('[getMarketTrends] HF insight error:', err.message);
      }
    }

    if (!insight) {
      const top3 = topSkills.slice(0, 3).map(s => s.skill).join(', ');
      const missing = recommendedSkills.slice(0, 3).join(', ');
      insight = `Across ${jobs.length} open roles, the most in-demand skills are ${top3}.${missing ? ` Based on your profile, consider learning ${missing} to stand out.` : ' Keep building your skills to maximize your chances.'}`;
    }

    return res.status(200).json({
      success: true,
      topSkills,
      topCategories,
      recommendedSkills,
      insight,
    });
  } catch (error) {
    next(error);
  }
};

// ── Helper: Cover Letter Prompt ───────────────────────────────────
function buildCoverLetterPrompt({ studentBio, jobTitle, company, jobType, location, requirements, jobDescription }) {
  return [
    {
      role: "system",
      content:
          "You are a professional cover letter writer. Write concise, tailored cover letters in first person. Return only the cover letter text — no explanations, no greetings, no meta-commentary.",
    },
    {
      role: "user",
      content: `Write a concise professional cover letter for a student applying to this job.

Student bio:
${studentBio}

Job title:
${jobTitle || ""}

Company:
${company || ""}

Job type:
${jobType || ""}

Location:
${location || ""}

Job requirements:
${requirements || ""}

Job description:
${jobDescription}

The cover letter should be polite, specific to the job, written in first person, and no longer than 250 words. Do not invent experience that is not supported by the student bio. Return only the cover letter text. Do not include  /n new lines in the response`,
    },
  ];
}
module.exports = {
  getJobs,
  createJob,
  getJobById,
  deleteJob,
  updateJob,
  getRecommendedJobs,
  getJobApplicants,
  getApplicantSummary,
  getSavedJobs,
  getMyJobs,
  toggleSaveJob,
  reportJob,
  applyToJob,
  getCoverLetterSuggestion,
  rewriteRequirements,
  getMarketTrends,
};
