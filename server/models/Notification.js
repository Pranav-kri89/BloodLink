const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['blood_request', 'request_fulfilled', 'general'],
        default: 'blood_request'
    },
    bloodRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodRequest'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    requesterName: String,
    requesterEmail: String,
    requesterPhone: String,
    patientName: String,
    bloodGroup: String,
    city: String,
    hospital: String,
    urgency: {
        type: String,
        enum: ['normal', 'urgent', 'critical'],
        default: 'normal'
    },
    unitsNeeded: Number,
    contactNumber: String,
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
