'use client';

import { useState } from 'react';
import XIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import { PageHeader } from '@/components/ui';
import { CTA } from '@/components/sections';
import styles from './contact.module.css';

const FAQ = [
    { q: 'How fast do you respond?', a: 'Our average response time for business inquiries is 4 hours during business days.' },
    { q: 'Do you offer custom pricing?', a: 'Yes, we provide tailored enterprise agreements based on your specific volume and compliance needs.' },
    { q: 'Can we schedule a live demo?', a: 'Absolutely. Use the form to request a demo and our team will coordinate a session.' },
];

export default function ContactPage() {
    const [open, setOpen] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        organization: '',
        userType: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    access_key: 'c755ba58-1a02-45d6-b021-3b66f62eb9fb', // 👈 Replace with your key from web3forms.com
                    name: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    organization: formData.organization,
                    userType: formData.userType,
                    message: formData.message,
                    subject: `New Contact Form Submission from ${formData.fullName}`,
                    from_name: 'TalentMesh Contact Form',
                }),
            });

            if (response.ok) {
                setSent(true);
            } else {
                const errorData = await response.text();
                console.error('Server responded with error:', errorData);
                alert(`Server Error: ${response.status}. Please try again later.`);
            }
        } catch (error) {
            // This captures network errors, CORS blocks, and DNS issues
            console.error('CRITICAL: Connection failed.', error);
            alert('Connection failed. This is usually due to an Ad-Blocker or a CORS security block in your browser. Check the Console (F12) for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.page}>
            <PageHeader
                title="Let's build"
                highlight="together"
                description="Have a question or looking for a partnership? Our team is ready to assist you."
                breadcrumb="Contact Us"
            />

            {/* ── Content ── */}
            <div className={styles.mainLayout}>
                {/* Left side */}
                <div className={styles.contactInfo}>
                    <div className={styles.infoBlock}>
                        <span className={styles.infoLabel}>General Inquiries</span>
                        <a href="mailto:info@talentmeshsolutions.com" className={styles.infoValue}>info@talentmeshsolutions.com</a>
                    </div>
                    <div className={styles.infoBlock}>
                        <span className={styles.infoLabel}>Contact Number</span>
                        <a href="tel:+919898161106" className={styles.infoValue}>+91 98981 61106</a>
                    </div>
                    <div className={styles.infoBlock}>
                        <span className={styles.infoLabel}>Headquarters</span>
                        <span className={styles.infoValue}>Ahmedabad, India</span>
                        <span className={styles.infoSub}>
                            3rd Floor, Chinubhai House,<br />
                            7-B Amrutbaug Colony, Navjivan,<br />
                            Ahmedabad, Gujarat 380014
                        </span>
                    </div>

                    <div className={styles.socialSection}>
                        <span className={styles.infoLabel}>Follow Us</span>
                        <div className={styles.socialLinks}>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="LinkedIn">
                                <LinkedInIcon />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Twitter">
                                <XIcon />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram">
                                <InstagramIcon />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right side */}
                <div className={styles.formContainer}>
                    {sent ? (
                        <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '1rem', color: '#000000' }}>Message received.</h2>
                            <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '2.5rem' }}>We&apos;ll be in touch shortly. Thank you.</p>
                            <button className={styles.submitBtn} onClick={() => setSent(false)} style={{ margin: '0 auto' }}>Send Another</button>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '3.5rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#000000', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Send a Message</h2>
                                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Fill out the form below and our team will get back to you shortly.</p>
                            </div>
                            <form className={styles.form} onSubmit={handleSubmit}>
                                <div className={styles.formRow}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Full Name</label>
                                        <input
                                            className={styles.input}
                                            type="text"
                                            name="fullName"
                                            placeholder="Arjun Patel"
                                            required
                                            value={formData.fullName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Work Email</label>
                                        <input
                                            className={styles.input}
                                            type="email"
                                            name="email"
                                            placeholder="arjun@company.com"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Phone Number</label>
                                        <input
                                            className={styles.input}
                                            type="tel"
                                            name="phone"
                                            placeholder="+91 98981 61106"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Company/Organization</label>
                                        <input
                                            className={styles.input}
                                            type="text"
                                            name="organization"
                                            placeholder="TechFlow Solutions"
                                            required
                                            value={formData.organization}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>I am a...</label>
                                    <select
                                        className={styles.select}
                                        name="userType"
                                        required
                                        value={formData.userType}
                                        onChange={handleChange}
                                    >
                                        <option value="">Choose an option...</option>
                                        <option value="employer">I am an Employer / Recruiter looking for talent</option>
                                        <option value="candidate">I am a Candidate / Job Seeker looking for roles</option>
                                        <option value="partner">I am interested in a Business Partnership</option>
                                        <option value="other">Other Inquiry</option>
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Message</label>
                                    <textarea
                                        className={styles.textarea}
                                        name="message"
                                        placeholder="How can we help you achieve your goals?"
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                    />
                                </div>
                                <button type="submit" className={styles.submitBtn} disabled={loading}>
                                    {loading ? 'Sending Request...' : 'Submit Inquiry'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {/* ── FAQ ── */}
            <section className={styles.faqSection}>
                <div className={styles.faqContainer}>
                    <h2 className={styles.faqTitle}>Common Questions</h2>
                    <div className={styles.faqList}>
                        {FAQ.map((f, i) => (
                            <div key={i} className={styles.faqItem}>
                                <button className={styles.faqQuestion} onClick={() => setOpen(open === i ? null : i)}>
                                    {f.q}
                                    <span style={{ transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', fontSize: '1.5rem', fontWeight: 300, color: '#94a3b8' }}>+</span>
                                </button>
                                {open === i && <p className={styles.faqAnswer}>{f.a}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <CTA />
        </main>
    );
}


