import util from 'util';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const authentication = async (req, res, next) => {
    let accessToken = req.get('Authorization');

    if (!accessToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    accessToken = accessToken.replace('Bearer ', '');
    try {
        const user = await util.promisify(jwt.verify)(accessToken, process.env.TOKEN_SECRET);
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

export default authentication;
