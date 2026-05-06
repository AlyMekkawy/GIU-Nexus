const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const User = require('../../models/user');
const { authLimiter } = require('../../middleware/rateLimiter');

const registerUrl = '/api/v1/auth/register';

const uniqueEmail = () => `user-${Date.now()}-${Math.random().toString(16).slice(2)}@test.com`;

const buildPayload = (overrides = {}) => ({
    name: 'Test User',
    email: uniqueEmail(),
    password: 'Valid1!a',
    role: 'jobSeeker',
    ...overrides,
});

const resetRateLimiter = async () => {
    if (typeof authLimiter.resetKey === 'function') {
        await authLimiter.resetKey('127.0.0.1');
        await authLimiter.resetKey('::ffff:127.0.0.1');
        return;
    }

    if (authLimiter.store && typeof authLimiter.store.resetKey === 'function') {
        await authLimiter.store.resetKey('127.0.0.1');
        await authLimiter.store.resetKey('::ffff:127.0.0.1');
    }
};

beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
    process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
});

beforeEach(async () => {
    await resetRateLimiter();
});

afterEach(async () => {
    await resetRateLimiter();
});

describe('Auth register', () => {
    describe('Success', () => {
        it('creates jobSeeker with 201, token, user object, and approved status', async () => {
            const payload = buildPayload({ role: 'jobSeeker' });

            const response = await request(app)
                .post(registerUrl)
                .send(payload);

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeTruthy();
            expect(response.body.user).toEqual(
                expect.objectContaining({
                    name: payload.name,
                    email: payload.email.toLowerCase(),
                    role: 'jobSeeker',
                    status: 'approved',
                })
            );
            expect(response.body.user).not.toHaveProperty('password');

            const savedUser = await User.findOne({ email: payload.email }).select('+password');
            expect(savedUser).toBeTruthy();
            expect(savedUser.password).toBeTruthy();
            expect(savedUser.password).not.toBe(payload.password);
            expect(await bcrypt.compare(payload.password, savedUser.password)).toBe(true);
        });

        it('creates recruiter with 201, token, user object, status pending', async () => {
            const payload = buildPayload({ role: 'recruiter' });

            const response = await request(app)
                .post(registerUrl)
                .send(payload);

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeTruthy();
            expect(response.body.user).toEqual(
                expect.objectContaining({
                    name: payload.name,
                    email: payload.email.toLowerCase(),
                    role: 'recruiter',
                    status: 'pending',
                })
            );
            expect(response.body.user).not.toHaveProperty('password');

            const savedUser = await User.findOne({ email: payload.email });
            expect(savedUser.status).toBe('pending');
        });
    });

    describe('Required fields', () => {
        const requiredErrorMessage = 'name, email, password and role are all required';

        it('missing name returns 400', async () => {
            const payload = buildPayload();
            delete payload.name;

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ success: false, message: requiredErrorMessage });
        });

        it('missing email returns 400', async () => {
            const payload = buildPayload();
            delete payload.email;

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ success: false, message: requiredErrorMessage });
        });

        it('missing password returns 400', async () => {
            const payload = buildPayload();
            delete payload.password;

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ success: false, message: requiredErrorMessage });
        });

        it('missing role returns 400', async () => {
            const payload = buildPayload();
            delete payload.role;

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ success: false, message: requiredErrorMessage });
        });

        it('empty name returns 400', async () => {
            const payload = buildPayload({ name: '' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('empty email returns 400', async () => {
            const payload = buildPayload({ email: '' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('empty password returns 400', async () => {
            const payload = buildPayload({ password: '' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('empty role returns 400', async () => {
            const payload = buildPayload({ role: '' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('whitespace name returns 400', async () => {
            const payload = buildPayload({ name: '   ' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('whitespace email returns 400', async () => {
            const payload = buildPayload({ email: '   ' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('whitespace password returns 400', async () => {
            const payload = buildPayload({ password: '   ' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('whitespace role returns 400', async () => {
            const payload = buildPayload({ role: '   ' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Validation', () => {
        it('invalid email format returns 400', async () => {
            const payload = buildPayload({ email: 'invalid-email' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('password shorter than 6 chars returns 400', async () => {
            const payload = buildPayload({ password: 'Aa1!a' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('password exactly 6 chars follows current password policy', async () => {
            const payload = buildPayload({ password: 'Aa1!a!' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('invalid role returns 400', async () => {
            const payload = buildPayload({ role: 'admin' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ success: false, message: "role must be 'jobSeeker' or 'recruiter'" });
        });

        it('incorrect role casing returns 400', async () => {
            const payload = buildPayload({ role: 'Recruiter' });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ success: false, message: "role must be 'jobSeeker' or 'recruiter'" });
        });
    });

    describe('Duplicate email', () => {
        it('duplicate email returns 400 with expected structure', async () => {
            const payload = buildPayload();

            await request(app).post(registerUrl).send(payload);
            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ success: false, message: 'Email already in use' });
        });

        it('duplicate email does not create another DB document', async () => {
            const payload = buildPayload();

            await request(app).post(registerUrl).send(payload);
            await request(app).post(registerUrl).send(payload);

            const count = await User.countDocuments({ email: payload.email.toLowerCase() });
            expect(count).toBe(1);
        });

        it('duplicate email casing returns 400', async () => {
            const payload = buildPayload({ email: 'CaseEmail@Test.com' });

            await request(app).post(registerUrl).send(payload);
            const response = await request(app)
                .post(registerUrl)
                .send({ ...payload, email: 'caseemail@test.com' });

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ success: false, message: 'Email already in use' });
        });
    });

    describe('Response contract', () => {
        it('success response has success, token, user', async () => {
            const payload = buildPayload();

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(201);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    token: expect.any(String),
                    user: expect.any(Object),
                })
            );
        });

        it('error response has success false and message', async () => {
            const payload = buildPayload();
            delete payload.email;

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    message: expect.any(String),
                })
            );
        });

        it('token is signed and contains expected claims', async () => {
            const payload = buildPayload({ role: 'recruiter' });

            const response = await request(app).post(registerUrl).send(payload);

            const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
            expect(decoded).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    role: 'recruiter',
                    jti: expect.any(String),
                })
            );
        });

        it('no sensitive/internal fields are returned', async () => {
            const payload = buildPayload();

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.body.user).not.toHaveProperty('password');
            expect(response.body.user).not.toHaveProperty('resetPasswordToken');
            expect(response.body.user).not.toHaveProperty('resetPasswordExpire');
            expect(response.body.user).not.toHaveProperty('resetPasswordOtp');
            expect(response.body.user).not.toHaveProperty('resetPasswordOtpExpire');
            expect(response.body.user).not.toHaveProperty('__v');
        });
    });

    describe('Security/body behavior', () => {
        it('extra fields cannot override server-controlled values', async () => {
            const payload = buildPayload({
                role: 'recruiter',
                status: 'approved',
                isAdmin: true,
            });

            const response = await request(app).post(registerUrl).send(payload);

            expect(response.statusCode).toBe(201);
            expect(response.body.user.status).toBe('pending');
            expect(response.body.user).not.toHaveProperty('isAdmin');

            const savedUser = await User.findOne({ email: payload.email });
            expect(savedUser.status).toBe('pending');
            expect(savedUser.isAdmin).toBeUndefined();
        });

        it('invalid JSON returns an error response', async () => {
            const response = await request(app)
                .post(registerUrl)
                .set('Content-Type', 'application/json')
                .send('{"name":');

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    message: expect.any(String),
                })
            );
        });

        it('content-type without JSON results in 400', async () => {
            const response = await request(app)
                .post(registerUrl)
                .set('Content-Type', 'text/plain')
                .send('name=Test');

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    message: expect.any(String),
                })
            );
        });
    });

    describe('Rate limiting', () => {
        it('requests within limit are allowed', async () => {
            for (let i = 0; i < 10; i += 1) {
                const payload = buildPayload();
                const response = await request(app).post(registerUrl).send(payload);
                expect(response.statusCode).toBe(201);
            }
        });

        it('request over limit returns 429 with expected structure', async () => {
            for (let i = 0; i < 10; i += 1) {
                const payload = buildPayload();
                await request(app).post(registerUrl).send(payload);
            }

            const response = await request(app).post(registerUrl).send(buildPayload());

            expect(response.statusCode).toBe(429);
            expect(response.body).toEqual({
                success: false,
                message: 'Too many requests, please try again later.',
            });
        });
    });
});
