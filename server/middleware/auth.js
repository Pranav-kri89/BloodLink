const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

const { getAuth } = require('@clerk/express');

// Protect routes – verify Clerk JWT and attach DB user
const protect = async (req, res, next) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const clerkId = userId;
        
        // First try to find by clerkId
        let user = await prisma.user.findUnique({
            where: { clerkId }
        });

        if (!user) {
            // Return a special error if they are authenticated via Clerk but not in DB yet
            return res.status(401).json({ message: 'User not synced in database. Please complete onboarding.', code: 'NEEDS_ONBOARDING' });
        }

        // Map id to _id for frontend compatibility
        user._id = user.id;
        
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error during authentication', error: error.message });
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
