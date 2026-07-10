import { Link } from 'react-router-dom';
import { Droplets, Mail, MapPin, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer style={{ background: 'var(--bg-secondary)', borderTop: 'var(--border-width) solid var(--border-color)', paddingTop: '4rem', paddingBottom: '2rem' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
                    {/* Brand */}
                    <div style={{ gridColumn: 'span 1' }}>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.125rem' }}>
                            <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src="/logo_transparent.png" alt="Blood Link Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <span style={{ fontWeight: 850, fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Blood<span style={{ color: '#dc2626' }}>Link</span></span>
                        </Link>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.7, marginBottom: '1.25rem', maxWidth: 220, fontWeight: 600 }}>
                            A smart emergency response platform connecting donors and patients — instantly, freely, and securely.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['FB', 'X', 'IG', 'IN'].map(s => (
                                <a key={s} href="#" style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-primary)', textDecoration: 'none', transition: 'all 0.1s ease', boxShadow: '2px 2px 0px 0px var(--shadow-color)' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'var(--text-white)'; e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px 0px var(--shadow-color)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px 0px var(--shadow-color)'; }}>
                                    {s}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.125rem' }}>Product</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', listStyle: 'none' }}>
                            {[
                                { to: '/search', label: 'Find Donors' },
                                { to: '/live', label: 'Live Emergencies', badge: true },
                                { to: '/register', label: 'Become a Donor' },
                                { to: '/about', label: 'About Us' },
                                { to: '/faq', label: 'FAQ' },
                            ].map(({ to, label, badge }) => (
                                <li key={to}>
                                    <Link to={to} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.83rem', fontWeight: 650, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.1s ease' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                                        {label}
                                        {badge && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', border: '1px solid var(--border-color)', animation: 'pulse-dot 1.5s infinite' }} />}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.125rem' }}>Legal</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', listStyle: 'none' }}>
                            {[
                                { to: '/privacy', label: 'Privacy Policy' },
                                { to: '/terms', label: 'Terms & Conditions' },
                            ].map(({ to, label }) => (
                                <li key={to}>
                                    <Link to={to} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.83rem', fontWeight: 650, transition: 'color 0.1s ease' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.125rem' }}>Contact</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', listStyle: 'none' }}>
                            {[
                                { icon: MapPin, text: 'Mangaluru, Karnataka, India' },
                                { icon: Mail, text: 'bloodlink24x7@gmail.com' },
                            ].map(({ icon: Icon, text }) => (
                                <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <Icon style={{ width: 14, height: 14, color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, fontWeight: 650 }}>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Divider & Bottom */}
                <div style={{ borderTop: 'var(--border-width) solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 650 }}>
                        &copy; {year} Blood Link. All rights reserved.
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 650 }}>
                        Made with <Heart style={{ width: 12, height: 12, color: 'var(--primary)', fill: 'var(--primary)' }} /> for a better world
                    </p>
                </div>
            </div>
        </footer>
    );
}
