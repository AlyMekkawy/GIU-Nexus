const mongoose = require("mongoose");

const jobPostSchema = new mongoose.Schema({
totalSlots: {
    type: Number,
    required: true,
    min: 1
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