import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_CONNECTION_TIMEOUT = parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '10000', 10); // Default to 10 seconds

let redisClient: RedisClientType | null = null;

export const initializeRedisClient = async () => {
    if (redisClient && redisClient.isOpen) {
        console.log('Redis client already connected (re-used existing connection).');
        return redisClient;
    }

    redisClient = createClient({
        url: REDIS_URL,
        // Add a connect timeout option here
        socket: {
            connectTimeout: REDIS_CONNECTION_TIMEOUT,
        },
    });

    // Handle connection errors
    redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        // Do not throw here immediately, let the promise rejection handle it
    });

    try {
        await redisClient.connect();
        console.log('Redis client connected successfully!');
        return redisClient;
    } catch (err) {
        console.error('Failed to connect to Redis during initialization:', err);
        throw err; // Re-throw to be caught by startServer()
    }
};

export const getRedisClient = (): RedisClientType => {
    if (!redisClient || !redisClient.isOpen) {
        console.error('Redis client not initialized or not connected. Please ensure initializeRedisClient was awaited during startup.');
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