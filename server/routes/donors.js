const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/auth');

const DONATION_COOLDOWN_DAYS = 60;

// @route   GET /api/donors/search
// @desc    Search available donors by blood group and/or city
router.get('/search', async (req, res) => {
    try {
        const { bloodGroup, city } = req.query;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DONATION_COOLDOWN_DAYS);

        const whereClause = {
            role: 'donor',
            available: true,
            OR: [
                { lastDonationDate: null },
                { lastDonationDate: { lte: cutoffDate } }
            ]
        };

        if (bloodGroup) whereClause.bloodGroup = bloodGroup;
        if (city) {
            whereClause.city = {
                contains: city,
                mode: 'insensitive'
            };
        }

        const donors = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                bloodGroup: true,
                city: true,
                available: true,
                lastDonationDate: true,
                points: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // map id to _id
        const mappedDonors = donors.map(d => ({ ...d, _id: d.id }));

        res.json(mappedDonors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/donors/profile
// @desc    Update donor profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { bloodGroup, city, lastDonationDate, phone, name } = req.body;
        
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (bloodGroup) updateData.bloodGroup = bloodGroup;
        if (city) updateData.city = city;
        
        if (lastDonationDate) {
            updateData.lastDonationDate = new Date(lastDonationDate);
            // Auto-check eligibility
            const donationDate = new Date(lastDonationDate);
            const daysSinceDonation = Math.floor((Date.now() - donationDate) / (1000 * 60 * 60 * 24));
            if (daysSinceDonation < DONATION_COOLDOWN_DAYS) {
                updateData.available = false;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData
        });

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            bloodGroup: updatedUser.bloodGroup,
            city: updatedUser.city,
            available: updatedUser.available,
            lastDonationDate: updatedUser.lastDonationDate
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/donors/availability
// @desc    Toggle donor availability
router.put('/availability', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check cooldown
        if (!user.available && user.lastDonationDate) {
            const daysSinceDonation = Math.floor((Date.now() - new Date(user.lastDonationDate)) / (1000 * 60 * 60 * 24));
            if (daysSinceDonation < DONATION_COOLDOWN_DAYS) {
                const daysRemaining = DONATION_COOLDOWN_DAYS - daysSinceDonation;
                return res.status(400).json({
                    message: `You cannot donate yet. Please wait ${daysRemaining} more day(s). (60-day cooldown after last donation)`,
                    daysRemaining,
                    eligible: false
                });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { available: !user.available }
        });

        res.json({ available: updatedUser.available });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
