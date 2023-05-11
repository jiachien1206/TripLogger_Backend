import { Server } from 'socket.io';

let io;

export const socketIO = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.DOMAIN,
        },
    });

    io.on('connection', (socket) => {
        console.log(socket.id, 'connected');

        socket.on('Join user id room', function (data) {
            socket.join(data.userId);
            console.log(socket.rooms);
        });

        socket.on('Refresh user newsfeed', function (data) {
            io.emit('Update user newsfeeds', 'Welcome!');
            console.log('Update user newsfeeds message sent to frontend');
        });

        socket.on('Read notification', function (data) {
            io.to(data.userId).emit('Browser read notification', 'Read');
        });

        socket.on('disconnect', (reason) => {
            console.log('disconnet', socket.id);
        });
    });
};

export const emitCommentMsg = (message, userId) => {
    if (userId) {
        io.to(userId).emit('New notification', message);
        console.log('Send notification to user room');
    }
};
