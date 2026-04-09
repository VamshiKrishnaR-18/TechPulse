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
});