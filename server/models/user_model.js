import User from '../schemas/user_schema.js';

const queryAllUsers = async () => {
    const allUsers = await User.find();
    return allUsers;
};

export default { queryAllUsers };
