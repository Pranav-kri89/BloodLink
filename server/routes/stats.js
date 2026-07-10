const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   GET /api/stats
// @desc    Get system statistics for landing page
// @access  Public
router.get('/', async (req, res) => {
    try {
        const donorsCount = await prisma.user.count({
            where: { role: 'donor' }
        });

        const requestsFulfilledCount = await prisma.bloodRequest.count({
            where: { status: 'fulfilled' }
        });

        const distinctCities = await prisma.user.findMany({
            where: { city: { not: '' } },
            distinct: ['city'],
            select: { city: true }
        });
        const citiesCovered = distinctCities.length;

        // Standard metric: 1 blood donation can save up to 3 lives
        const livesSaved = requestsFulfilledCount * 3;

        res.json({
            donors: donorsCount,
            livesSaved: livesSaved,
            citiesCovered: citiesCovered,
            requestsFulfilled: requestsFulfilledCount
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
