const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/user');
const JobPost = require('../../models/JobPost');

const jobsUrl = '/api/v1/jobs';

const uniqueEmail = () => `report-user-${Date.now()}-${Math.random().toString(16).slice(2)}@test.com`;

const seedUser = async (overrides = {}) => {
    const payload = {
        name: 'Report User',
        email: uniqueEmail(),
        password: 'Valid1!a',
        role: 'jobSeeker',
        status: 'approved',
        ...overrides,
    };

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(payload.password, salt);

    return User.create({
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: payload.role,
        status: payload.status,
    });
};

const signToken = (user) => {
    return jwt.sign(
        { id: user._id.toString(), role: user.role, jti: `report-${user._id}` },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

const seedJob = async (overrides = {}) => {
    const recruiter = await seedUser({
        role: 'recruiter',
        status: 'approved',
        name: 'Recruiter One',
    });

    return JobPost.create({
        title: 'Backend Intern',
        company: 'Acme Corp',
        description: 'Build APIs for the platform.',
        requirements: ['Node.js'],
        location: 'City',
        type: 'internship',
        salary: 1500,
        totalSlots: 2,
        status: 'open',
        createdBy: recruiter._id,
        ...overrides,
    });
};

const reportJob = (jobId, token) => {
    const requestBuilder = request(app).post(`${jobsUrl}/${jobId}/report`);

    if (token) {
        requestBuilder.set('Authorization', `Bearer ${token}`);
    }

    return requestBuilder.send();
};

beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
    process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
});

describe('Report job', () => {
    it('missing JWT returns 401', async () => {
        const job = await seedJob();

        const response = await reportJob(job._id);

        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            success: false,
            message: 'Not authorised – no token provided',
        });
    });

    it('authenticated user reports a job and creates reports list when empty', async () => {
        const job = await seedJob();
        const user = await seedUser();
        const token = signToken(user);

        const response = await reportJob(job._id, token);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            success: true,
            message: 'Job reported',
            reported: true,
            reportCount: 1,
        });

        const savedJob = await JobPost.findById(job._id).lean();
        expect(savedJob.reports.map(String)).toEqual([user._id.toString()]);
    });

    it('reporting the same job twice by the same user does not duplicate the user id', async () => {
        const job = await seedJob();
        const user = await seedUser();
        const token = signToken(user);

        await reportJob(job._id, token);
        const response = await reportJob(job._id, token);

        expect(response.statusCode).toBe(200);
        expect(response.body.reportCount).toBe(1);

        const savedJob = await JobPost.findById(job._id).lean();
        expect(savedJob.reports.map(String)).toEqual([user._id.toString()]);
    });

    it('different users can report the same job', async () => {
        const job = await seedJob();
        const firstUser = await seedUser();
        const secondUser = await seedUser();

        await reportJob(job._id, signToken(firstUser));
        const response = await reportJob(job._id, signToken(secondUser));

        expect(response.statusCode).toBe(200);
        expect(response.body.reportCount).toBe(2);

        const savedJob = await JobPost.findById(job._id).lean();
        expect(savedJob.reports.map(String).sort()).toEqual(
            [firstUser._id.toString(), secondUser._id.toString()].sort()
        );
    });

    it('valid ObjectId but nonexistent job returns 404', async () => {
        const user = await seedUser();
        const missingId = new mongoose.Types.ObjectId().toString();

        const response = await reportJob(missingId, signToken(user));

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
            success: false,
            message: 'Job not found',
        });
    });

    it('invalid job id returns 400', async () => {
        const user = await seedUser();

        const response = await reportJob('bad-id', signToken(user));

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: 'Invalid job id',
        });
    });
});
