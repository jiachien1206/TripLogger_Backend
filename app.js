import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

import posts_route from './server/routes/post_route.js';

app.use('/api', posts_route);

// Error handling
app.use(function (err, req, res, next) {
    console.log(err);
    res.status(500).send('Internal Server Error');
});

app.listen(process.env.PORT, () => {
    console.log(`This application is running on local host:${process.env.PORT}.`);
});
