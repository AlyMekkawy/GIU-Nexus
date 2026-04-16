const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters"],
        maxlength: [50, "Names cannot exceed 50 characters"],
    },
    email:{
        required: [true, "Email is required"],
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        match: [/^[^\s@]+@[^\s@]+.[^\s@]+$/, "Please provide a valid email address"]
    },
    password:{
        type: String,
        trim: true,
        minlength: [8, "Password must have at least 8 characters"],
        maxlength: [64, "Password cannot exceed 64 characters"],
        required: [true, "Password is required"],
    },
    role:{
        type: String,
        enum: ["jobSeeker", "recruiter","admin"],
        default: "jobSeeker",
        required: [true, "Role is required"],
        trim: true,
    },
    profilePicture:{
        type: String,
        trim: true,
        required: [false, "Profile picture is not required"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    bio:{
        type: String,
        trim:true,
        maxlength:[500,"Bio cannot exceed 500 characters"],
        default: ""
    },
    skills:{
        type: [String],
        default: []
    },
    status:{
        type: String,
        enum: ["pending","approved","rejected"],
        default: "pending"
    }
})