import dotenv from 'dotenv';
dotenv.config();
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const createPresignedUrlWithClient = async (key) => {
    const client = new S3Client({ region: process.env.S3_REGION });
    const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
    return getSignedUrl(client, command, { expiresIn: 3600 });
};

export const createPresignedUrl = async () => {
    const key = Date.now() + '-' + Math.round(Math.random() * 1e9) + '.jpg';
    return await createPresignedUrlWithClient(key);
};
