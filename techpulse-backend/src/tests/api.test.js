import request from 'supertest';
import { app } from '../../server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('🚀 TechPulse API Integration Tests', () => {
    
    // 🧹 ENTERPRISE STANDARD: Always clean up database connections after tests
    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Security & Middleware', () => {
        it('should have Helmet security headers applied', async () => {
            // We test the root route just to check headers
            const res = await request(app).get('/');
            expect(res.headers).toHaveProperty('content-security-policy');
        });
    });

    describe('API Error Handling', () => {
        it('should gracefully handle requests to unknown routes (404)', async () => {
            const res = await request(app).post('/api/this-route-does-not-exist');
            
            // It should return a 404 status code
            expect(res.statusCode).toBe(404);
        });
    });

    describe('Public Feed Access', () => {
        it('should return a feed for unauthenticated users', async () => {
            const res = await request(app).get('/api/feed');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.feed)).toBe(true);
        });

        it('should return search suggestions', async () => {
            const res = await request(app).get('/api/suggest-search?query=react');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(typeof res.body.suggestedQuery).toBe('string');
        });
    });

    describe('Authentication Flow', () => {
        const testUser = {
            email: `test-${Date.now()}@example.com`,
            password: 'Password123!'
        };

        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/register')
                .send(testUser);
            
            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('token');
        });

        it('should login an existing user', async () => {
            const res = await request(app)
                .post('/api/login')
                .send(testUser);
            
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('token');
        });

        it('should fail login with incorrect password', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ ...testUser, password: 'wrongpassword' });
            
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
});