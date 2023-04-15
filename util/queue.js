import dotenv from 'dotenv';
dotenv.config();
import amqp from 'amqplib';

let channel;
const Queue = {
    connect: async () => {
        try {
            const conn = await amqp.connect(
                `amqp://${process.env.QUEUE_USERNAME}:${process.env.QUEUE_PASSWORD}@localhost:5672`
            );
            channel = await conn.createChannel();
            await channel.assertQueue('post-queue');
            console.log('Connect to queue.');
            return conn;
        } catch (error) {
            console.log(error);
        }
    },
};

export { Queue, channel };
