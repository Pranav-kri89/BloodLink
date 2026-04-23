const twilio = require('twilio');

// Initialize Twilio client (if credentials are configured)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_sid') {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('Twilio SMS service initialized.');
} else {
    console.log('Twilio not configured. SMS will be logged to console (demo mode).');
}

// In-memory OTP store: { phone: { otp, expiresAt } }
const otpStore = {};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to a phone number
 */
const sendOTP = async (phone) => {
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore[phone] = { otp, expiresAt };

    const message = `Your BloodConnect verification code is: ${otp}. Valid for 5 minutes.`;

    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        try {
            await twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone.startsWith('+') ? phone : `+91${phone}`
            });
            console.log(`OTP sent to ${phone} via Twilio`);
            return { success: true, demo: false };
        } catch (error) {
            console.error(`Twilio SMS failed: ${error.message}`);
            console.log(`[DEMO MODE] OTP for ${phone}: ${otp}`);
            return { success: true, demo: true, otp };
        }
    } else {
        // Demo mode: log OTP to console
        console.log(`[DEMO MODE] OTP for ${phone}: ${otp}`);
        return { success: true, demo: true, otp };
    }
};

/**
 * Verify OTP for a phone number
 */
const verifyOTP = (phone, otp) => {
    const stored = otpStore[phone];

    if (!stored) {
        return { valid: false, message: 'No OTP found. Please request a new one.' };
    }

    if (Date.now() > stored.expiresAt) {
        delete otpStore[phone];
        return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }

    if (stored.otp !== otp) {
        return { valid: false, message: 'Invalid OTP. Please try again.' };
    }

    // OTP is valid, clean up
    delete otpStore[phone];
    return { valid: true, message: 'Phone number verified successfully!' };
};

/**
 * Send SMS notification to a donor about a blood request
 */
const sendSMSNotification = async (phone, donorName, requestDetails) => {
    const { patientName, bloodGroup, city, hospital, urgency, contactNumber } = requestDetails;
    const urgencyLabel = urgency.charAt(0).toUpperCase() + urgency.slice(1);

    const message = `BloodConnect Alert!\n${urgencyLabel}: ${patientName} needs ${bloodGroup} blood at ${hospital}, ${city}.\nContact: ${contactNumber}\nPlease help if available!`;

    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        try {
            await twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone.startsWith('+') ? phone : `+91${phone}`
            });
            console.log(`SMS notification sent to ${donorName} (${phone})`);
            return true;
        } catch (error) {
            console.error(`SMS to ${phone} failed: ${error.message}`);
            return false;
        }
    } else {
        console.log(`[DEMO MODE] SMS to ${donorName} (${phone}): ${message}`);
        return true;
    }
};

module.exports = { sendOTP, verifyOTP, sendSMSNotification };
