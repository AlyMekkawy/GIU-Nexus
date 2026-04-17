const mongoose = require("mongoose");

const jobPostSchema = new mongoose.Schema({
totalSlots: {
    type: Number,
    required: true,
    min: 1
  },
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
  },
    
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("JobPost", jobPostSchema);
