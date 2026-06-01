const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { protect } = require('../middleware/auth');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, role, bloodGroup, city } = req.body;

        // Check if user exists
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                role: role || 'donor',
                bloodGroup: bloodGroup || '',
                city: city || ''
            }
        });

        res.status(201).json({
            _id: user.id, // mapped to _id for frontend compatibility
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            bloodGroup: user.bloodGroup,
            city: user.city,
            available: user.available,
            token: generateToken(user.id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login user & return JWT
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            bloodGroup: user.bloodGroup,
            city: user.city,
            available: user.available,
            lastDonationDate: user.lastDonationDate,
            token: generateToken(user.id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ 
            where: { id: req.user.id }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove password before sending
        const { password, ...userWithoutPassword } = user;
        
        res.json({
            ...userWithoutPassword,
            _id: user.id // mapping
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
