import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import router from '../src/routes/index.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(router);
app.use(errorHandler);

describe('Auth API', () => {
  it('should return 400 for invalid signup data', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ email: 'invalid-email', password: '123' });
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Feed API', () => {
  it('should return 200 for public feed', async () => {
    const res = await request(app).get('/api/feed');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
