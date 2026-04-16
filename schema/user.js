const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Names cannot exceed 50 characters"],
  },
    email: {
      type: String,
        //TODO: complete in the same format as the name field
    }
})