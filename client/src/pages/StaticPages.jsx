import { useState } from 'react';

const lastUpdated = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

const s = {
    page: { maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem 5rem' },
    badge: {
        display: 'inline-block', marginBottom: '0.5rem',
        background: 'rgba(220,38,38,0.07)', color: 'var(--primary)',
        border: '1px solid rgba(220,38,38,0.18)', borderRadius: 999,
        padding: '2px 12px', fontSize: '0.72rem', fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase'
    },
    h1: {
        fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 800,
        color: 'var(--text-primary)', margin: '0 0 0.4rem',
        fontFamily: 'Outfit, sans-serif', lineHeight: 1.2
    },
    sub: { color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 2rem' },
    divider: { height: 3, width: 48, background: 'var(--primary)', borderRadius: 99, marginBottom: '2rem' },
    section: {
        marginBottom: '1.5rem', paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--border-color)'
    },
    h2: {
        fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)',
        textTransform: 'uppercase', letterSpacing: '0.07em',
        margin: '0 0 0.6rem', fontFamily: 'Outfit, sans-serif'
    },
    p: { color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem', margin: '0 0 0.5rem' },
    ul: { color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem', paddingLeft: '1.2rem', margin: '0.25rem 0 0' },
    li: { marginBottom: '0.3rem' },
    note: {
        background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)',
        borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem',
        color: 'var(--text-secondary)', marginBottom: '1.5rem'
    }
};

// ─── ABOUT US ──────────────────────────────────────────────────────────────────
export function AboutUs() {
    return (
        <div style={s.page}>
            <span style={s.badge}>About</span>
            <h1 style={s.h1}>About BloodLink</h1>
            <p style={s.sub}>Last updated: {lastUpdated}</p>
            <div style={s.divider} />

            <div style={s.section}>
                <h2 style={s.h2}>What is BloodLink</h2>
                <p style={s.p}>
                    BloodLink is an emergency response platform connecting blood donors with patients in critical need.
                    The platform uses real-time notifications, location-based matching, and live tracking to reduce
                    the time it takes to find life-saving blood.
                </p>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>Our Mission</h2>
                <p style={s.p}>
                    To ensure that no one dies waiting for blood. BloodLink is free for all donors and requesters —
                    no fees, no premium tiers. Every feature exists to save lives faster.
                </p>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>How It Works</h2>
                <p style={s.p}>
                    A requester creates a blood emergency with the required blood group, hospital, and city.
                    BloodLink instantly notifies all matching, available donors via in-app alerts, email, and SMS.
                    A donor accepts the request, travels to the hospital, and a donation is confirmed.
                    A certificate of appreciation is automatically generated for the donor.
                </p>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>Contact</h2>
                <p style={s.p}>
                    Email: <strong>bloodlink24x7@gmail.com</strong><br />
                    Location: Mangaluru, Karnataka, India
                </p>
            </div>
        </div>
    );
}

// ─── FAQ ───────────────────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{
            border: '1px solid var(--border-color)', borderRadius: 10,
            marginBottom: '0.6rem', overflow: 'hidden', background: 'var(--bg-card)'
        }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', textAlign: 'left', padding: '0.85rem 1rem',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.88rem',
                    fontFamily: 'Outfit, sans-serif', gap: '1rem'
                }}
            >
                {q}
                <span style={{
                    fontSize: '1rem', flexShrink: 0, color: 'var(--primary)',
                    transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none',
                    display: 'inline-block'
                }}>+</span>
            </button>
            {open && (
                <div style={{
                    padding: '0 1rem 0.85rem',
                    color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.88rem',
                    borderTop: '1px solid var(--border-color)'
                }}><br />{a}</div>
            )}
        </div>
    );
}

export function FAQ() {
    const faqs = [
        { q: 'How often can I donate blood?', a: 'Male donors must wait at least 90 days (3 months) between donations. Female donors must wait at least 120 days (4 months). BloodLink enforces this automatically using your recorded last donation date.' },
        { q: 'Who is eligible to donate?', a: 'Generally, donors must be between 18–65 years old, weigh at least 45 kg, and be in good health. You should not donate if you have had a recent illness, surgery, or are on certain medications. Consult a doctor if unsure.' },
        { q: 'Is BloodLink free to use?', a: 'Yes, completely. BloodLink is free for both donors and requesters. There are no hidden charges or premium features.' },
        { q: 'Who can see my phone number?', a: 'Your phone number is never shown on public listings. It is shared only with a specific requester after you explicitly accept their blood request.' },
        { q: 'What does the verification badge mean?', a: 'A verified badge indicates the donor has confirmed their phone number or has a history of successful donations on the platform.' },
        { q: 'How do I stop receiving notifications?', a: 'Toggle the Availability switch to Off in your Donor Dashboard. You will not receive any blood request alerts until you turn it back on.' },
        { q: 'What is the BloodLink Certificate?', a: 'After a confirmed donation, BloodLink generates a personalized Certificate of Appreciation for the donor, which can be downloaded as a PDF from the dashboard.' },
        { q: 'What if a blood request is fraudulent?', a: 'You can report suspicious requests from the dashboard. Admins review all reports within 24 hours. Accounts found misusing the platform are permanently banned.' },
    ];

    return (
        <div style={s.page}>
            <span style={s.badge}>FAQ</span>
            <h1 style={s.h1}>Frequently Asked Questions</h1>
            <p style={s.sub}>Common questions about donating, requesting blood, and using BloodLink.</p>
            <div style={s.divider} />
            {faqs.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
            <p style={{ ...s.p, marginTop: '1.5rem', textAlign: 'center' }}>
                Still have questions? Email us at <strong style={{ color: 'var(--primary)' }}>bloodlink24x7@gmail.com</strong>
            </p>
        </div>
    );
}

// ─── PRIVACY POLICY ────────────────────────────────────────────────────────────
export function PrivacyPolicy() {
    return (
        <div style={s.page}>
            <span style={s.badge}>Legal</span>
            <h1 style={s.h1}>Privacy Policy</h1>
            <p style={s.sub}>Last updated: {lastUpdated}</p>
            <div style={s.divider} />
            <p style={s.note}>
                By using BloodLink, you agree to the collection and use of information as described in this policy.
            </p>

            <div style={s.section}>
                <h2 style={s.h2}>Information We Collect</h2>
                <ul style={s.ul}>
                    <li style={s.li}><strong>Account details:</strong> Name, email, phone number, date of birth, and gender — collected during registration.</li>
                    <li style={s.li}><strong>Medical details:</strong> Blood group and last donation date — used only for donor matching.</li>
                    <li style={s.li}><strong>Location:</strong> City and district — used to match you with nearby requests. GPS coordinates are never collected without your permission.</li>
                    <li style={s.li}><strong>Profile picture:</strong> Optional photo stored securely and shown only on your profile.</li>
                </ul>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>How We Use Your Information</h2>
                <ul style={s.ul}>
                    <li style={s.li}>Match donors with compatible blood requests in their city.</li>
                    <li style={s.li}>Send blood request alerts via in-app, email, and SMS.</li>
                    <li style={s.li}>Generate donation certificates and maintain your donation history.</li>
                    <li style={s.li}>Prevent fraud and misuse of the platform.</li>
                </ul>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>How We Share Your Information</h2>
                <p style={s.p}>BloodLink never sells your personal data. Your contact details are shared with a requester only when you explicitly accept their blood request. We use trusted third-party services for email and SMS delivery, which process data strictly to deliver our service.</p>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>Data Security</h2>
                <p style={s.p}>All data is stored in encrypted databases. Passwords are hashed and never stored in plain text. All communication is encrypted via HTTPS. Authentication is handled by Clerk, an industry-standard identity platform.</p>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>Your Rights</h2>
                <p style={s.p}>
                    You may access, correct, or delete your data at any time. To request account deletion, email us at <strong>bloodlink24x7@gmail.com</strong>. Data is permanently deleted within 30 days of a deletion request.
                </p>
            </div>

            <div style={{ ...s.section, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                <h2 style={s.h2}>Contact</h2>
                <p style={s.p}>Privacy queries: <strong>bloodlink24x7@gmail.com</strong></p>
            </div>
        </div>
    );
}

// ─── TERMS & CONDITIONS ────────────────────────────────────────────────────────
export function Terms() {
    return (
        <div style={s.page}>
            <span style={s.badge}>Legal</span>
            <h1 style={s.h1}>Terms &amp; Conditions</h1>
            <p style={s.sub}>Last updated: {lastUpdated}</p>
            <div style={s.divider} />
            <p style={s.note}>
                By creating an account or using BloodLink, you agree to these Terms. If you do not agree, do not use the platform.
            </p>

            <div style={s.section}>
                <h2 style={s.h2}>Eligibility</h2>
                <ul style={s.ul}>
                    <li style={s.li}>You must be at least 18 years of age.</li>
                    <li style={s.li}>You must provide accurate, truthful information during registration.</li>
                    <li style={s.li}>You may not create multiple accounts or share your account with others.</li>
                </ul>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>Donor Responsibilities</h2>
                <ul style={s.ul}>
                    <li style={s.li}>You must provide your correct blood group. Providing a false blood group is a serious medical risk and results in a permanent ban.</li>
                    <li style={s.li}>By accepting a request, you confirm you are medically fit to donate on that date.</li>
                    <li style={s.li}>You must not accept requests if you are within your mandatory recovery period.</li>
                    <li style={s.li}>Repeated cancellations without a genuine reason may lead to account suspension.</li>
                </ul>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>Requester Responsibilities</h2>
                <ul style={s.ul}>
                    <li style={s.li}>Blood requests must be genuine. Creating fake requests will result in a permanent ban.</li>
                    <li style={s.li}>Donor contact details obtained through the platform must only be used to coordinate the donation.</li>
                    <li style={s.li}>Harassment of donors is strictly prohibited.</li>
                </ul>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>Prohibited Activities</h2>
                <ul style={s.ul}>
                    <li style={s.li}>Soliciting or accepting payment for blood donations. All donations must be voluntary and unpaid.</li>
                    <li style={s.li}>Creating fraudulent or duplicate accounts.</li>
                    <li style={s.li}>Attempting to access, disrupt, or exploit the platform's systems.</li>
                    <li style={s.li}>Using the platform for any purpose other than blood donation coordination.</li>
                </ul>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>Limitation of Liability</h2>
                <p style={s.p}>BloodLink is a technology platform, not a medical service provider. We do not guarantee donor availability for any request and are not liable for health outcomes from any donation or medical procedure.</p>
            </div>

            <div style={s.section}>
                <h2 style={s.h2}>Governing Law</h2>
                <p style={s.p}>These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of the courts of Mangaluru, Karnataka.</p>
            </div>

            <div style={{ ...s.section, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                <h2 style={s.h2}>Contact</h2>
                <p style={s.p}>Legal queries: <strong>bloodlink24x7@gmail.com</strong></p>
            </div>
        </div>
    );
}
