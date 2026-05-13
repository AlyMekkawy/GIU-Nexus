const mongoose = require("mongoose")

const ApplicationSchema = new mongoose.Schema({
     user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPost',
    required: true  
  },
  coverLetter: {
    type: String,
    required: false,
    trim: true,
    maxLength: 4098
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'rejected'], 
    default: 'pending' 
  },
// Timestamp for when the application was submitted 
  appliedAt: {
    type: Date,
    default: Date.now
  }

});
// Enforce the rule that a student should not be able to apply to the same job twice[cite: 78].
// Just like setting up a composite unique key in SQL Server to ensure data integrity, 
// this compound index enforces the constraint at the schema level[cite: 79].
ApplicationSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);