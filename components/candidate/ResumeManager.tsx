"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './ResumeManager.module.css';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth/AuthContext';
import Toast from '@/components/ui/Toast';

interface Resume {
    id: string;
    candidate_id: string;
    label: string;
    file_url: string;
    file_name: string;
    file_size_bytes: number;
    is_default: boolean;
    upload_count: number;
    created_at: string;
}

interface ResumeManagerProps {
    candidateId: string;
}

const IC = {
    pdf: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15h3a2 2 0 0 0 0-4H9v4z" /><path d="M9 11v9" /></svg>,
    plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
    eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>,
    upload: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
    alert: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
};

export default function ResumeManager({ candidateId }: ResumeManagerProps) {
    const { user } = useAuth();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{ url: string, name: string, size: number } | null>(null);
    const [newLabel, setNewLabel] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchResumes();
    }, [candidateId]);

    const fetchResumes = async () => {
        try {
            const { data, error } = await insforge.database
                .from('candidate_resumes')
                .select('*')
                .eq('candidate_id', candidateId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setResumes(data || []);
        } catch (err: any) {
            setToast({ message: 'Failed to fetch resumes: ' + err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setToast({ message: 'File too large. Max 5MB allowed.', type: 'error' });
            return;
        }

        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(ext)) {
            setToast({ message: 'Invalid file type. Only PDF and DOC/DOCX allowed.', type: 'error' });
            return;
        }

        setUploading(true);
        try {
            const filePath = `resumes/${candidateId}/${Date.now()}_${file.name}`;
            const { data, error } = await insforge.storage.from('resumes').uploadAuto(file);
            
            if (error) throw error;
            
            setUploadedFile({
                url: data.url,
                name: file.name,
                size: file.size
            });
            setNewLabel('');
            setIsDefault(resumes.length === 0);
            setShowModal(true);
        } catch (err: any) {
            setToast({ message: 'Upload failed: ' + err.message, type: 'error' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const saveNewResume = async () => {
        if (!uploadedFile || !newLabel.trim()) return;

        try {
            if (isDefault) {
                await insforge.database
                    .from('candidate_resumes')
                    .update({ is_default: false })
                    .eq('candidate_id', candidateId);
            }

            const { error } = await insforge.database
                .from('candidate_resumes')
                .insert([{
                    candidate_id: candidateId,
                    label: newLabel.trim(),
                    file_url: uploadedFile.url,
                    file_name: uploadedFile.name,
                    file_size_bytes: uploadedFile.size,
                    is_default: isDefault
                }]);

            if (error) throw error;

            setToast({ message: 'Resume added successfully!', type: 'success' });
            setShowModal(false);
            setUploadedFile(null);
            fetchResumes();
        } catch (err: any) {
            setToast({ message: 'Failed to save: ' + err.message, type: 'error' });
        }
    };

    const toggleDefault = async (resume: Resume) => {
        if (resume.is_default) return;

        // Optimistic UI
        const oldResumes = [...resumes];
        setResumes(resumes.map(r => ({
            ...r,
            is_default: r.id === resume.id
        })));

        try {
            await insforge.database
                .from('candidate_resumes')
                .update({ is_default: false })
                .eq('candidate_id', candidateId);

            const { error } = await insforge.database
                .from('candidate_resumes')
                .update({ is_default: true })
                .eq('id', resume.id);

            if (error) throw error;
        } catch (err: any) {
            setResumes(oldResumes);
            setToast({ message: 'Failed to set default: ' + err.message, type: 'error' });
        }
    };

    const deleteResume = async (resume: Resume) => {
        if (resume.is_default && resumes.length === 1) {
            setToast({ message: 'Cannot delete your only default resume.', type: 'error' });
            return;
        }

        const confirmMsg = resume.upload_count > 0 
            ? `This resume has been used in ${resume.upload_count} applications. Are you sure you want to delete it?`
            : 'Are you sure you want to delete this resume?';

        if (!window.confirm(confirmMsg)) return;

        try {
            const { error } = await insforge.database
                .from('candidate_resumes')
                .delete()
                .eq('id', resume.id);

            if (error) throw error;

            setToast({ message: 'Resume deleted.', type: 'success' });
            fetchResumes();
        } catch (err: any) {
            setToast({ message: 'Delete failed: ' + err.message, type: 'error' });
        }
    };

    const updateLabel = async (id: string) => {
        if (!editLabel.trim()) {
            setEditingId(null);
            return;
        }

        try {
            const { error } = await insforge.database
                .from('candidate_resumes')
                .update({ label: editLabel.trim() })
                .eq('id', id);

            if (error) throw error;
            setResumes(resumes.map(r => r.id === id ? { ...r, label: editLabel.trim() } : r));
            setEditingId(null);
        } catch (err: any) {
            setToast({ message: 'Failed to update label: ' + err.message, type: 'error' });
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className={styles.manager}>
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.manager}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className={styles.header}>
                <h2 className={styles.title}>My Resumes</h2>
                {resumes.length < 5 && (
                    <button 
                        className={styles.uploadBtn}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? <div className={styles.spinner} style={{ width: 14, height: 14 }} /> : IC.plus}
                        {uploading ? 'Uploading...' : 'Upload New'}
                    </button>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                />
            </div>

            {resumes.length >= 5 && (
                <div className={styles.limitNotice}>
                    {IC.alert}
                    <span>You've reached the 5 resume limit. Delete one to add a new version.</span>
                </div>
            )}

            <div className={styles.list}>
                {resumes.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>{IC.upload}</div>
                        <p>No resumes uploaded yet.</p>
                    </div>
                ) : (
                    resumes.map(resume => (
                        <div key={resume.id} className={`${styles.card} ${resume.is_default ? styles.cardDefault : ''}`}>
                            <div className={styles.iconWrapper}>
                                {IC.pdf}
                            </div>
                            <div className={styles.content}>
                                <div className={styles.labelRow}>
                                    {editingId === resume.id ? (
                                        <input 
                                            className={styles.labelInput}
                                            autoFocus
                                            value={editLabel}
                                            onChange={(e) => setEditLabel(e.target.value)}
                                            onBlur={() => updateLabel(resume.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && updateLabel(resume.id)}
                                        />
                                    ) : (
                                        <span 
                                            className={styles.label}
                                            onClick={() => {
                                                setEditingId(resume.id);
                                                setEditLabel(resume.label);
                                            }}
                                        >
                                            {resume.label}
                                        </span>
                                    )}
                                    {resume.is_default && <span className={`${styles.badge} ${styles.defaultBadge}`}>Default</span>}
                                </div>
                                <div className={styles.meta}>
                                    <div className={styles.metaItem}>{resume.file_name}</div>
                                    <div className={styles.metaItem}>•</div>
                                    <div className={styles.metaItem}>{formatSize(resume.file_size_bytes)}</div>
                                    <div className={styles.metaItem}>•</div>
                                    <div className={styles.metaItem}>{new Date(resume.created_at).toLocaleDateString()}</div>
                                    <div className={styles.metaItem}>•</div>
                                    <div className={styles.metaItem}>Used {resume.upload_count} times</div>
                                </div>
                            </div>
                            <div className={styles.actions}>
                                <a href={resume.file_url} target="_blank" rel="noreferrer" className={styles.actionBtn} title="Preview">
                                    {IC.eye}
                                </a>
                                {!resume.is_default && (
                                    <button 
                                        className={`${styles.actionBtn} ${styles.defaultBtn}`} 
                                        onClick={() => toggleDefault(resume)}
                                        title="Set as Default"
                                    >
                                        Set Default
                                    </button>
                                )}
                                <button 
                                    className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                                    onClick={() => deleteResume(resume)}
                                    title="Delete"
                                >
                                    {IC.trash}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>Label this resume</h3>
                        <p className={styles.modalDesc}>Give this version a name to help you identify it when applying.</p>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Resume Label</label>
                            <input 
                                className={styles.formInput}
                                placeholder="e.g. Frontend Developer, Senior PM"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.checkboxGroup}>
                                <input 
                                    type="checkbox" 
                                    className={styles.checkbox}
                                    checked={isDefault}
                                    onChange={(e) => setIsDefault(e.target.checked)}
                                />
                                <span>Set as my default resume</span>
                            </label>
                        </div>

                        <div className={styles.modalActions}>
                            <button className={`${styles.modalBtn} ${styles.btnCancel}`} onClick={() => setShowModal(false)}>Cancel</button>
                            <button 
                                className={`${styles.modalBtn} ${styles.btnSave}`} 
                                onClick={saveNewResume}
                                disabled={!newLabel.trim()}
                            >
                                Save Resume
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
