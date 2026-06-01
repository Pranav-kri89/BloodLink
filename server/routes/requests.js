
const express = require('express');
const router = express.Router();
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

const { protect } = require('../middleware/auth');
const { sendDonorNotification } = require('../utils/sendEmail');
const { sendSMSNotification } = require('../utils/smsService');

const DONATION_COOLDOWN_DAYS = 60;

// @route   POST /api/requests
// @desc    Create a blood request and notify matching donors via email
router.post('/', protect, async (req, res) => {
    try {
        const { patientName, bloodGroup, city, hospital, contactNumber, unitsNeeded, urgency } = req.body;

        const request = await BloodRequest.create({
            requester: req.user._id,
            patientName,
            bloodGroup,
            city,
            hospital,
            contactNumber,
            unitsNeeded: unitsNeeded || 1,
            urgency: urgency || 'normal'
        });

        // Find matching available donors (same blood group + same city + eligible)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DONATION_COOLDOWN_DAYS);

        const matchingDonors = await User.find({
            role: 'donor',
            available: true,
            bloodGroup: bloodGroup,
            city: new RegExp(`^${city}$`, 'i'),
            $or: [
                { lastDonationDate: { $exists: false } },
                { lastDonationDate: null },
                { lastDonationDate: { $lte: cutoffDate } }
            ]
        }).select('name email phone');

        // Create in-app notifications for matching donors
        const urgencyLabel = (urgency || 'normal').charAt(0).toUpperCase() + (urgency || 'normal').slice(1);
        const notificationPromises = matchingDonors.map(donor =>
            Notification.create({
                recipient: donor._id,
                type: 'blood_request',
                bloodRequest: request._id,
                title: `${urgencyLabel} Blood Request - ${bloodGroup} needed`,
                message: `${patientName} needs ${unitsNeeded || 1} unit(s) of ${bloodGroup} blood at ${hospital}, ${city}.`,
                requesterName: req.user.name,
                requesterEmail: req.user.email,
                requesterPhone: req.user.phone || '',
                patientName,
                bloodGroup,
                city,
                hospital,
                urgency: urgency || 'normal',
                unitsNeeded: unitsNeeded || 1,
                contactNumber
            })
        );
        await Promise.allSettled(notificationPromises);

        // Send email notifications (if configured)
        let notifiedCount = 0;
        if (matchingDonors.length > 0 && process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_gmail@gmail.com') {
            const requestDetails = {
                patientName, bloodGroup, city, hospital, contactNumber,
                unitsNeeded: unitsNeeded || 1, urgency: urgency || 'normal',
                requesterName: req.user.name, requesterEmail: req.user.email
            };
            const emailPromises = matchingDonors.map(donor =>
                sendDonorNotification(donor.email, donor.name, requestDetails)
            );
            const results = await Promise.allSettled(emailPromises);
            notifiedCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
        }

        // Send SMS notifications to matching donors with phone numbers
        let smsCount = 0;
        const donorsWithPhone = matchingDonors.filter(d => d.phone);
        if (donorsWithPhone.length > 0) {
            const smsDetails = {
                patientName, bloodGroup, city, hospital,
                urgency: urgency || 'normal', contactNumber
            };
            const smsPromises = donorsWithPhone.map(donor =>
                sendSMSNotification(donor.phone, donor.name, smsDetails)
            );
            const smsResults = await Promise.allSettled(smsPromises);
            smsCount = smsResults.filter(r => r.status === 'fulfilled' && r.value === true).length;
        }

        console.log(`Blood request created.${matchingDonors.length} donors matched, ${notifiedCount} emailed, ${smsCount} SMS sent.`);

        res.status(201).json({
            ...request.toObject(),
            matchingDonors: matchingDonors.length,
            notifiedDonors: notifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/requests/my
// @desc    Get current user's requests
router.get('/my', protect, async (req, res) => {
    try {
        const requests = await BloodRequest.find({ requester: req.user._id })
            .populate('donor', 'name phone')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/requests/:id/status
// @desc    Update request status (for requester)
router.put('/:id/status', protect, async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Ensure user is the owner of the request
        if (request.requester.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this request' });
        }

        // If status is being changed to 'fulfilled'
        if (req.body.status === 'fulfilled' && request.status !== 'fulfilled') {
            if (request.donor) {
                const donor = await User.findById(request.donor);
                if (donor) {
                    // Update donor stats
                    donor.lastDonationDate = new Date();
                    donor.available = false; // Mark as unavailable due to cooldown
                    donor.points = (donor.points || 0) + 50; // Give 50 points
                    await donor.save();

                    // Create Reward Notification
                    await Notification.create({
                        recipient: donor._id,
                        type: 'request_fulfilled',
                        title: '🎉 You earned 50 Points!',
                        message: `Thank you for donating blood to ${request.patientName}. You have been awarded 50 points and your donor level is growing!`,
                        bloodRequest: request._id,
                        patientName: request.patientName,
                        hospital: request.hospital,
                        city: request.city,
                        urgency: request.urgency,
                        unitsNeeded: request.unitsNeeded,
                        contactNumber: request.contactNumber,
                        requesterName: req.user.name
                    });
                }
            }
        }

        request.status = req.body.status || request.status;
        const updatedRequest = await request.save();
        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/requests/:id/accept
// @desc    Accept a blood request (for donor)
router.put('/:id/accept', protect, async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request is no longer pending' });
        }

        // Link donor and change status
        request.donor = req.user._id;
        request.status = 'accepted';
        await request.save();

        // Notify the requester
        await Notification.create({
            recipient: request.requester,
            type: 'request_accepted',
            title: '🎉 Request Accepted!',
            message: `${req.user.name} has accepted your blood request for ${request.patientName}. They will contact you shortly.`,
            bloodRequest: request._id,
            patientName: request.patientName,
            donorName: req.user.name,
            donorPhone: req.user.phone
        });

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/requests/donor/my
// @desc    Get donor's accepted/fulfilled requests
router.get('/donor/my', protect, async (req, res) => {
    try {
        const requests = await BloodRequest.find({ donor: req.user._id })
            .populate('requester', 'name phone')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
