import express from 'express';
import cors from 'cors';
import http from 'http';
import { socketio } from './webSocket.js';
import { Database } from './util/database.js';
import { Queue } from './util/queue.js';
import dotenv from 'dotenv';

import posts_route from './server/routes/post_route.js';
import map_route from './server/routes/map_route.js';
import profile_route from './server/routes/user_route.js';
import comment_route from './server/routes/comment_route.js';
import search_route from './server/routes/search_route.js';

dotenv.config();

const app = express();

await Database.connect();
await Queue.connect();
const server = http.createServer(app);
socketio(server);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: process.env.DOMAIN }));

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
