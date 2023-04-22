import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const app = express();
import cors from 'cors';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors({ origin: '*' }));
import http from 'http';
import { Server } from 'socket.io';
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.DOMAIN,
    },
});
import emitNewsfeedsUpdate from './util/emitNewsfeedUpdate.js';
io.on('connection', (socket) => {
    console.log(socket.id, 'connected');
    socket.on('Refresh user newsfeed', function (data) {
        emitNewsfeedsUpdate(io);
    });
});

import { Database } from './util/database.js';
await Database.connect();

import { Queue } from './util/queue.js';
await Queue.connect();

import posts_route from './server/routes/post_route.js';
import map_route from './server/routes/map_route.js';
import profile_route from './server/routes/user_route.js';
import comment_route from './server/routes/comment_route.js';
import search_route from './server/routes/search_route.js';
app.use('/api', posts_route);
app.use('/api', map_route);
app.use('/api', profile_route);
app.use('/api', comment_route);
app.use('/api', search_route);

// Error handling
app.use(function (err, req, res, next) {
    console.log(err);
    res.status(500).send('Internal Server Error');
});

server.listen(process.env.PORT, () => {
    console.log(`This application is running on local host:${process.env.PORT}.`);
});

export const getSocketServer = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
