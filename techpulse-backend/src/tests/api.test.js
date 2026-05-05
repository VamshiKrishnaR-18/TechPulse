import { vi, describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server.js';
import { PrismaClient } from '@prisma/client';

// Mock AI Services
vi.mock('../config/groq.js', () => ({
    default: {
        chat: {
            completions: {
                create: vi.fn().mockResolvedValue({
                    choices: [{ message: { content: JSON.stringify({ suggestedQuery: 'AI' }) } }]
                })
            }
        }
    }
}));

// Mock Redis
vi.mock('redis', () => ({
    createClient: vi.fn().mockReturnValue({
        on: vi.fn(),
        connect: vi.fn().mockResolvedValue(null),
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(null),
    })
}));

// Mock Prisma
vi.mock('@prisma/client', () => {
    const mockPrisma = {
        user: {
            count: vi.fn().mockResolvedValue(0),
            findUnique: vi.fn().mockImplementation(({ where }) => {
                if (where.email.includes('example.com')) {
                    return Promise.resolve({ id: '1', email: where.email, password: 'hashedpassword' });
                }
                return Promise.resolve(null);
            }),
            create: vi.fn().mockResolvedValue({ id: '2', email: 'test@example.com' }),
        },
        newsCache: {
            findMany: vi.fn().mockResolvedValue([]),
        },
        follow: {
            findMany: vi.fn().mockResolvedValue([]),
        },
        $disconnect: vi.fn().mockResolvedValue(null),
    };
    return {
        PrismaClient: class {
            constructor() {
                return mockPrisma;
            }
        }
    };
});




// Mock bcryptjs
vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashedpassword'),
        compare: vi.fn().mockImplementation((password, hashed) => {
            return Promise.resolve(password === 'Password123!' && hashed === 'hashedpassword');
        }),
    }
}));

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