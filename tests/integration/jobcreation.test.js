jest.mock('../../services/hfService', () => ({
    zeroShotClassification: jest.fn(),
    featureExtraction: jest.fn(),
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/user');
const JobPost = require('../../models/JobPost');
const hf = require('../../services/hfService');

const jobsUrl = '/api/v1/jobs';

const uniqueEmail = () => `recruiter-${Date.now()}-${Math.random().toString(16).slice(2)}@test.com`;

const buildJobPayload = (overrides = {}) => ({
    title: 'Backend Engineer',
    company: 'Acme Corp',
    description: 'Build backend APIs and services.',
    requirements: ['Node.js', 'SQL'],
    location: 'City',
    type: 'full-time',
    salary: 3000,
    totalSlots: 2,
    ...overrides,
});

const seedUser = async (overrides = {}) => {
    const payload = {
        name: 'Recruiter One',
        email: uniqueEmail(),
        password: 'Valid1!a',
        role: 'recruiter',
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

beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
    process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
});

beforeEach(() => {
    jest.clearAllMocks();
    hf.zeroShotClassification.mockResolvedValue([{ label: 'Backend' }]);
});

describe('Job creation', () => {
    describe('Authorization/access', () => {
        it('missing Authorization header returns 401', async () => {
            const response = await request(app)
                .post(jobsUrl)
                .send(buildJobPayload());

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Not authorised – no token provided',
            });
        });

        it('invalid JWT returns 401', async () => {
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', 'Bearer invalid.token')
                .send(buildJobPayload());

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Not authorised – invalid token',
            });
        });

        it('expired JWT returns 401', async () => {
            const expiredToken = jwt.sign(
                { id: new mongoose.Types.ObjectId().toString(), role: 'recruiter', jti: 'expired' },
                process.env.JWT_SECRET,
                { expiresIn: '1ms' }
            );

            await new Promise((resolve) => setTimeout(resolve, 5));

            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${expiredToken}`)
                .send(buildJobPayload());

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Not authorised – token has expired',
            });
        });

        it('valid jobSeeker token returns 403', async () => {
            const { token } = await getAuthHeader({ role: 'jobSeeker', status: 'approved' });

            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload());

            expect(response.statusCode).toBe(403);
            expect(response.body).toEqual({
                success: false,
                message: "Forbidden – role 'jobSeeker' is not allowed to perform this action",
            });
        });

        it('recruiter with status pending returns 403 with spec message', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'pending' });

            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload());

            expect(response.statusCode).toBe(403);
            expect(response.body).toEqual({
                success: false,
                message: 'Your account is pending approval. Wait for admin approval before posting jobs.',
            });
        });

        it('recruiter with status rejected returns 403', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'rejected' });

            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload());

            expect(response.statusCode).toBe(403);
            expect(response.body).toEqual({
                success: false,
                message: 'Your account is pending approval. Wait for admin approval before posting jobs.',
            });
        });
    });

    describe('Success', () => {
        it('approved recruiter can create a job with required fields', async () => {
            const { user, token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const payload = buildJobPayload();

            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(response.statusCode).toBe(201);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    job: expect.any(Object),
                })
            );
            expect(Object.keys(response.body.job).sort()).toEqual([
                '_id',
                'category',
                'createdBy',
                'salary',
                'status',
                'title',
                'totalSlots',
            ]);
            expect(response.body.job).toEqual(
                expect.objectContaining({
                    _id: expect.any(String),
                    title: payload.title,
                    category: 'Backend',
                    status: 'open',
                })
            );
            expect(String(response.body.job.createdBy)).toBe(user._id.toString());

            expect(hf.zeroShotClassification).toHaveBeenCalledTimes(1);
            expect(hf.zeroShotClassification).toHaveBeenCalledWith(
                expect.objectContaining({
                    inputs: payload.description,
                })
            );

            const saved = await JobPost.findById(response.body.job._id).lean();
            expect(saved).toEqual(
                expect.objectContaining({
                    title: payload.title,
                    company: payload.company,
                    description: payload.description,
                    requirements: payload.requirements,
                    location: payload.location,
                    type: payload.type,
                    salary: payload.salary,
                    totalSlots: payload.totalSlots,
                    status: 'open',
                    category: 'Backend',
                })
            );
            expect(saved.createdBy.toString()).toBe(user._id.toString());
        });

        it('client cannot override createdBy, status, or category', async () => {
            const { user, token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const payload = buildJobPayload({
                createdBy: new mongoose.Types.ObjectId().toString(),
                status: 'closed',
                category: 'Frontend',
                _id: new mongoose.Types.ObjectId().toString(),
            });

            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(response.statusCode).toBe(201);
            expect(String(response.body.job.createdBy)).toBe(user._id.toString());
            expect(response.body.job.status).toBe('open');
            expect(response.body.job.category).toBe('Backend');
            expect(response.body.job._id).not.toBe(payload._id);
            expect(response.body.job).not.toHaveProperty('company');
            expect(response.body.job).not.toHaveProperty('description');
            expect(response.body.job).not.toHaveProperty('requirements');
        });

        it('mocked classifier failure falls back to Other', async () => {
            hf.zeroShotClassification.mockRejectedValueOnce(new Error('HF down'));

            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload());

            expect(response.statusCode).toBe(201);
            expect(response.body.job.category).toBe('Other');
        });
    });

    describe('Required fields', () => {
        const expectMissingField = async (override) => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const payload = buildJobPayload(override);

            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        };

        it('missing title returns 400', async () => {
            await expectMissingField({ title: undefined });
        });

        it('missing company returns 400', async () => {
            await expectMissingField({ company: undefined });
        });

        it('missing description returns 400', async () => {
            await expectMissingField({ description: undefined });
        });

        it('missing requirements returns 400', async () => {
            await expectMissingField({ requirements: undefined });
        });

        it('missing location returns 400', async () => {
            await expectMissingField({ location: undefined });
        });

        it('missing type returns 400', async () => {
            await expectMissingField({ type: undefined });
        });

        it('empty title returns 400', async () => {
            await expectMissingField({ title: '' });
        });

        it('empty company returns 400', async () => {
            await expectMissingField({ company: '' });
        });

        it('empty description returns 400', async () => {
            await expectMissingField({ description: '' });
        });

        it('empty requirements array is accepted by current validation', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ requirements: [] }));

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('empty location returns 400', async () => {
            await expectMissingField({ location: '' });
        });

        it('empty type returns 400', async () => {
            await expectMissingField({ type: '' });
        });

        it('whitespace-only title returns 400', async () => {
            await expectMissingField({ title: '   ' });
        });

        it('whitespace-only company returns 400', async () => {
            await expectMissingField({ company: '   ' });
        });

        it('whitespace-only description returns 400', async () => {
            await expectMissingField({ description: '   ' });
        });

        it('whitespace-only location returns 400', async () => {
            await expectMissingField({ location: '   ' });
        });

        it('whitespace-only type returns 400', async () => {
            await expectMissingField({ type: '   ' });
        });
    });

    describe('Field validation', () => {
        it('requirements array with valid strings succeeds', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ requirements: ['Docker', 'Kubernetes'] }));

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('type full-time succeeds', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ type: 'full-time' }));

            expect(response.statusCode).toBe(201);
        });

        it('type part-time succeeds', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ type: 'part-time' }));

            expect(response.statusCode).toBe(201);
        });

        it('type internship succeeds', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ type: 'internship' }));

            expect(response.statusCode).toBe(201);
        });

        it('invalid type returns 400', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ type: 'contract' }));

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('incorrect type casing returns 400', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ type: 'Full-Time' }));

            expect(response.statusCode).toBe(400);
        });

        it('location Remote succeeds', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ location: 'Remote' }));

            expect(response.statusCode).toBe(201);
        });

        it('location City succeeds', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ location: 'City' }));

            expect(response.statusCode).toBe(201);
        });

        it('invalid location returns 400', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ location: 'Cairo' }));

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('salary accepts a valid number', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ salary: 5000 }));

            expect(response.statusCode).toBe(201);
            expect(response.body.job.salary).toBe(5000);
        });

        it('salary as a negative number returns 400', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ salary: -10 }));

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('salary as a non-numeric string returns 400', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ salary: 'abc' }));

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('totalSlots defaults to 1 when omitted', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const payload = buildJobPayload();
            delete payload.totalSlots;

            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(response.statusCode).toBe(201);
            expect(response.body.job.totalSlots).toBe(1);
        });

        it('totalSlots as zero returns 400', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ totalSlots: 0 }));

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('totalSlots as a negative number returns 400', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ totalSlots: -2 }));

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('totalSlots as a non-numeric string returns 400', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload({ totalSlots: 'abc' }));

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Response contract', () => {
        it('success response has exactly success and job', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload());

            expect(Object.keys(response.body).sort()).toEqual(['job', 'success']);
        });

        it('error response has exactly success and message', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(Object.keys(response.body).sort()).toEqual(['message', 'success']);
        });

        it('pending recruiter error response matches spec structure', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'pending' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload());

            expect(response.statusCode).toBe(403);
            expect(response.body).toEqual({
                success: false,
                message: 'Your account is pending approval. Wait for admin approval before posting jobs.',
            });
        });

        it('response content-type is application/json', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(buildJobPayload());

            expect(response.headers['content-type']).toContain('application/json');
        });
    });

    describe('Request body/security', () => {
        it('invalid JSON returns an error response', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'application/json')
                .send('{"title":');

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ success: false, message: 'Invalid JSON payload' });
        });

        it('missing Content-Type results in error response', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'text/plain')
                .send('title=Backend');

            expect(response.statusCode).toBeGreaterThanOrEqual(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    message: expect.any(String),
                })
            );
        });

        it('extremely long inputs are handled safely', async () => {
            const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });
            const payload = buildJobPayload({
                title: 'T'.repeat(1000),
                company: 'C'.repeat(1000),
                description: 'D'.repeat(5000),
                location: 'City',
                requirements: ['R'.repeat(2000)],
            });

            const response = await request(app)
                .post(jobsUrl)
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

            expect(response.statusCode).toBeGreaterThanOrEqual(200);
            expect(response.statusCode).toBeLessThan(500);
        });
    });
});

