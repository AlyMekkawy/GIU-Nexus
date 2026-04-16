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
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'rejected'], 
    default: 'pending' 
  },

})