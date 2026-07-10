const { Server } = require('socket.io');

let io;

module.exports = {
    initSocket: (server) => {
        io = new Server(server, {
            cors: {
                origin: process.env.CLIENT_URL || '*',
                methods: ["GET", "POST", "PUT", "DELETE"],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);

            // Join a specific room based on user ID or location
            socket.on('join', (room) => {
                socket.join(room);
                console.log(`Socket ${socket.id} joined room ${room}`);
            });

            // Handle register event (same as join, used by clients)
            socket.on('register', (userId) => {
                socket.join(userId);
                console.log(`Socket ${socket.id} registered for user ${userId}`);
            });

            // Live Location Tracking Events
            socket.on('joinTrackingRoom', ({ requestId }) => {
                const room = `track_${requestId}`;
                socket.join(room);
                console.log(`Socket ${socket.id} joined tracking room: ${room}`);
            });

            socket.on('locationUpdate', (data) => {
                // data should include: requestId, latitude, longitude, heading, speed
                if (data && data.requestId) {
                    const room = `track_${data.requestId}`;
                    // Broadcast to everyone else in the room (the requester)
                    socket.to(room).emit('donorLocationChanged', data);
                }
            });

            socket.on('arrivedAtHospital', ({ requestId }) => {
                if (requestId) {
                    const room = `track_${requestId}`;
                    io.to(room).emit('donorArrived', { requestId });
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        return io;
    },
    getIo: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
