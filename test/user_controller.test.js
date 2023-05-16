/* eslint-disable no-undef */
import {
    signup,
    signin,
    logout,
    checkEmail,
    getUserData,
    editUserSetting,
    generateUserNewsfeed,
    getUserPosts,
    getUserVisited,
    getUserSavedPosts,
    getUserNotification,
    readUserNotification,
} from '../server/controllers/user_controller.js';
import { truncateFakeData, createFakeData } from './fake_data_generator.js';
import { Database } from '../util/database.js';
import User from '../server/schemas/user_schema.js';
beforeAll(async () => {
    await Database.connect();
    await truncateFakeData();
    await createFakeData();
});

const newUser = {
    name: 'John',
    email: 'john@example.com',
    password: 'password',
    location_pre: ['亞洲', '歐洲', '北美洲', '大洋洲', '南美洲', '非洲', '南極洲'],
    type_pre: ['交通', '住宿', '景點', '證件', '其他', '恐怖故事', '省錢妙招'],
};

describe('User Controller', () => {
    describe('signup', () => {
        it('should create a new user', async () => {
            const req = {
                body: newUser,
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await signup(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    user: expect.objectContaining({
                        name: 'John',
                        email: 'john@example.com',
                        image: '',
                    }),
                    accessToken: expect.any(String),
                }),
            });
        }, 10000);

        it('should return an error if name, email, or password is missing', async () => {
            const req = {
                body: {
                    name: 'John',
                    email: '',
                    password: '',
                    location_pre: ['亞洲', '歐洲', '北美洲', '大洋洲', '南美洲', '非洲', '南極洲'],
                    type_pre: ['交通', '住宿', '景點', '證件', '其他', '恐怖故事', '省錢妙招'],
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await signup(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.any(String),
            });
        });
        it('should return an error if email already exist', async () => {
            const req = {
                body: {
                    name: 'nini',
                    email: 'nini@gmail.com',
                    password: '555555555',
                    location_pre: ['亞洲', '歐洲', '北美洲', '大洋洲', '南美洲', '非洲', '南極洲'],
                    type_pre: ['交通', '住宿', '景點', '證件', '其他', '恐怖故事', '省錢妙招'],
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await signup(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.any(String),
            });
        });
    });

    describe('signin', () => {
        it('should return user data and token if signed in', async () => {
            const req = {
                body: {
                    email: 'nini@gmail.com',
                    password: '00000000',
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await signin(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    user: expect.objectContaining({
                        name: 'nini',
                        email: 'nini@gmail.com',
                        image: '',
                    }),
                    accessToken: expect.any(String),
                }),
            });
        });
        it('should return error if password is wrong', async () => {
            const req = {
                body: {
                    email: 'nini@gmail.com',
                    password: '11111111',
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await signin(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.any(String),
            });
        });
    });
    describe('getUserData', () => {
        it('get user data', async () => {
            const user = await User.findOne({ email: 'nini@gmail.com' });

            const req = {
                user: {
                    id: user._id,
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await getUserData(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: user._id,
                    name: 'nini',
                    email: 'nini@gmail.com',
                    location: ['南極洲', '歐洲', '北美洲', '大洋洲', '南美洲', '非洲', '亞洲'],
                    type: ['其他', '交通', '住宿', '景點', '證件', '恐怖故事', '省錢妙招'],
                    image: '',
                    notification: undefined,
                }),
            });
        });
    });

    describe('editUserSetting', () => {
        it('edit user data and return updated relevant posts', async () => {
            const user = await User.findOne({ email: 'nini@gmail.com' });

            const req = {
                user: {
                    id: user._id,
                },
                body: {
                    name: 'nini2',
                    image: '',
                    location_pre: ['大洋洲', '南極洲', '歐洲', '北美洲', '南美洲', '非洲', '亞洲'],
                    type_pre: ['大洋洲', '南極洲', '歐洲', '北美洲', '南美洲', '非洲', '亞洲'],
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await editUserSetting(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                data: expect.any(Object),
            });
        });
    });
    describe('getUserPosts', () => {
        it("get user's posts, but user has no posts", async () => {
            const user = await User.findOne({ email: 'nini@gmail.com' });

            const req = {
                params: {
                    id: user._id,
                },
                query: {
                    num: 1000,
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await getUserPosts(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                data: expect.any(Object),
            });
            const jsonData = res.json.mock.calls[0][0].data;
            expect(jsonData.length).toBe(0);
        });
    });
    describe('getUserVisited', () => {
        it("get user's visited countries ISO3", async () => {
            const user = await User.findOne({ email: newUser.email });

            const req = {
                user: {
                    id: user._id,
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await getUserVisited(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                data: expect.any(Object),
            });
            const jsonData = res.json.mock.calls[0][0].data;
            expect(jsonData.length).toBe(0);
        });
    });
});
