/* eslint-disable no-undef */
import dotenv from 'dotenv';
dotenv.config();
import { app } from '../app.js';
import request from 'supertest';
import { truncateFakeData, createFakeData } from './fake_data_generator.js';
import { Database } from '../util/database.js';

beforeEach(async () => {
    console.log('hi');
    if (process.env.NODE_ENV !== 'test') {
        throw 'Not in test env';
    }
    await Database.connect();
    console.log('hi');
    await truncateFakeData();
    await createFakeData();
});

export const requester = request(app);
