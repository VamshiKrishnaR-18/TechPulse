import { createClient } from 'redis';
import logger from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;
let isRedisAvailable = true;

try {
    redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
            reconnectStrategy: () => false // ❌ disable retry loop
        }
    });

    redisClient.on('error', (err) => {
        if (isRedisAvailable) {
            logger.warn('⚠️ Redis not available. Running without cache:', err);
            isRedisAvailable = false; // ✅ log only once
        }
    });

    redisClient.on('connect', () => {
        logger.info('✅ Connected to Redis');
        isRedisAvailable = true;
    });

    (async () => {
        try {
            await redisClient.connect();
        } catch (err) {
            logger.warn('Redis connection failed. Caching disabled.');
            redisClient = null;
        }
    })();

} catch (err) {
    logger.warn('Redis init failed. Running without cache.');
    redisClient = null;
}

export default redisClient;