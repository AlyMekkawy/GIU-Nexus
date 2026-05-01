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
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        unique: true,
        maxLength: 50,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"]
    },
    /*
     * Stores the user's password hash.
     * The API accepts a plaintext password; it is validated by the auth layer then saved in database.
     * Waiting for a response from the TA regarding this design decision.
     */
    password:{
        type: String,
        required: true,
        select: false
    },
    role:{
        type: String,
        enum: ["jobSeeker", "recruiter","admin"],
        default: "jobSeeker",
        required: [true, "Role is required"],
    },
    profilePicture:{
        type: String,
        trim: true,
        maxLength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    bio:{
        type: String,
        trim:true,
        maxlength:[500,"Bio cannot exceed 500 characters"]
    },
    skills:{
        type: [String],
        default: []
    },
    /*
     * Recruiters are the only role who will have a status. Other roles will have status as 'undefined'
     * Other roles will not have this attribute.
     */
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        required: function () {
            return this.role === "recruiter"
        },
        default: function () {
            return this.role === "recruiter" ? "pending" : undefined
        },
        validate: {
            validator: function (value) {
                if (value === undefined || value === null) {
                    return this.role !== "recruiter"
                }
                return this.role === "recruiter"
            },
            message: "Status is only applicable to recruiters",
        }
    },
    resetPasswordToken: {
        type: String,
        select: false,
    },
    resetPasswordExpire: {
        type: Date,
        select: false,
    },
})

module.exports = mongoose.model("User", userSchema)
