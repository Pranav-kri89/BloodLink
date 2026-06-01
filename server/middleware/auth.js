const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

// Protect routes – verify JWT
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });
            
            if (!user) {
                return res.status(401).json({ message: 'User no longer exists. Please register or login again.' });
            }

            // Map id to _id for frontend compatibility
            user._id = user.id;
            
            const { password, ...userWithoutPassword } = user;
            req.user = userWithoutPassword;
            
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

module.exports = { protect, adminOnly };
