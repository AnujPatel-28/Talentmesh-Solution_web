"use client";
import React from 'react';
import styles from '../admin.module.css';

export default function AdminSettingsPage() {
    return (
        <div className={styles.dash}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.pageTitle}>Admin Settings</h1>
                    <p className={styles.pageSub}>Configure platform settings and admin preferences</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Profile */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Admin Profile</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                            <input defaultValue="Admin User" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Email</label>
                            <input defaultValue="admin@talentmesh.ai" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <button className={styles.primaryBtn} style={{ alignSelf: 'flex-start' }}>Save Changes</button>
                    </div>
                </div>

                {/* Platform */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Platform Settings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {[
                            { label: 'Auto-approve Recruiters', desc: 'New recruiters join without admin review', on: false },
                            { label: 'Auto-approve Jobs', desc: 'Jobs go live immediately after posting', on: true },
                            { label: 'Email Notifications', desc: 'Receive alerts for platform activity', on: true },
                            { label: 'Maintenance Mode', desc: 'Temporarily disable platform access', on: false },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{s.label}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{s.desc}</div>
                                </div>
                                <div style={{
                                    width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                                    background: s.on ? 'var(--primary-blue)' : '#e2e8f0',
                                    position: 'relative', transition: 'all 0.2s'
                                }}>
                                    <div style={{
                                        width: 18, height: 18, borderRadius: '50%', background: 'white',
                                        position: 'absolute', top: 3, left: s.on ? 23 : 3,
                                        transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Security</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Change Password</label>
                            <input type="password" placeholder="New password" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Confirm Password</label>
                            <input type="password" placeholder="Confirm password" style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <button className={styles.primaryBtn} style={{ alignSelf: 'flex-start' }}>Update Password</button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className={styles.card} style={{ borderColor: '#fecaca' }}>
                    <h3 className={styles.cardTitle} style={{ color: '#dc2626' }}>Danger Zone</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Reset Platform Data</div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Clear all test or demo data from the platform</div>
                            </div>
                            <button className={styles.dangerBtn}>Reset</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Export All Data</div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Download a full backup of platform data</div>
                            </div>
                            <button className={styles.secondaryBtn} style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>Export</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
