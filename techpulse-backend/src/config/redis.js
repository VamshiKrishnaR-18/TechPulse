import { createClient } from 'redis';
import logger from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
    if (process.env.NODE_ENV === 'production') {
        logger.error('Redis Client Error:', err);
    } else {
        // Quiet warning for local dev if Redis is not running
        logger.warn('Redis not available. Running without cache.');
    }
});

redisClient.on('connect', () => {
    logger.info('✅ Connected to Redis');
});

// Auto-connect
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        // Fallback for environments without Redis
        logger.warn('Redis connection failed. Caching disabled.');
    }
})();

export default redisClient;
