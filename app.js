import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const app = express();
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

app.use(express.static('public'));
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
let client = new Map();
io.on('connection', (socket) => {
    console.log(socket.id, 'connected');
    socket.on('Map user id and socket id', function (data) {
        client.set(data.userId, socket.id);
    });
    socket.on('Refresh user newsfeed', function (data) {
        emitNewsfeedsUpdate(io);
    });
    socket.on('disconnect', (reason) => {
        client.delete(socket.id);
        console.log('disconnet', socket.id);
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

app.get('*', function (req, res) {
    res.sendFile(path.join(dirname, 'public', 'index.html'));
});

// Error handling
app.use(function (err, req, res, next) {
    console.log(err);
    res.status(500).send('Internal Server Error');
});

server.listen(process.env.PORT, () => {
    console.log(`This application is running on local host:${process.env.PORT}.`);
});

export const emitCommentMsg = (message, userId) => {
    const socketId = client.get(userId);
    if (socketId) {
        io.to(socketId).emit('New notification', message);
        console.log('send notification to socketid');
    }
};
