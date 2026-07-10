const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { clerkMiddleware } = require('@clerk/express');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const { initSocket } = require('./socket');
initSocket(server);

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(clerkMiddleware());

app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    const authStatus = authHeader ? (authHeader.startsWith('Bearer ') ? (authHeader === 'Bearer active' ? 'Bearer active (DUMMY!)' : 'Bearer JWT') : 'Invalid format') : 'None';
    console.log(`[REQUEST] ${req.method} ${req.url} - Auth: ${authStatus}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/stats', require('./routes/stats'));

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Blood Donor Management System API is running' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
