const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
router.get('/stats', protect, adminOnly, async (req, res) => {
    try {
        const totalDonors = await prisma.user.count({ where: { role: 'donor' } });
        const availableDonors = await prisma.user.count({ where: { role: 'donor', available: true } });
        const totalRequests = await prisma.bloodRequest.count();
        const pendingRequests = await prisma.bloodRequest.count({ where: { status: 'pending' } });
        const fulfilledRequests = await prisma.bloodRequest.count({ where: { status: 'fulfilled' } });

        // Donors by blood group
        const donorsByBloodGroupRaw = await prisma.user.groupBy({
            by: ['bloodGroup'],
            where: { role: 'donor' },
            _count: { bloodGroup: true },
            orderBy: { bloodGroup: 'asc' }
        });
        
        const donorsByBloodGroup = donorsByBloodGroupRaw.map(g => ({
            _id: g.bloodGroup,
            count: g._count.bloodGroup
        }));

        // Recent requests
        const recentRequests = await prisma.bloodRequest.findMany({
            include: {
                requester: { select: { name: true, email: true, id: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        res.json({
            totalDonors,
            availableDonors,
            totalRequests,
            pendingRequests,
            fulfilledRequests,
            donorsByBloodGroup,
            recentRequests: recentRequests.map(r => ({ ...r, _id: r.id, requester: r.requester ? { ...r.requester, _id: r.requester.id } : null }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/admin/donors
// @desc    Get all donors
router.get('/donors', protect, adminOnly, async (req, res) => {
    try {
        const donors = await prisma.user.findMany({
            where: { role: 'donor' },
            select: {
                id: true, name: true, email: true, phone: true, role: true,
                bloodGroup: true, city: true, available: true, lastDonationDate: true,
                points: true, createdAt: true, updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(donors.map(d => ({ ...d, _id: d.id })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/admin/requests
// @desc    Get all blood requests
router.get('/requests', protect, adminOnly, async (req, res) => {
    try {
        const requests = await prisma.bloodRequest.findMany({
            include: {
                requester: { select: { name: true, email: true, phone: true, id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests.map(r => ({ ...r, _id: r.id, requester: r.requester ? { ...r.requester, _id: r.requester.id } : null })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/admin/donors/:id
// @desc    Delete a donor
router.delete('/donors/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ message: 'Donor not found' });
        }
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ message: 'Donor removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/admin/requests/:id
// @desc    Update request status
router.put('/requests/:id', protect, adminOnly, async (req, res) => {
    try {
        const request = await prisma.bloodRequest.findUnique({ where: { id: req.params.id } });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const updated = await prisma.bloodRequest.update({
            where: { id: req.params.id },
            data: { status: req.body.status || request.status }
        });
        res.json({ ...updated, _id: updated.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
