'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@insforge/sdk';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './email-templates.module.css';

const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '',
    anonKey: process.env.NEXT_PUBLIC_ANON_KEY || ''
});

interface EmailTemplate {
    id: string;
    key: string;
    name: string;
    subject: string;
    category: 'auth' | 'recruiter' | 'candidate' | 'system';
    is_active: boolean;
    variables: string[];
    updated_at: string;
}

export default function EmailTemplatesPage() {
    const { user: adminUser } = useAuth();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'auth' | 'recruiter' | 'candidate' | 'system'>('all');
    const [testModal, setTestModal] = useState<{ isOpen: boolean; template: EmailTemplate | null }>({ isOpen: false, template: null });

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await insforge.database
                .from('email_templates')
                .select('id, key, name, subject, category, is_active, variables, updated_at')
                .order('category', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;
            setTemplates(data || []);
        } catch (err) {
            console.error('Fetch Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const toggleStatus = async (id: string, current: boolean) => {
        try {
            await insforge.database.from('email_templates').update({ is_active: !current }).eq('id', id);
            setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: !current } : t));
        } catch (err) {
            console.error('Toggle Error:', err);
        }
    };

    const handleSendTest = async () => {
        if (!testModal.template || !adminUser) return;
        
        try {
            // Log to audit logs (actual sending would be an edge function call)
            await insforge.database.from('audit_logs').insert({
                admin_id: adminUser.id,
                action: 'send_test_email',
                resource_type: 'email_template',
                resource_id: testModal.template.id,
                metadata: { template_key: testModal.template.key, target: adminUser.email }
            });

            alert(`Test email for "${testModal.template.name}" has been triggered to ${adminUser.email}`);
            setTestModal({ isOpen: false, template: null });
        } catch (err) {
            console.error('Test Send Error:', err);
        }
    };

    const filteredTemplates = activeTab === 'all' 
        ? templates 
        : templates.filter(t => t.category === activeTab);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Email Templates</h1>
            </header>

            <div className={styles.tabs}>
                {(['all', 'auth', 'recruiter', 'candidate', 'system'] as const).map(tab => (
                    <div 
                        key={tab} 
                        className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </div>
                ))}
            </div>

            <div className={styles.grid}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '4rem' }}>Loading templates...</div>
                ) : filteredTemplates.length === 0 ? (
                    <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '4rem' }}>No templates found in this category.</div>
                ) : filteredTemplates.map(template => (
                    <div key={template.id} className={styles.card}>
                        <div className={styles.cardHead}>
                            <span className={`${styles.categoryBadge} ${styles[template.category]}`}>
                                {template.category}
                            </span>
                            <label className={styles.toggle}>
                                <input 
                                    type="checkbox" 
                                    checked={template.is_active} 
                                    onChange={() => toggleStatus(template.id, template.is_active)}
                                />
                                <span className={styles.slider} />
                            </label>
                        </div>
                        
                        <div>
                            <h3 className={styles.templateName}>{template.name}</h3>
                            <code className={styles.templateKey}>{template.key}</code>
                        </div>

                        <p className={styles.subjectPreview}>
                            <span style={{ fontWeight: 600 }}>Subject:</span> {template.subject}
                        </p>

                        <div className={styles.cardFoot}>
                            <div className={styles.metaInfo}>
                                <span>{template.variables?.length || 0} variables</span>
                                <span>Updated: {new Date(template.updated_at).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.cardActions}>
                                <Link href={`/dashboard/admin/email-templates/${template.key}`} className={styles.editBtn}>
                                    Edit Template
                                </Link>
                                <button className={styles.testBtn} onClick={() => setTestModal({ isOpen: true, template })}>
                                    Send Test
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {testModal.isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Send Test Email</h2>
                        <p>This will send a test version of <strong>{testModal.template?.name}</strong> to your email address: <strong>{adminUser?.email}</strong> using sample data.</p>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setTestModal({ isOpen: false, template: null })}>Cancel</button>
                            <button className={styles.confirmBtn} onClick={handleSendTest}>Confirm & Send</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
