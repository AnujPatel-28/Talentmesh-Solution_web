'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@insforge/sdk';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './editor.module.css';

const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '',
    anonKey: process.env.NEXT_PUBLIC_ANON_KEY || ''
});

interface Template {
    id: string;
    key: string;
    name: string;
    subject: string;
    body_html: string;
    body_text: string;
    variables: string[];
    category: string;
}

const SAMPLE_DATA: Record<string, string> = {
    recruiter_name: 'Rahul Sharma',
    company_name: 'Acme Technologies',
    login_url: 'https://hire.talentmesh.in/login',
    candidate_name: 'Priya Patel',
    profile_url: 'https://talentmesh.in/candidate/profile',
    rejection_reason: 'Your profile does not meet our minimum requirements for high-frequency job postings at this stage.'
};

export default function TemplateEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { user: adminUser } = useAuth();
    const templateKey = params.template_key as string;

    const [template, setTemplate] = useState<Template | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [previewType, setPreviewType] = useState<'html' | 'text'>('html');
    const [toast, setToast] = useState<string | null>(null);

    const fetchTemplate = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await insforge.database
                .from('email_templates')
                .select('*')
                .eq('key', templateKey)
                .single();

            if (error) throw error;
            setTemplate(data);
        } catch (err) {
            console.error('Fetch Error:', err);
            router.push('/dashboard/admin/email-templates');
        } finally {
            setIsLoading(false);
        }
    }, [templateKey, router]);

    useEffect(() => {
        fetchTemplate();
    }, [fetchTemplate]);

    const handleSave = async () => {
        if (!template || !adminUser) return;
        setIsSaving(true);
        try {
            const { error } = await insforge.database
                .from('email_templates')
                .update({
                    name: template.name,
                    subject: template.subject,
                    body_html: template.body_html,
                    body_text: template.body_text,
                    variables: template.variables,
                    last_edited_by: adminUser.id,
                    updated_at: new Date().toISOString()
                })
                .eq('key', templateKey);

            if (error) throw error;
            showToast('Changes saved successfully!');
        } catch (err) {
            console.error('Save Error:', err);
            alert('Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast(`Copied ${text}`);
    };

    const renderedContent = useMemo(() => {
        if (!template) return '';
        let content = previewType === 'html' ? template.body_html : template.body_text;
        
        // Replace placeholders with sample data
        (template.variables || []).forEach(v => {
            const regex = new RegExp(`{{${v}}}`, 'g');
            content = content.replace(regex, SAMPLE_DATA[v] || `[${v}]`);
        });

        return content;
    }, [template, previewType]);

    const renderedSubject = useMemo(() => {
        if (!template) return '';
        let subj = template.subject;
        (template.variables || []).forEach(v => {
            const regex = new RegExp(`{{${v}}}`, 'g');
            subj = subj.replace(regex, SAMPLE_DATA[v] || `[${v}]`);
        });
        return subj;
    }, [template]);

    if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading template editor...</div>;
    if (!template) return null;

    return (
        <div className={styles.container}>
            <header className={styles.editorHeader}>
                <Link href="/dashboard/admin/email-templates" className={styles.backBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
                    Back to Templates
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Key: <code>{template.key}</code></span>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            <div className={styles.splitView}>
                <div className={styles.leftPane}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Template Name</label>
                        <input 
                            className={styles.input} 
                            value={template.name}
                            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Subject Line</label>
                        <input 
                            className={styles.input} 
                            value={template.subject}
                            onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>HTML Body</label>
                        <textarea 
                            className={styles.textarea}
                            value={template.body_html}
                            onChange={(e) => setTemplate({ ...template, body_html: e.target.value })}
                        />
                        <div className={styles.variablesHelper}>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>Available Variables (Click to copy):</span>
                            {(template.variables || []).map(v => (
                                <span key={v} className={styles.varPill} onClick={() => copyToClipboard(`{{${v}}}`)}>
                                    {v}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Plain Text Version</label>
                        <textarea 
                            className={styles.textarea}
                            style={{ minHeight: '150px' }}
                            value={template.body_text}
                            onChange={(e) => setTemplate({ ...template, body_text: e.target.value })}
                        />
                    </div>

                    <div className={styles.varManager}>
                        <label className={styles.label}>Manage Variables</label>
                        {(template.variables || []).map((v, idx) => (
                            <div key={idx} className={styles.varRow}>
                                <input 
                                    className={styles.varInput}
                                    value={v}
                                    onChange={(e) => {
                                        const newVars = [...template.variables];
                                        newVars[idx] = e.target.value;
                                        setTemplate({ ...template, variables: newVars });
                                    }}
                                />
                                <button className={styles.deleteBtn} onClick={() => {
                                    setTemplate({ ...template, variables: template.variables.filter((_, i) => i !== idx) });
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        <button className={styles.addVarBtn} onClick={() => setTemplate({ ...template, variables: [...template.variables, 'new_variable'] })}>
                            + Add Variable
                        </button>
                    </div>
                </div>

                <div className={styles.rightPane}>
                    <div className={styles.previewToggle}>
                        <button 
                            className={`${styles.toggleBtn} ${previewType === 'html' ? styles.toggleBtnActive : ''}`}
                            onClick={() => setPreviewType('html')}
                        >
                            HTML Preview
                        </button>
                        <button 
                            className={`${styles.toggleBtn} ${previewType === 'text' ? styles.toggleBtnActive : ''}`}
                            onClick={() => setPreviewType('text')}
                        >
                            Plain Text
                        </button>
                    </div>

                    <div className={styles.emailFrame}>
                        <div className={styles.emailHeader}>
                            <div className={styles.emailMeta}><strong>From:</strong> TalentMesh &lt;hello@talentmesh.in&gt;</div>
                            <div className={styles.emailMeta}><strong>To:</strong> candidate@example.com</div>
                            <div className={styles.emailSubjectLine}>{renderedSubject}</div>
                        </div>
                        <div className={styles.emailBody}>
                            {previewType === 'html' ? (
                                <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
                            ) : (
                                <div className={styles.plainTextBody}>{renderedContent}</div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ verticalAlign: 'middle', marginRight: '4px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        Previewing with sample data. Variables in double curly braces are replaced.
                    </div>
                </div>
            </div>

            {toast && <div className={styles.toast}>{toast}</div>}
        </div>
    );
}
