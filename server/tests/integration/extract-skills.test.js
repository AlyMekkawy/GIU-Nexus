jest.mock('../../services/hfService', () => ({
	tokenClassification: jest.fn(),
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/user');
const hf = require('../../services/hfService');

const extractSkillsUrl = '/api/v1/profile/extract-skills';

const uniqueEmail = () => `seeker-${Date.now()}-${Math.random().toString(16).slice(2)}@test.com`;

const seedUser = async (overrides = {}) => {
	const payload = {
		name: 'Job Seeker',
		email: uniqueEmail(),
		password: 'Valid1!a',
		role: 'jobSeeker',
		status: 'approved',
		bio: 'Experienced frontend developer with React and Node.',
		skills: [],
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
		bio: payload.bio,
		skills: payload.skills,
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
	hf.tokenClassification.mockResolvedValue([]);
});

describe('Extract skills', () => {
	describe('Authentication/authorization', () => {
		it('missing JWT returns 401', async () => {
			const response = await request(app).post(extractSkillsUrl);

			expect(response.statusCode).toBe(401);
			expect(response.body).toEqual({
				success: false,
				message: 'Not authorised – no token provided',
			});
			expect(hf.tokenClassification).not.toHaveBeenCalled();
		});

		it('invalid JWT returns 401', async () => {
			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', 'Bearer invalid.token');

			expect(response.statusCode).toBe(401);
			expect(response.body).toEqual({
				success: false,
				message: 'Not authorised – invalid token',
			});
			expect(hf.tokenClassification).not.toHaveBeenCalled();
		});

		it('expired JWT returns 401', async () => {
			const expiredToken = jwt.sign(
				{ id: new mongoose.Types.ObjectId().toString(), role: 'jobSeeker', jti: 'expired' },
				process.env.JWT_SECRET,
				{ expiresIn: '1ms' }
			);

			await new Promise((resolve) => setTimeout(resolve, 5));

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${expiredToken}`);

			expect(response.statusCode).toBe(401);
			expect(response.body).toEqual({
				success: false,
				message: 'Not authorised – token has expired',
			});
			expect(hf.tokenClassification).not.toHaveBeenCalled();
		});

		it('valid jobSeeker token can extract skills', async () => {
			const { token } = await getAuthHeader({
				bio: 'React and Node.js developer.',
				skills: ['Existing'],
			});

			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-MISC', word: ' React ' },
				{ entity_group: 'I-MISC', word: '##JS' },
				{ entity_group: 'B-ORG', word: 'Node.js' },
				{ entity_group: 'B-MISC', word: 'reactjs' },
				{ entity_group: 'B-PER', word: 'Alice' },
				{ entity_group: 'I-LOC', word: 'Cairo' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(200);
			expect(response.headers['content-type']).toContain('application/json');
			expect(Object.keys(response.body).sort()).toEqual(['extracted', 'skills', 'success']);
			expect(response.body).toEqual({
				success: true,
				skills: ['ReactJS', 'Node.js'],
				extracted: ['ReactJS', 'Node.js'],
			});
			expect(hf.tokenClassification).toHaveBeenCalledTimes(1);
		});

		it('valid recruiter token returns 403', async () => {
			const { token } = await getAuthHeader({ role: 'recruiter', status: 'approved' });

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(403);
			expect(response.body).toEqual({
				success: false,
				message: "Forbidden – role 'recruiter' is not allowed to perform this action",
			});
			expect(hf.tokenClassification).not.toHaveBeenCalled();
		});

		it('valid admin token returns 403', async () => {
			const { token } = await getAuthHeader({ role: 'admin', status: 'approved' });

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(403);
			expect(response.body).toEqual({
				success: false,
				message: "Forbidden – role 'admin' is not allowed to perform this action",
			});
			expect(hf.tokenClassification).not.toHaveBeenCalled();
		});

		it('authenticated user with unknown role returns 403', async () => {
			const { user, token } = await getAuthHeader();
			await User.collection.updateOne(
				{ _id: user._id },
				{ $set: { role: 'mystery' } }
			);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(403);
			expect(response.body).toEqual({
				success: false,
				message: "Forbidden – role 'mystery' is not allowed to perform this action",
			});
			expect(hf.tokenClassification).not.toHaveBeenCalled();
		});
	});

	describe('Request body', () => {
		it('no request body is required', async () => {
			const { token } = await getAuthHeader({ bio: 'Kubernetes and Docker.' });
			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-MISC', word: 'Kubernetes' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(200);
			expect(response.body.success).toBe(true);
		});

		it('empty request body succeeds if user has a valid bio', async () => {
			const { token } = await getAuthHeader({ bio: 'AWS and Terraform.' });
			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-MISC', word: 'AWS' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`)
				.send({});

			expect(response.statusCode).toBe(200);
			expect(response.body.success).toBe(true);
		});

		it('request body cannot override bio, skills, user ID, role, or status', async () => {
			const { user, token } = await getAuthHeader({
				bio: 'React developer',
				skills: ['Existing'],
				role: 'jobSeeker',
				status: 'approved',
			});

			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-MISC', word: 'React' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`)
				.send({
					bio: 'Overridden',
					skills: ['Injected'],
					userId: new mongoose.Types.ObjectId().toString(),
					role: 'admin',
					status: 'rejected',
				});

			expect(response.statusCode).toBe(200);
			expect(response.body.skills).toEqual(['React']);

			const saved = await User.findById(user._id).lean();
			expect(saved.bio).toBe('React developer');
			expect(saved.role).toBe('jobSeeker');
			expect(saved.status).toBe('approved');
			expect(saved.skills).toEqual(['React']);
		});

		it('extra request fields are ignored', async () => {
			const { token } = await getAuthHeader({ bio: 'Python and Django' });
			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-MISC', word: 'Python' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`)
				.send({ extra: 'field', nested: { a: 1 } });

			expect(response.statusCode).toBe(200);
			expect(response.body.success).toBe(true);
		});
	});

	describe('Bio validation', () => {
		it('user with missing bio returns 400', async () => {
			const { token, user } = await getAuthHeader({ bio: undefined });
			await User.collection.updateOne({ _id: user._id }, { $unset: { bio: '' } });

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(400);
			expect(response.body).toEqual({
				success: false,
				message: 'Bio is empty. Update your profile first.',
			});
			expect(hf.tokenClassification).not.toHaveBeenCalled();
		});

		it('user with empty bio returns 400 with spec response', async () => {
			const { token, user } = await getAuthHeader({ bio: '' });
			await User.findByIdAndUpdate(user._id, { bio: '' });

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(400);
			expect(response.body).toEqual({
				success: false,
				message: 'Bio is empty. Update your profile first.',
			});
			expect(hf.tokenClassification).not.toHaveBeenCalled();
		});

		it('user with whitespace-only bio returns 400', async () => {
			const { token, user } = await getAuthHeader({ bio: '   ' });
			await User.findByIdAndUpdate(user._id, { bio: '   ' });

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(400);
			expect(response.body).toEqual({
				success: false,
				message: 'Bio is empty. Update your profile first.',
			});
			expect(hf.tokenClassification).not.toHaveBeenCalled();
		});
	});

	describe('Mocked NER success', () => {
		it('filters and deduplicates allowed entity tags and saves skills', async () => {
			const { user, token } = await getAuthHeader({
				bio: 'ReactJS and Node.js',
				skills: ['OldSkill'],
			});

			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-MISC', word: 'ReactJS' },
				{ entity_group: 'B-ORG', word: 'Node.js' },
				{ entity_group: 'B-PER', word: 'John' },
				{ entity_group: 'B-MISC', word: 'reactjs' },
				{ entity_group: 'I-LOC', word: 'Berlin' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`)
				.send({ bio: 'Override attempt' });

			expect(response.statusCode).toBe(200);
			expect(hf.tokenClassification).toHaveBeenCalledTimes(1);
			expect(hf.tokenClassification).toHaveBeenCalledWith(
				expect.objectContaining({ inputs: 'ReactJS and Node.js' })
			);

			const saved = await User.findById(user._id).lean();
			expect(saved.skills).toEqual(['ReactJS', 'Node.js']);
			expect(saved.bio).toBe('ReactJS and Node.js');

			expect(response.body).toEqual({
				success: true,
				skills: ['ReactJS', 'Node.js'],
				extracted: ['ReactJS', 'Node.js'],
			});
		});

		it('does not modify another user skills', async () => {
			const { user: primary, token } = await getAuthHeader({
				bio: 'GraphQL',
				skills: [],
			});
			const { user: other } = await getAuthHeader({
				bio: 'Rust',
				skills: ['Rust'],
			});

			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-MISC', word: 'GraphQL' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`)
				.send({ userId: other._id.toString() });

			expect(response.statusCode).toBe(200);

			const refreshedOther = await User.findById(other._id).lean();
			expect(refreshedOther.skills).toEqual(['Rust']);
			const refreshedPrimary = await User.findById(primary._id).lean();
			expect(refreshedPrimary.skills).toEqual(['GraphQL']);
		});
	});

	describe('NER edge cases', () => {
		it('NER returns empty array', async () => {
			const { user, token } = await getAuthHeader({
				bio: 'Empty output test',
				skills: ['Old'],
			});

			hf.tokenClassification.mockResolvedValueOnce([]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(200);
			const saved = await User.findById(user._id).lean();
			expect(saved.skills).toEqual([]);
			expect(response.body.skills).toEqual([]);
		});

		it('NER returns only unrelated entity groups', async () => {
			const { user, token } = await getAuthHeader({ bio: 'No skills' });

			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-PER', word: 'Alice' },
				{ entity_group: 'I-LOC', word: 'Paris' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(200);
			const saved = await User.findById(user._id).lean();
			expect(saved.skills).toEqual([]);
			expect(response.body.extracted).toEqual([]);
		});

		it('NER returns duplicate words with whitespace and casing variants', async () => {
			const { user, token } = await getAuthHeader({ bio: 'React' });

			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-MISC', word: '  React  ' },
				{ entity_group: 'B-MISC', word: 'react' },
				{ entity_group: 'B-MISC', word: 'REACT' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(200);
			const saved = await User.findById(user._id).lean();
			expect(saved.skills).toEqual(['React']);
			expect(response.body.skills).toEqual(['React']);
		});

		it('NER returns subword tokens and they are merged', async () => {
			const { user, token } = await getAuthHeader({ bio: 'TensorFlow' });

			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-MISC', word: 'Tensor' },
				{ entity_group: 'I-MISC', word: '##Flow' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(200);
			const saved = await User.findById(user._id).lean();
			expect(saved.skills).toEqual(['TensorFlow']);
			expect(response.body.extracted).toEqual(['TensorFlow']);
		});

		it('NER returns malformed entity objects', async () => {
			const { user, token } = await getAuthHeader({ bio: 'Malformed entities' });

			hf.tokenClassification.mockResolvedValueOnce([
				null,
				{},
				{ entity_group: 'B-MISC' },
				{ word: 'Node' },
				{ entity_group: 'B-LOC', word: 'Cairo' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(200);
			const saved = await User.findById(user._id).lean();
			expect(saved.skills).toEqual([]);
			expect(response.body.extracted).toEqual([]);
		});

		it('NER returns null', async () => {
			const { user, token } = await getAuthHeader({ bio: 'Null response' });

			hf.tokenClassification.mockResolvedValueOnce(null);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(200);
			const saved = await User.findById(user._id).lean();
			expect(saved.skills).toEqual([]);
		});

		it('NER returns a non-array response', async () => {
			const { user, token } = await getAuthHeader({ bio: 'Non-array response' });

			hf.tokenClassification.mockResolvedValueOnce({ output: [] });

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(200);
			const saved = await User.findById(user._id).lean();
			expect(saved.skills).toEqual([]);
		});
	});

	describe('Graceful failure', () => {
		it('NER failure returns existing skills unchanged', async () => {
			const { user, token } = await getAuthHeader({
				bio: 'React developer',
				skills: ['ExistingSkill'],
			});

			hf.tokenClassification.mockRejectedValueOnce(new Error('HF down'));

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(200);
			expect(response.body).toEqual({
				success: true,
				message: 'Skill extraction unavailable. Existing skills returned.',
				skills: ['ExistingSkill'],
				extracted: [],
			});

			const saved = await User.findById(user._id).lean();
			expect(saved.skills).toEqual(['ExistingSkill']);
		});
	});

	describe('Security and robustness', () => {
		it('malicious bio content does not crash the endpoint', async () => {
			const { token } = await getAuthHeader({ bio: '<script>alert("x")</script>' });
			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-MISC', word: 'alert' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBe(200);
			expect(response.body.success).toBe(true);
		});

		it('extremely long bio is handled safely', async () => {
			const { user, token } = await getAuthHeader({ bio: 'Short bio' });
			const longBio = 'A'.repeat(2000);
			await User.collection.updateOne({ _id: user._id }, { $set: { bio: longBio } });

			hf.tokenClassification.mockResolvedValueOnce([
				{ entity_group: 'B-MISC', word: 'LongBio' },
			]);

			const response = await request(app)
				.post(extractSkillsUrl)
				.set('Authorization', `Bearer ${token}`);

			expect(response.statusCode).toBeGreaterThanOrEqual(200);
			expect(response.statusCode).toBeLessThan(500);
		});
	});
});

