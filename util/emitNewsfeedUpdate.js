const emitNewsfeedsUpdate = async (io) => {
    io.sockets.emit('Update user newsfeeds', 'Hello there!');
    console.log('Send to frontend');
};

export default emitNewsfeedsUpdate;
