const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get all notifications for the logged-in donor
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { recipientId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        
        // Map id to _id
        const mapped = notifications.map(n => ({ ...n, _id: n.id, bloodRequest: n.bloodRequestId }));
        res.json(mapped);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await prisma.notification.count({
            where: { recipientId: req.user.id, read: false }
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await prisma.notification.updateMany({
            where: { id: req.params.id, recipientId: req.user.id },
            data: { read: true }
        });
        
        if (notification.count === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        // Fetch the updated one to return
        const updated = await prisma.notification.findUnique({ where: { id: req.params.id } });
        res.json({ ...updated, _id: updated.id, bloodRequest: updated.bloodRequestId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
router.put('/read-all', protect, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { recipientId: req.user.id, read: false },
            data: { read: true }
        });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Delete all notifications for the logged-in user
router.delete('/clear-all', protect, async (req, res) => {
    try {
        const result = await prisma.notification.deleteMany({
            where: { recipientId: req.user.id }
        });
        res.json({ message: 'All notifications cleared successfully', count: result.count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
router.delete('/:id', protect, async (req, res) => {
    try {
        const result = await prisma.notification.deleteMany({
            where: { id: req.params.id, recipientId: req.user.id }
        });
        
        if (result.count === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        res.json({ message: 'Notification removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
