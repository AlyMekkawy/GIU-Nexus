const mongoose = require("mongoose");

const jobPostSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    trim: true
  },

  type: {
    type: String,
    enum: ["full-time", "part-time", "internship"],
    required: true
  },

  salary: {
    type: Number
  },

  category: {
    type: String,
    enum: ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"],
    default: "Other"
  } 


});

module.exports = mongoose.model("JobPost", jobPostSchema);
