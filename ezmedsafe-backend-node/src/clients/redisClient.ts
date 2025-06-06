import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'; // Use Docker service name 'redis' for inter-container communication, or localhost:6379 for external

let redisClient: RedisClientType | null = null;

export const initializeRedisClient = async () => {
    if (redisClient && redisClient.isOpen) {
        console.log('Redis client already connected.');
        return redisClient;
    }

    redisClient = createClient({
        url: REDIS_URL,
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));

    try {
        await redisClient.connect();
        console.log('Redis client connected successfully!');
        return redisClient;
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        throw err;
    }
};

export const getRedisClient = (): RedisClientType => {
    if (!redisClient || !redisClient.isOpen) {
        // In a real app, you might have a more robust retry/reconnect strategy
        console.error('Redis client not initialized or not connected. Please ensure initializeRedisClient was called.');
        throw new Error('Redis client not ready');
    }
    return redisClient;
};

export const disconnectRedisClient = async () => {
    if (redisClient && redisClient.isOpen) {
        await redisClient.disconnect();
        console.log('Redis client disconnected.');
    }
};