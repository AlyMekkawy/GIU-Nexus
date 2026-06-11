const mongoose = require('mongoose');

const questionEntrySchema = new mongoose.Schema({
  question:   { type: String, required: true },
  category:   { type: String, default: 'General' },
  answer:     { type: String, default: null },
  feedback: {
    score:             { type: Number, default: null },
    technicalAccuracy: { type: Number, default: null },
    communication:     { type: Number, default: null },
    completeness:      { type: Number, default: null },
    strengths:         { type: [String], default: [] },
    improvements:      { type: [String], default: [] },
    suggestedAnswer:   { type: String, default: null },
    strongCandidateTips: { type: [String], default: [] },
  },
}, { _id: false });

const interviewSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job:  { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost', required: true },

  status: { type: String, enum: ['active', 'completed'], default: 'active' },

  jobSnapshot: {
    title:        String,
    company:      String,
    description:  String,
    requirements: [String],
    category:     String,
  },

  userSnapshot: {
    name:     String,
    skills:   [String],
    bio:      String,
    major:    String,
    gpa:      Number,
  },

  questions: [questionEntrySchema],

  currentIndex: { type: Number, default: 0 },

  finalScores: {
    overall:           { type: Number, default: null },
    technicalAccuracy: { type: Number, default: null },
    communication:     { type: Number, default: null },
    completeness:      { type: Number, default: null },
    topStrengths:      { type: [String], default: [] },
    keyWeaknesses:     { type: [String], default: [] },
    recommendedSkills: { type: [String], default: [] },
  },

  createdAt:   { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
