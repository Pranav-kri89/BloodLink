const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/auth');
const { sendDonorNotification } = require('../utils/sendEmail');
const { sendSMSNotification } = require('../utils/smsService');

const DONATION_COOLDOWN_DAYS = 60;

// @route   POST /api/requests
// @desc    Create a blood request and notify matching donors via email
router.post('/', protect, async (req, res) => {
    try {
        const { patientName, bloodGroup, city, hospital, contactNumber, unitsNeeded, urgency } = req.body;

        const request = await prisma.bloodRequest.create({
            data: {
                requesterId: req.user.id,
                patientName,
                bloodGroup,
                city,
                hospital,
                contactNumber,
                unitsNeeded: unitsNeeded || 1,
                urgency: urgency || 'normal'
            }
        });

        // Find matching available donors (same blood group + same city + eligible)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DONATION_COOLDOWN_DAYS);

        const matchingDonors = await prisma.user.findMany({
            where: {
                role: 'donor',
                available: true,
                bloodGroup: bloodGroup,
                city: {
                    equals: city,
                    mode: 'insensitive' // case-insensitive match
                },
                OR: [
                    { lastDonationDate: null },
                    { lastDonationDate: { lte: cutoffDate } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true
            }
        });

        // Create in-app notifications for matching donors
        const urgencyLabel = (urgency || 'normal').charAt(0).toUpperCase() + (urgency || 'normal').slice(1);
        
        const notificationsData = matchingDonors.map(donor => ({
            recipientId: donor.id,
            type: 'blood_request',
            bloodRequestId: request.id,
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
        }));

        if (notificationsData.length > 0) {
            await prisma.notification.createMany({
                data: notificationsData
            });
        }

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
            ...request,
            _id: request.id,
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
        const requests = await prisma.bloodRequest.findMany({
            where: { requesterId: req.user.id },
            include: {
                donor: {
                    select: { name: true, phone: true, id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        // Map id to _id
        const mappedRequests = requests.map(r => ({
            ...r,
            _id: r.id,
            donor: r.donor ? { ...r.donor, _id: r.donor.id } : null
        }));
        
        res.json(mappedRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/requests/:id/status
// @desc    Update request status (for requester)
router.put('/:id/status', protect, async (req, res) => {
    try {
        const request = await prisma.bloodRequest.findUnique({
            where: { id: req.params.id }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Ensure user is the owner of the request
        if (request.requesterId !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to update this request' });
        }

        // If status is being changed to 'fulfilled'
        if (req.body.status === 'fulfilled' && request.status !== 'fulfilled') {
            if (request.donorId) {
                const donor = await prisma.user.findUnique({ where: { id: request.donorId } });
                if (donor) {
                    // Update donor stats
                    await prisma.user.update({
                        where: { id: donor.id },
                        data: {
                            lastDonationDate: new Date(),
                            available: false,
                            points: { increment: 50 }
                        }
                    });

                    // Create Reward Notification
                    await prisma.notification.create({
                        data: {
                            recipientId: donor.id,
                            type: 'request_fulfilled',
                            title: '🎉 You earned 50 Points!',
                            message: `Thank you for donating blood to ${request.patientName}. You have been awarded 50 points and your donor level is growing!`,
                            bloodRequestId: request.id,
                            patientName: request.patientName,
                            hospital: request.hospital,
                            city: request.city,
                            urgency: request.urgency,
                            unitsNeeded: request.unitsNeeded,
                            contactNumber: request.contactNumber,
                            requesterName: req.user.name
                        }
                    });
                }
            }
        }

        const updatedRequest = await prisma.bloodRequest.update({
            where: { id: request.id },
            data: { status: req.body.status || request.status }
        });
        
        res.json({ ...updatedRequest, _id: updatedRequest.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/requests/:id/accept
// @desc    Accept a blood request (for donor)
router.put('/:id/accept', protect, async (req, res) => {
    try {
        const request = await prisma.bloodRequest.findUnique({
            where: { id: req.params.id }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request is no longer pending' });
        }

        // Link donor and change status
        const updatedRequest = await prisma.bloodRequest.update({
            where: { id: request.id },
            data: {
                donorId: req.user.id,
                status: 'accepted'
            }
        });

        // Notify the requester
        await prisma.notification.create({
            data: {
                recipientId: request.requesterId,
                type: 'general', // Use general or add 'request_accepted' to schema enum later if needed. Schema says blood_request, request_fulfilled, general
                title: '🎉 Request Accepted!',
                message: `${req.user.name} has accepted your blood request for ${request.patientName}. They will contact you shortly.`,
                bloodRequestId: request.id,
                patientName: request.patientName,
                requesterName: req.user.name,
                requesterPhone: req.user.phone
            }
        });

        res.json({ ...updatedRequest, _id: updatedRequest.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/requests/donor/my
// @desc    Get donor's accepted/fulfilled requests
router.get('/donor/my', protect, async (req, res) => {
    try {
        const requests = await prisma.bloodRequest.findMany({
            where: { donorId: req.user.id },
            include: {
                requester: {
                    select: { name: true, phone: true, id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        const mappedRequests = requests.map(r => ({
            ...r,
            _id: r.id,
            requester: r.requester ? { ...r.requester, _id: r.requester.id } : null
        }));
        
        res.json(mappedRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
