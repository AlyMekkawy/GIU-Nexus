/*
    This file serves no real purpose but just an example of what tests should look like.
 */

const request = require('supertest');
const app = require('../../app');

describe('Health check', () => {
    it('should return Nexus API running message', async () => {
        const response = await request(app).get('/');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            message: 'Nexus API running.',
        });
    });
});