import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

const Database = {
    connect: async () => {
        try {
            await mongoose.connect(
                `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.t6hzr4h.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
            );
            console.log('Database is connected.');
        } catch (error) {
            console.log(error);
        }
    },
};

export { Database };
