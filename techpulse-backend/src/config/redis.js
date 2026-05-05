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
            // Don't set to null here, we want the client instance to exist 
            // so calls like .get() just fail gracefully or we handle them
        }
    })();
} catch (err) {
    logger.warn('Redis init failed. Running without cache.');
}

export const getAffinityScore = async (userId, tag) => {
    if (!redisClient?.isOpen) return 0;
    const score = await redisClient.get(`affinity:${userId}:${tag.toLowerCase()}`);
    return parseInt(score) || 0;
};

export const incrementAffinity = async (userId, tags) => {
    if (!redisClient?.isOpen || !userId || !tags) return;
    const normalizedTags = Array.isArray(tags) ? tags : [tags];
    
    const pipeline = redisClient.multi();
    normalizedTags.forEach(tag => {
        pipeline.incrBy(`affinity:${userId}:${tag.toLowerCase()}`, 1);
        // Expire affinity scores after 30 days of inactivity
        pipeline.expire(`affinity:${userId}:${tag.toLowerCase()}`, 60 * 60 * 24 * 30);
    });
    await pipeline.exec();
};

export default redisClient;