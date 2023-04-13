import dotenv from 'dotenv';
dotenv.config();
import Redis from 'ioredis';

const redis = new Redis({
    port: process.env.CACHE_REDIS_PORT,
    host: process.env.CACHE_REDIS_HOST,
    username: process.env.CACHE_REDIS_USERNAME,
    password: process.env.CACHE_REDIS_PASSWORD,
    db: process.env.CACHE_REDIS_DB,
    retryStrategy: function (times) {
        if (times < 3) {
            return 100;
        } else {
            return 6000;
        }
    },
});

export default redis;
