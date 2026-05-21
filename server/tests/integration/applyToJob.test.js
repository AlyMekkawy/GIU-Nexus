const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/user');
const JobPost = require('../../models/JobPost');
const Application = require('../../models/Application');

const jobsUrl = '/api/v1/jobs';

const uniqueEmail = () => `jobseeker-${Date.now()}-${Math.random().toString(16).slice(2)}@test.com`;

const buildJobPayload = (overrides = {}) => ({
    title: 'Backend Intern',
    company: 'Acme Corp',
    description: 'Build APIs for the platform.',
    requirements: ['Node.js'],
    location: 'City',
    type: 'internship',
    salary: 1500,
    totalSlots: 2,
    status: 'open',
    ...overrides,
});

const seedUser = async (overrides = {}) => {
    const payload = {
        name: 'Job Seeker',
        email: uniqueEmail(),
        password: 'Valid1!a',
        role: 'jobSeeker',
        status: 'approved',
        ...overrides,
    };

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(payload.password, salt);

    const created = await User.create({
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: payload.role,
        status: payload.status,
    });

    return { payload, created };
};

const seedUnsupportedRoleUser = async () => {
    const doc = {
        name: 'Guest User',
        email: uniqueEmail(),
        password: 'hashed-password',
        role: 'guest',
        status: 'approved',
    };

    const result = await User.collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
};

const signToken = (user, options = {}) => {
    return jwt.sign(
        { id: user._id.toString(), role: user.role, jti: 'test-jti' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', ...options }
    );
};

const getAuthHeader = async (overrides = {}) => {
    const { created } = await seedUser(overrides);
    const token = signToken(created);
    return { user: created, token };
};

const seedJob = async (overrides = {}) => {
    const { created: recruiter } = await seedUser({
        role: 'recruiter',
        status: 'approved',
        name: 'Recruiter One',
    });

    const job = await JobPost.create({
        ...buildJobPayload({ createdBy: recruiter._id }),
        ...overrides,
        createdBy: overrides.createdBy || recruiter._id,
    });

    return { job, recruiter };
};

const applyToJob = (jobId, token, payload) => {
    const requestBuilder = request(app)
        .post(`${jobsUrl}/${jobId}/apply`)
        .set('Authorization', `Bearer ${token}`);

    if (payload !== undefined) {
        return requestBuilder.send(payload);
    }

    return requestBuilder;
};

const coverLetterMax = Application.schema?.path('coverLetter')?.options?.maxLength || 200;

beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
    process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('Apply to job', () => {
    describe('Authentication/authorization', () => {
        it('missing JWT returns 401', async () => {
            const { job } = await seedJob();

            const response = await request(app)
                .post(`${jobsUrl}/${job._id}/apply`)
                .send();

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Not authorised – no token provided',
            });
        });

        it('invalid JWT returns 401', async () => {
            const { job } = await seedJob();

            const response = await request(app)
                .post(`${jobsUrl}/${job._id}/apply`)
                .set('Authorization', 'Bearer invalid.token')
                .send();

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Not authorised – invalid token',
            });
        });

        it('expired JWT returns 401', async () => {
            const { job } = await seedJob();
            const expiredToken = jwt.sign(
                { id: new mongoose.Types.ObjectId().toString(), role: 'jobSeeker', jti: 'expired' },
                process.env.JWT_SECRET,
                { expiresIn: '1ms' }
            );

            await new Promise((resolve) => setTimeout(resolve, 5));

            const response = await request(app)
                .post(`${jobsUrl}/${job._id}/apply`)
                .set('Authorization', `Bearer ${expiredToken}`)
                .send();

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Not authorised – token has expired',
            });
        });

        it('valid jobSeeker token can apply', async () => {
            const { job } = await seedJob();
            const { user, token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, { coverLetter: 'Looking forward to it.' });

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.application.user).toBe(user._id.toString());
        });

        it('valid recruiter token returns 403', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });

            const response = await applyToJob(job._id, token, {});

            expect(response.statusCode).toBe(403);
            expect(response.body).toEqual({
                success: false,
                message: "Forbidden – role 'recruiter' is not allowed to perform this action",
            });
        });

        it('valid admin token returns 403', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'admin', status: 'approved' });

            const response = await applyToJob(job._id, token, {});

            expect(response.statusCode).toBe(403);
            expect(response.body).toEqual({
                success: false,
                message: "Forbidden – role 'admin' is not allowed to perform this action",
            });
        });

        it('authenticated user with unsupported role returns 403', async () => {
            const { job } = await seedJob();
            const user = await seedUnsupportedRoleUser();
            const token = signToken(user);

            const response = await applyToJob(job._id, token, {});

            expect(response.statusCode).toBe(403);
            expect(response.body).toEqual({
                success: false,
                message: "Forbidden – role 'guest' is not allowed to perform this action",
            });
        });
    });

    describe('Route params', () => {
        it('valid existing jobId allows application', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, {});

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('valid ObjectId but nonexistent jobId returns 404', async () => {
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });
            const missingId = new mongoose.Types.ObjectId().toString();

            const response = await applyToJob(missingId, token, {});

            expect(response.statusCode).toBe(404);
            expect(response.body).toEqual({
                success: false,
                message: 'Job not found',
            });
        });

        it('invalid jobId format returns 400', async () => {
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob('not-an-id', token, {});

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toEqual(expect.any(String));
        });

        it('missing jobId cannot match route and returns 404', async () => {
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await request(app)
                .post(`${jobsUrl}//apply`)
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(response.statusCode).toBe(404);
        });
    });

    describe('Request body', () => {
        it('no request body succeeds with 201', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token);

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('empty request body succeeds with 201', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, {});

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('valid coverLetter string succeeds with 201', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, { coverLetter: 'Excited to apply!' });

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('empty coverLetter string follows current API policy', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, { coverLetter: '' });

            expect([201, 400]).toContain(response.statusCode);
            expect(response.body.success).toBe(response.statusCode === 201);
        });

        it('whitespace-only coverLetter follows current API policy', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, { coverLetter: '   ' });

            expect([201, 400]).toContain(response.statusCode);
            expect(response.body.success).toBe(response.statusCode === 201);
        });

        it('coverLetter exactly max length succeeds with 201', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });
            const coverLetter = 'A'.repeat(coverLetterMax);

            const response = await applyToJob(job._id, token, { coverLetter });

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('coverLetter over max length returns 400', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });
            const coverLetter = 'B'.repeat(coverLetterMax + 1);

            const response = await applyToJob(job._id, token, { coverLetter });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('coverLetter as number returns 400', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, { coverLetter: 123 });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('coverLetter as boolean returns 400', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, { coverLetter: true });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('coverLetter as array returns 400', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, { coverLetter: ['hello'] });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('coverLetter as object returns 400', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, { coverLetter: { text: 'hello' } });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('extra fields are ignored and cannot override protected fields', async () => {
            const { job } = await seedJob();
            const { user, token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });
            const spoofedUser = new mongoose.Types.ObjectId().toString();
            const spoofedJob = new mongoose.Types.ObjectId().toString();

            const response = await applyToJob(job._id, token, {
                coverLetter: 'Cover letter',
                status: 'shortlisted',
                user: spoofedUser,
                job: spoofedJob,
                appliedAt: '2020-01-01T00:00:00.000Z',
                extraField: 'ignore-me',
            });

            expect(response.statusCode).toBe(201);
            expect(response.body.application.status).toBe('pending');
            expect(response.body.application.user).toBe(user._id.toString());
            expect(response.body.application.job).toBe(job._id.toString());
            expect(response.body.application).not.toHaveProperty('extraField');
        });
    });

    describe('Success response', () => {
        it('returns HTTP 201 with expected structure and content-type', async () => {
            const { job } = await seedJob();
            const { user, token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, { coverLetter: 'Ready to contribute.' });

            expect(response.statusCode).toBe(201);
            expect(Object.keys(response.body).sort()).toEqual(['application', 'success']);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    application: expect.any(Object),
                })
            );
            expect(Object.keys(response.body.application).sort()).toEqual([
                '_id',
                'appliedAt',
                'job',
                'status',
                'user',
            ]);
            expect(response.body.application._id).toEqual(expect.any(String));
            expect(response.body.application.user).toBe(user._id.toString());
            expect(response.body.application.job).toBe(job._id.toString());
            expect(response.body.application.status).toBe('pending');
            expect(new Date(response.body.application.appliedAt).toString()).not.toBe('Invalid Date');
            expect(response.headers['content-type']).toContain('application/json');
        });
    });

    describe('Error response', () => {
        it('duplicate application returns 400 with spec structure', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            await applyToJob(job._id, token, { coverLetter: 'First attempt.' });
            const response = await applyToJob(job._id, token, { coverLetter: 'Second attempt.' });

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({
                success: false,
                message: 'You have already applied to this job',
            });
        });

        it('nonexistent job returns 404 with spec structure', async () => {
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });
            const missingId = new mongoose.Types.ObjectId().toString();

            const response = await applyToJob(missingId, token, {});

            expect(response.statusCode).toBe(404);
            expect(response.body).toEqual({
                success: false,
                message: 'Job not found',
            });
        });

        it('invalid coverLetter returns 400 with success false', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, { coverLetter: { invalid: true } });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toEqual(expect.any(String));
            expect(response.body).not.toHaveProperty('application');
        });

        it('invalid jobId format returns 400 with success false', async () => {
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob('bad-id', token, {});

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toEqual(expect.any(String));
            expect(response.body).not.toHaveProperty('application');
        });
    });

    describe('Database persistence', () => {
        it('successful application creates one application document', async () => {
            const { job } = await seedJob();
            const { user, token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const beforeCount = await Application.countDocuments();
            const response = await applyToJob(job._id, token, { coverLetter: 'Hello' });
            const afterCount = await Application.countDocuments();

            expect(response.statusCode).toBe(201);
            expect(afterCount).toBe(beforeCount + 1);

            const saved = await Application.findOne({ user: user._id, job: job._id }).lean();
            expect(saved).toEqual(
                expect.objectContaining({
                    user: user._id,
                    job: job._id,
                    status: 'pending',
                    coverLetter: 'Hello',
                })
            );
            expect(saved.appliedAt).toBeInstanceOf(Date);
        });

        it('failed validation does not create an application document', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const beforeCount = await Application.countDocuments();
            const response = await applyToJob(job._id, token, { coverLetter: { bad: true } });
            const afterCount = await Application.countDocuments();

            expect(response.statusCode).toBe(400);
            expect(afterCount).toBe(beforeCount);
        });

        it('failed authorization does not create an application document', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });

            const beforeCount = await Application.countDocuments();
            const response = await applyToJob(job._id, token, {});
            const afterCount = await Application.countDocuments();

            expect(response.statusCode).toBe(403);
            expect(afterCount).toBe(beforeCount);
        });

        it('nonexistent job request does not create an application document', async () => {
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });
            const missingId = new mongoose.Types.ObjectId().toString();

            const beforeCount = await Application.countDocuments();
            const response = await applyToJob(missingId, token, {});
            const afterCount = await Application.countDocuments();

            expect(response.statusCode).toBe(404);
            expect(afterCount).toBe(beforeCount);
        });

        it('duplicate application does not create a second document', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            await applyToJob(job._id, token, {});
            const response = await applyToJob(job._id, token, {});

            const applications = await Application.find({ job: job._id });
            expect(response.statusCode).toBe(400);
            expect(applications).toHaveLength(1);
        });
    });

    describe('Duplicate protection', () => {
        it('same user applying to different jobs succeeds', async () => {
            const { job: firstJob } = await seedJob();
            const { job: secondJob } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const firstResponse = await applyToJob(firstJob._id, token, {});
            const secondResponse = await applyToJob(secondJob._id, token, {});

            expect(firstResponse.statusCode).toBe(201);
            expect(secondResponse.statusCode).toBe(201);
        });

        it('different users applying to same job succeeds', async () => {
            const { job } = await seedJob();
            const first = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });
            const second = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const firstResponse = await applyToJob(job._id, first.token, {});
            const secondResponse = await applyToJob(job._id, second.token, {});

            expect(firstResponse.statusCode).toBe(201);
            expect(secondResponse.statusCode).toBe(201);
        });

        it('concurrent duplicate applications result in only one document', async () => {
            const { job } = await seedJob();
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            await Promise.all([
                applyToJob(job._id, token, {}),
                applyToJob(job._id, token, {}),
            ]);

            const applications = await Application.find({ job: job._id });
            expect(applications).toHaveLength(1);
        });
    });

    describe('Job status logic', () => {
        it('applying to an open job succeeds with 201', async () => {
            const { job } = await seedJob({ status: 'open' });
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await applyToJob(job._id, token, {});

            expect(response.statusCode).toBe(201);
        });

        it('applying to a closed job returns 400 or 403 and does not create an application', async () => {
            const { job } = await seedJob({ status: 'closed' });
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const beforeCount = await Application.countDocuments();
            const response = await applyToJob(job._id, token, {});
            const afterCount = await Application.countDocuments();

            expect([400, 403]).toContain(response.statusCode);
            expect(afterCount).toBe(beforeCount);
        });
    });
});

