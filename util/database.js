import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const Database = {
    connect: async () => {
        try {
            if (process.env.NODE_ENV === 'production') {
                await mongoose.connect(
                    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.t6hzr4h.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
                );
            } else {
                await mongoose.connect(
                    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.t6hzr4h.mongodb.net/${process.env.DB_NAME_TEST}?retryWrites=true&w=majority`
                );
            }
            console.log('Connect to database.');
        } catch (error) {
            console.log(error);
        }
    },
};

export { Database };
