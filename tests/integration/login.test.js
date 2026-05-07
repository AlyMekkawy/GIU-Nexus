const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const User = require('../../models/user');
const { authLimiter } = require('../../middleware/rateLimiter');

const loginUrl = '/api/v1/auth/login';
const profileUrl = '/api/v1/profile';

const uniqueEmail = () => `login-${Date.now()}-${Math.random().toString(16).slice(2)}@test.com`;

const buildUser = (overrides = {}) => ({
    name: 'Login User',
    email: uniqueEmail(),
    password: 'Valid1!a',
    role: 'jobSeeker',
    skills: ['JavaScript', 'Node.js'],
    profilePicture: 'https://example.com/pic.jpg',
    ...overrides,
});

const seedUser = async (overrides = {}) => {
    const payload = buildUser(overrides);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(payload.password, salt);
    const created = await User.create({
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: payload.role,
        status: payload.status,
        profilePicture: payload.profilePicture,
        skills: payload.skills,
    });

    return { payload, created };
};

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

describe('Auth login', () => {
    describe('Success', () => {
        it('logs in with valid email/password and returns expected payload', async () => {
            const { payload, created } = await seedUser({ role: 'jobSeeker' });

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeTruthy();
            expect(response.body.user).toEqual(
                expect.objectContaining({
                    _id: created._id.toString(),
                    name: payload.name,
                    email: payload.email.toLowerCase(),
                    role: 'jobSeeker',
                    status: 'approved',
                    profilePicture: payload.profilePicture,
                    skills: payload.skills,
                })
            );
            expect(response.body.user).not.toHaveProperty('password');

            const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
            expect(decoded).toEqual(
                expect.objectContaining({
                    id: created._id.toString(),
                    role: 'jobSeeker',
                    jti: expect.any(String),
                })
            );
            expect(decoded.exp).toBeGreaterThan(decoded.iat);
        });

        it('returns recruiter role and pending status for recruiter login', async () => {
            const { payload } = await seedUser({ role: 'recruiter' });

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });

            expect(response.statusCode).toBe(200);
            expect(response.body.user).toEqual(
                expect.objectContaining({
                    role: 'recruiter',
                    status: 'pending',
                })
            );
        });

        it('allows rejected recruiter to log in and returns status', async () => {
            const { payload } = await seedUser({ role: 'recruiter', status: 'rejected' });

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });

            expect(response.statusCode).toBe(200);
            expect(response.body.user).toEqual(
                expect.objectContaining({
                    role: 'recruiter',
                    status: 'rejected',
                })
            );
        });

        it('token can be used on protected routes', async () => {
            const { payload } = await seedUser();

            const loginResponse = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });

            const response = await request(app)
                .get(profileUrl)
                .set('Authorization', `Bearer ${loginResponse.body.token}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toEqual(
                expect.objectContaining({
                    email: payload.email.toLowerCase(),
                    role: 'jobSeeker',
                })
            );
        });

        it('token differs across multiple logins', async () => {
            const { payload } = await seedUser();

            const first = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });
            const second = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });

            expect(first.statusCode).toBe(200);
            expect(second.statusCode).toBe(200);
            expect(first.body.token).not.toBe(second.body.token);
        });

        it('token expiry matches configured duration', async () => {
            const { payload } = await seedUser();

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });

            const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
            const delta = decoded.exp - decoded.iat;
            expect(delta).toBeGreaterThanOrEqual(3590);
            expect(delta).toBeLessThanOrEqual(3610);
        });

        it('does not create a new user document or alter role/password', async () => {
            const { payload, created } = await seedUser({ role: 'jobSeeker' });
            const beforeCount = await User.countDocuments();
            const beforeUser = await User.findById(created._id).select('+password');

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });

            const afterCount = await User.countDocuments();
            const afterUser = await User.findById(created._id).select('+password');

            expect(response.statusCode).toBe(200);
            expect(afterCount).toBe(beforeCount);
            expect(afterUser.role).toBe(beforeUser.role);
            expect(afterUser.password).toBe(beforeUser.password);
        });

        it('ignores extra fields in request body', async () => {
            const { payload, created } = await seedUser({ role: 'jobSeeker' });

            const response = await request(app)
                .post(loginUrl)
                .send({
                    email: payload.email,
                    password: payload.password,
                    role: 'admin',
                    status: 'rejected',
                    isAdmin: true,
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.user).toEqual(
                expect.objectContaining({
                    _id: created._id.toString(),
                    role: 'jobSeeker',
                    status: 'approved',
                })
            );
        });
    });

    describe('Required fields', () => {
        const expectBadRequest = (statusCode) => {
            expect([400, 401]).toContain(statusCode);
        };

        it('missing email returns 400/401', async () => {
            const response = await request(app).post(loginUrl).send({ password: 'Valid1!a' });
            expectBadRequest(response.statusCode);
            expect(response.body.success).toBe(false);
        });

        it('missing password returns 400/401', async () => {
            const response = await request(app).post(loginUrl).send({ email: uniqueEmail() });
            expectBadRequest(response.statusCode);
            expect(response.body.success).toBe(false);
        });

        it('missing both email and password returns 400/401', async () => {
            const response = await request(app).post(loginUrl).send({});
            expectBadRequest(response.statusCode);
            expect(response.body.success).toBe(false);
        });

        it('empty email returns 400/401', async () => {
            const response = await request(app).post(loginUrl).send({ email: '', password: 'Valid1!a' });
            expectBadRequest(response.statusCode);
            expect(response.body.success).toBe(false);
        });

        it('empty password returns 400/401', async () => {
            const response = await request(app).post(loginUrl).send({ email: uniqueEmail(), password: '' });
            expectBadRequest(response.statusCode);
            expect(response.body.success).toBe(false);
        });

        it('whitespace-only email returns 400/401', async () => {
            const response = await request(app)
                .post(loginUrl)
                .send({ email: '   ', password: 'Valid1!a' });
            expectBadRequest(response.statusCode);
            expect(response.body.success).toBe(false);
        });

        it('whitespace-only password returns 400/401', async () => {
            const response = await request(app)
                .post(loginUrl)
                .send({ email: uniqueEmail(), password: '   ' });
            expectBadRequest(response.statusCode);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Invalid credentials', () => {
        it('nonexistent email returns 401 with error contract', async () => {
            const response = await request(app)
                .post(loginUrl)
                .send({ email: uniqueEmail(), password: 'Valid1!a' });

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({ success: false, message: 'Invalid email or password' });
            expect(response.body).not.toHaveProperty('token');
            expect(response.body).not.toHaveProperty('user');
        });

        it('existing email with wrong password returns 401', async () => {
            const { payload } = await seedUser();

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: 'Wrong1!a' });

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({ success: false, message: 'Invalid email or password' });
        });

        it('wrong email with valid password returns 401', async () => {
            const { payload } = await seedUser();

            const response = await request(app)
                .post(loginUrl)
                .send({ email: uniqueEmail(), password: payload.password });

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({ success: false, message: 'Invalid email or password' });
        });

        it('incorrect password casing fails', async () => {
            const { payload } = await seedUser({ password: 'Case1!A' });

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: 'case1!a' });

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({ success: false, message: 'Invalid email or password' });
        });

        it('email casing mismatch is normalized and logs in', async () => {
            const { payload } = await seedUser({ email: 'Sara@Example.com' });

            const response = await request(app)
                .post(loginUrl)
                .send({ email: 'sara@example.com', password: payload.password });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toEqual(
                expect.objectContaining({
                    email: 'sara@example.com',
                })
            );
        });

        it('leading/trailing spaces in email are tolerated and log in', async () => {
            const { payload } = await seedUser();

            const response = await request(app)
                .post(loginUrl)
                .send({ email: ` ${payload.email} `, password: payload.password });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toEqual(
                expect.objectContaining({
                    email: payload.email.toLowerCase(),
                })
            );
        });

        it('does not return token/user for failed login attempts', async () => {
            const { payload } = await seedUser();

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: 'Wrong1!a' });

            expect(response.statusCode).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body).not.toHaveProperty('token');
            expect(response.body).not.toHaveProperty('user');
        });
    });

    describe('Response contract', () => {
        it('returns expected success shape', async () => {
            const { payload } = await seedUser();

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    token: expect.any(String),
                    user: expect.any(Object),
                })
            );
        });

        it('does not expose sensitive fields', async () => {
            const { payload } = await seedUser();

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });

            expect(response.body.user).not.toHaveProperty('password');
            expect(response.body.user).not.toHaveProperty('resetPasswordToken');
            expect(response.body.user).not.toHaveProperty('resetPasswordExpire');
            expect(response.body.user).not.toHaveProperty('resetPasswordOtp');
            expect(response.body.user).not.toHaveProperty('resetPasswordOtpExpire');
            expect(response.body.user).not.toHaveProperty('__v');
        });
    });

    describe('Request body/security', () => {
        it('invalid JSON returns an error response', async () => {
            const response = await request(app)
                .post(loginUrl)
                .set('Content-Type', 'application/json')
                .send('{"email":');

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({ success: false, message: 'Invalid JSON payload' });
        });

        it('missing Content-Type results in error response', async () => {
            const response = await request(app)
                .post(loginUrl)
                .set('Content-Type', 'text/plain')
                .send('email=test@example.com&password=Valid1!a');

            expect(response.statusCode).toBeGreaterThanOrEqual(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    message: expect.any(String),
                })
            );
        });

        it('SQL/NoSQL injection-style email does not bypass authentication', async () => {
            await seedUser();

            const response = await request(app)
                .post(loginUrl)
                .send({ email: { $gt: '' }, password: 'Wrong1!a' });

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({ success: false, message: 'Invalid email or password' });
        });

        it('extremely long inputs are handled safely', async () => {
            const longEmail = `${'a'.repeat(500)}@test.com`;
            const longPassword = 'A1!' + 'a'.repeat(1000);

            const response = await request(app)
                .post(loginUrl)
                .send({ email: longEmail, password: longPassword });

            expect([400, 401]).toContain(response.statusCode);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Rate limiting', () => {
        it('requests within limit are allowed', async () => {
            const { payload } = await seedUser();

            for (let i = 0; i < 10; i += 1) {
                const response = await request(app)
                    .post(loginUrl)
                    .send({ email: payload.email, password: payload.password });
                expect(response.statusCode).toBe(200);
            }
        });

        it('request over limit returns 429 with expected structure', async () => {
            const { payload } = await seedUser();

            for (let i = 0; i < 10; i += 1) {
                await request(app)
                    .post(loginUrl)
                    .send({ email: payload.email, password: payload.password });
            }

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });

            expect(response.statusCode).toBe(429);
            expect(response.body).toEqual({
                success: false,
                message: 'Too many requests, please try again later.',
            });
        });

        it('successful login after failed attempts follows limiter policy', async () => {
            const { payload } = await seedUser();

            for (let i = 0; i < 10; i += 1) {
                await request(app)
                    .post(loginUrl)
                    .send({ email: payload.email, password: 'Wrong1!a' });
            }

            const response = await request(app)
                .post(loginUrl)
                .send({ email: payload.email, password: payload.password });

            expect([200, 429]).toContain(response.statusCode);
        });
    });
});

