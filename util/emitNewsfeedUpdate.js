const emitNewsfeedsUpdate = async (io) => {
    io.sockets.emit('Update user newsfeeds', 'Welcome!');
    console.log('Update user newsfeeds message sent to frontend');
};

export default emitNewsfeedsUpdate;
