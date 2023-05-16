import fakeData from './fake_data.js';
import User from '../server/schemas/user_schema.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

export const createFakeData = async () => {
    const { name, email, password, location_pre, type_pre, provider } = fakeData.fakeUser[0];
    const hash = await bcrypt.hash(password, parseInt(process.env.PWD_SALT_ROUNDS));
    const encrypedUser = {
        name,
        email,
        password: hash,
        location_pre,
        type_pre,
        provider,
    };
    await User.create(encrypedUser);
};
export const truncateFakeData = async () => {
    await User.deleteMany();
};
