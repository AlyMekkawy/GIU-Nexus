/**
 * GIU Nexus E2E Seed Script
 *
 * Run from backend:
 *   node scripts/seedE2E.js
 *
 * Optional:
 *   E2E_CLEAN=true node scripts/seedE2E.js
 */

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Adjust these paths if your models are named differently
const User = require("../models/User");
const Job = require("../models/JobPost");
const Application = require("../models/Application");

const MONGO_URI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;

if (!MONGO_URI) {
    console.error("Missing MongoDB connection string. Set MONGO_URI in backend .env");
    process.exit(1);
}

const PASSWORD = "Password123!";
const passwordHashRounds = 10;

const accounts = {
    student: {
        name: "E2E Student",
        email: "student.e2e@giu-nexus.com",
        password: PASSWORD,
        role: "jobSeeker",
    },
    recruiter: {
        name: "E2E Recruiter",
        email: "recruiter.e2e@giu-nexus.com",
        password: PASSWORD,
        role: "recruiter",
        isApproved: true,
        approved: true,
        status: "approved",
    },
    pendingRecruiter: {
        name: "E2E Pending Recruiter",
        email: "pending.recruiter.e2e@giu-nexus.com",
        password: PASSWORD,
        role: "recruiter",
        isApproved: false,
        approved: false,
        status: "pending",
    },
    admin: {
        name: "E2E Admin",
        email: "admin.e2e@giu-nexus.com",
        password: PASSWORD,
        role: "admin",
    },
};

const jobSeeds = [
    {
        title: "E2E Frontend Developer Intern",
        company: "GIU Nexus Test Company",
        location: "Cairo, Egypt",
        type: "internship",
        // Match allowed enum values in JobPost.schema (Frontend, Backend, AI/ML, DevOps, Data Engineering, Other)
        category: "Frontend",
        description:
            "Build responsive student-facing interfaces using React, Vite, REST APIs, and modern frontend tooling.",
        requirements: ["React", "JavaScript", "CSS", "REST APIs", "Git"],
        skills: ["React", "JavaScript", "CSS", "REST APIs", "Git"],
        salary: 10000,
        totalSlots: 3,
        // JobPost.status enum expects "open" or "closed"
        status: "open",
        isActive: true,
        isApproved: true,
    },
    {
        title: "E2E Backend Engineer",
        company: "GIU Nexus Test Company",
        location: "New Cairo, Egypt",
        type: "full-time",
        category: "Backend",
        description:
            "Develop secure APIs, MongoDB models, authentication flows, and backend services using Node.js and Express.",
        requirements: ["Node.js", "Express", "MongoDB", "JWT", "Testing"],
        skills: ["Node.js", "Express", "MongoDB", "JWT", "Testing"],
        salary: 25000,
        totalSlots: 2,
        status: "open",
        isActive: true,
        isApproved: true,
    },
    {
        title: "E2E AI Product Intern",
        company: "GIU Nexus Test Company",
        location: "Remote",
        type: "internship",
        // Use the "AI/ML" enum value defined in schema
        category: "AI/ML",
        description:
            "Work on CV parsing, job matching, skill extraction, and AI-assisted recruitment workflows.",
        requirements: ["Python", "NLP", "Machine Learning", "APIs"],
        skills: ["Python", "NLP", "Machine Learning", "APIs"],
        salary: 12000,
        totalSlots: 4,
        status: "open",
        isActive: true,
        isApproved: true,
    },
];

async function connectDb() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
}

async function disconnectDb() {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
}

async function deleteOldE2EData() {
    const e2eEmails = Object.values(accounts).map((account) => account.email);

    const oldUsers = await User.find({ email: { $in: e2eEmails } }).select("_id");
    const oldUserIds = oldUsers.map((user) => user._id);

    const oldJobs = await Job.find({
        $or: [
            { title: /^E2E / },
            { company: "GIU Nexus Test Company" },
            { recruiter: { $in: oldUserIds } },
            { recruiterId: { $in: oldUserIds } },
            { postedBy: { $in: oldUserIds } },
        ],
    }).select("_id");

    const oldJobIds = oldJobs.map((job) => job._id);

    await Application.deleteMany({
        $or: [
            { applicant: { $in: oldUserIds } },
            { applicantId: { $in: oldUserIds } },
            { student: { $in: oldUserIds } },
            { studentId: { $in: oldUserIds } },
            { user: { $in: oldUserIds } },
            { userId: { $in: oldUserIds } },
            { job: { $in: oldJobIds } },
            { jobId: { $in: oldJobIds } },
        ],
    });

    await Job.deleteMany({
        $or: [
            { _id: { $in: oldJobIds } },
            { title: /^E2E / },
            { company: "GIU Nexus Test Company" },
            { recruiter: { $in: oldUserIds } },
            { recruiterId: { $in: oldUserIds } },
            { postedBy: { $in: oldUserIds } },
        ],
    });

    await User.deleteMany({ email: { $in: e2eEmails } });

    console.log("Removed old E2E data");
}

async function createUser(account) {
    const hashedPassword = await bcrypt.hash(account.password, passwordHashRounds);

    const userPayload = {
        name: account.name,
        email: account.email,
        password: hashedPassword,
        role: account.role,

        // Common project variants. Extra fields are harmless unless your schema is strict.
        isApproved: account.isApproved,
        approved: account.approved,
        status: account.status,

        profile: {
            phone: "01000000000",
            location: "Cairo, Egypt",
            university: "German International University",
            major: "Computer Science",
            skills: ["React", "Node.js", "MongoDB", "Cypress"],
            bio: "E2E test account for GIU Nexus.",
        },
    };

    Object.keys(userPayload).forEach((key) => {
        if (userPayload[key] === undefined) delete userPayload[key];
    });

    const user = await User.create(userPayload);
    console.log(`Created ${account.role}: ${account.email}`);
    return user;
}

function withValidJobOwnerFields(job, recruiter) {
    return {
        ...job,

        // Different repos use different owner field names.
        // Keep all three unless your schema is strict and rejects unknown fields.
        recruiter: recruiter._id,
        recruiterId: recruiter._id,
        postedBy: recruiter._id,
        // This project uses `createdBy` on JobPost schema as required
        createdBy: recruiter._id,
    };
}

async function createJobs(recruiter) {
    const createdJobs = [];

    for (const jobSeed of jobSeeds) {
        // Ensure job fields conform to current JobPost schema enums
        function normalizeJobSeed(j) {
            const categoryMap = {
                "Software Engineering": "Backend",
                "Artificial Intelligence": "AI/ML",
                "AI": "AI/ML",
            };

            const statusMap = {
                active: "open",
                inactive: "closed",
                closed: "closed",
                open: "open",
            };

            const normalized = { ...j };
            if (normalized.category && categoryMap[normalized.category]) {
                normalized.category = categoryMap[normalized.category];
            }
            if (normalized.status && statusMap[normalized.status]) {
                normalized.status = statusMap[normalized.status];
            }
            return normalized;
        }

        const payload = normalizeJobSeed(withValidJobOwnerFields(jobSeed, recruiter));
        const job = await Job.create(payload);
        createdJobs.push(job);
        console.log(`Created job: ${job.title}`);
    }

    return createdJobs;
}

async function createApplication(student, job) {
    const applicationPayload = {
        // Different repos use different field names.
        job: job._id,
        jobId: job._id,

        applicant: student._id,
        applicantId: student._id,
        student: student._id,
        studentId: student._id,
        user: student._id,
        userId: student._id,

        status: "pending",
        coverLetter:
            "This is an E2E seeded application used for recruiter applicant-management tests.",
        resumeUrl: "https://example.com/e2e-resume.pdf",
        cvUrl: "https://example.com/e2e-resume.pdf",
    };

    const application = await Application.create(applicationPayload);
    console.log(`Created application: ${student.email} -> ${job.title}`);
    return application;
}

async function seedE2E() {
    await connectDb();

    try {
        await deleteOldE2EData();

        const student = await createUser(accounts.student);
        const recruiter = await createUser(accounts.recruiter);
        const pendingRecruiter = await createUser(accounts.pendingRecruiter);
        const admin = await createUser(accounts.admin);

        const jobs = await createJobs(recruiter);
        await createApplication(student, jobs[0]);

        console.log("");
        console.log("E2E seed complete");
        console.log("");
        console.log("Accounts:");
        console.log(`Student:   ${accounts.student.email} / ${PASSWORD}`);
        console.log(`Recruiter: ${accounts.recruiter.email} / ${PASSWORD}`);
        console.log(`Pending:   ${accounts.pendingRecruiter.email} / ${PASSWORD}`);
        console.log(`Admin:     ${accounts.admin.email} / ${PASSWORD}`);
        console.log("");
        console.log(`Jobs created: ${jobs.length}`);
        console.log("Applications created: 1");
    } finally {
        await disconnectDb();
    }
}

seedE2E().catch(async (error) => {
    console.error("");
    console.error("E2E seed failed");
    console.error(error);
    await disconnectDb().catch(() => {});
    process.exit(1);
});