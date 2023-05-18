import dotenv from 'dotenv';
dotenv.config();
import amqp from 'amqplib';

let channel;
const Queue = {
    connect: async () => {
        try {
            const conn = await amqp.connect(
                `amqp://${process.env.QUEUE_USERNAME}:${process.env.QUEUE_PASSWORD}@${process.env.QUEUE_HOST}:${process.env.QUEUE_PORT}`
            );
            channel = await conn.createChannel();
            await channel.assertQueue('post-queue');
            console.log('Connect to queue.');
            return conn;
        } catch (error) {
            console.log(error);
            return setTimeout(Queue.connect, 10000);
        }
    },
};

export { Queue, channel };
