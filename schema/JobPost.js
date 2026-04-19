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
      type: Number,
      required: false,
      validate: {
        validator: function(value) {
          return value >= 0;
        },
        message: "Salary must be a positive number"
      }
    },
    category: {
        type: String,
        enum: ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"],
        default: "Other"
    },
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
