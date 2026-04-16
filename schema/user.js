const mongoose = require("mongoose")
const { randomUUID } = require("crypto")

const userSchema = new mongoose.Schema({
    /*
     * UUID was not explicitly required in doc, but best practice is to have it.
     * Avoids exposing MongoDB's internal _id and helps if we ever migrate databases.
     */
    userId: {
        type: String,
        required: true,
        default: () => randomUUID(),
        unique: true,
        immutable: true
    },
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
                if (this.role === "recruiter") {
                    return value !== undefined;
                }
                return value === undefined;
            },
            message: "Status should only exist for recruiters",
        }
    }
})

// Ensure `status` is only stored for recruiter accounts.
userSchema.pre("validate", function (next) {
    if (this.role !== "recruiter") {
        this.status = undefined
    }
    next()
})

module.exports = mongoose.model("User", userSchema)
