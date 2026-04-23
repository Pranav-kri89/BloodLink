const express = require('express');
const router = express.Router();
const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
router.get('/stats', protect, adminOnly, async (req, res) => {
    try {
        const totalDonors = await User.countDocuments({ role: 'donor' });
        const availableDonors = await User.countDocuments({ role: 'donor', available: true });
        const totalRequests = await BloodRequest.countDocuments();
        const pendingRequests = await BloodRequest.countDocuments({ status: 'pending' });
        const fulfilledRequests = await BloodRequest.countDocuments({ status: 'fulfilled' });

        // Donors by blood group
        const donorsByBloodGroup = await User.aggregate([
            { $match: { role: 'donor' } },
            { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Recent requests
        const recentRequests = await BloodRequest.find()
            .populate('requester', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            totalDonors,
            availableDonors,
            totalRequests,
            pendingRequests,
            fulfilledRequests,
            donorsByBloodGroup,
            recentRequests
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/admin/donors
// @desc    Get all donors
router.get('/donors', protect, adminOnly, async (req, res) => {
    try {
        const donors = await User.find({ role: 'donor' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(donors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/admin/requests
// @desc    Get all blood requests
router.get('/requests', protect, adminOnly, async (req, res) => {
    try {
        const requests = await BloodRequest.find()
            .populate('requester', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/admin/donors/:id
// @desc    Delete a donor
router.delete('/donors/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Donor not found' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Donor removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/admin/requests/:id
// @desc    Update request status
router.put('/requests/:id', protect, adminOnly, async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = req.body.status || request.status;
        const updated = await request.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
