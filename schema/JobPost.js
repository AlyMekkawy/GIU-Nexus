const mongoose = require("mongoose");

const jobPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  company: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  requirements: {
    type: [String],
    required: true,
    default: []
  }
});

module.exports = mongoose.model("JobPost", jobPostSchema);