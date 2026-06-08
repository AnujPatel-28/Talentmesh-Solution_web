import React, { useState } from 'react';
import styles from '../../../../shared-dashboard.module.css';
import SectionStatus from './SectionStatus';
import type { EducationEntry } from '@/types/user';

const institutionColor = (name: string) => {
  if (!name) return '#7c3aed';
  const colors = [
    '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a',
    '#0891b2', '#4f46e5', '#e11d48', '#059669', '#d97706'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

interface EducationSectionProps {
  education?: EducationEntry[] | null;
  isEditing: boolean;
  onUpdate: (eduList: EducationEntry[]) => void;
}

const EMPTY_EDU: EducationEntry = {
  id: '',
  institution: '',
  degree: '',
  field_of_study: '',
  start_year: undefined,
  end_year: undefined,
  is_current: false,
  grade: '',
  description: ''
};

export default React.memo(function EducationSection({
  education = [],
  isEditing,
  onUpdate
}: EducationSectionProps) {
  
  const eduList = education || [];
  const isComplete = eduList.length >= 1;

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<EducationEntry>(EMPTY_EDU);
  const [errors, setErrors] = useState<{ degree?: string; institution?: string }>({});

  const handleOpenAdd = () => {
    setFormState({ ...EMPTY_EDU, id: typeof window !== 'undefined' && window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 11) });
    setEditingId(null);
    setShowForm(true);
    setErrors({});
  };

  const handleOpenEdit = (edu: EducationEntry) => {
    setFormState({ ...edu });
    setEditingId(edu.id);
    setShowForm(true);
    setErrors({});
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormState(EMPTY_EDU);
    setErrors({});
  };

  const handleDelete = (id: string) => {
    const updated = eduList.filter(e => e.id !== id);
    onUpdate(updated);
  };

  const handleSave = () => {
    const errs: { degree?: string; institution?: string } = {};
    if (!formState.degree.trim()) errs.degree = 'Degree is required';
    if (!formState.institution.trim()) errs.institution = 'Institution is required';
    
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    let updated: EducationEntry[];
    if (editingId) {
      updated = eduList.map(e => e.id === editingId ? formState : e);
    } else {
      updated = [...eduList, formState];
    }

    onUpdate(updated);
    setShowForm(false);
    setEditingId(null);
    setFormState(EMPTY_EDU);
    setErrors({});
  };

  const renderForm = () => {
    return (
      <div className={styles.inlineFormCard}>
        <h3 className={styles.inlineFormTitle}>{editingId ? 'Edit Education' : 'New Education'}</h3>
        <div className={styles.formGrid2Col}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Degree *</label>
            <input 
              className={`${styles.formInput} ${errors.degree ? styles.inputError : ''}`}
              value={formState.degree} 
              onChange={e => setFormState(p => ({ ...p, degree: e.target.value }))} 
              placeholder="e.g. B.Tech, MBA" 
            />
            {errors.degree && <span className={styles.errorText}>{errors.degree}</span>}
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Institution *</label>
            <input 
              className={`${styles.formInput} ${errors.institution ? styles.inputError : ''}`}
              value={formState.institution} 
              onChange={e => setFormState(p => ({ ...p, institution: e.target.value }))} 
              placeholder="e.g. Stanford University" 
            />
            {errors.institution && <span className={styles.errorText}>{errors.institution}</span>}
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Field of Study</label>
            <input 
              className={styles.formInput}
              value={formState.field_of_study || ''} 
              onChange={e => setFormState(p => ({ ...p, field_of_study: e.target.value }))} 
              placeholder="e.g. Computer Science" 
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Start Year</label>
            <input 
              type="number" 
              className={styles.formInput}
              placeholder="e.g. 2021"
              value={formState.start_year || ''} 
              onChange={e => setFormState(p => ({ ...p, start_year: e.target.value === '' ? undefined : parseInt(e.target.value) || undefined }))} 
            />
          </div>
          {!formState.is_current && (
            <div className={styles.formField}>
              <label className={styles.formLabel}>End Year</label>
              <input 
                type="number" 
                className={styles.formInput}
                placeholder="e.g. 2025"
                value={formState.end_year || ''} 
                onChange={e => setFormState(p => ({ ...p, end_year: e.target.value === '' ? undefined : parseInt(e.target.value) || undefined }))} 
              />
            </div>
          )}
          <div className={styles.formField} style={{ justifyContent: 'center', paddingTop: '1rem' }}>
            <label className={styles.formCheckboxGroup}>
              <input 
                type="checkbox" 
                checked={!!formState.is_current} 
                onChange={e => setFormState(p => ({ ...p, is_current: e.target.checked, end_year: e.target.checked ? undefined : p.end_year }))} 
              />
              <span>Currently studying here</span>
            </label>
          </div>
          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.formLabel}>Grade / CGPA</label>
            <input 
              className={styles.formInput}
              value={formState.grade || ''} 
              onChange={e => setFormState(p => ({ ...p, grade: e.target.value }))} 
              placeholder="e.g. 8.5 CGPA or 85%" 
            />
          </div>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Description / Coursework / Honors</label>
          <textarea 
            className={styles.formTextarea}
            value={formState.description || ''} 
            onChange={e => setFormState(p => ({ ...p, description: e.target.value }))} 
            placeholder="Describe honors, key achievements, coursework, extra activities..." 
            rows={3} 
          />
        </div>
        <div className={styles.formActions}>
          <button type="button" onClick={handleCancel} className={styles.cancelBtn}>Cancel</button>
          <button type="button" onClick={handleSave} className={styles.saveBtn}>Save</button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.profileSection} id="education">
      <div className={styles.timelineCardHeader} style={{ alignItems: 'center' }}>
        <SectionStatus 
          title="Education" 
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>} 
          count={eduList.length}
          isComplete={isComplete} 
          required={true}
        />
        {isEditing && !showForm && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className={`${styles.emptyStateBtn} ${styles.smallAddBtn}`}
          >
            + Add Education
          </button>
        )}
      </div>

      {eduList.length === 0 && !showForm ? (
        <div className={styles.emptyStateCard}>
          <div className={styles.emptyStateIcon}>🎓</div>
          <h3 className={styles.emptyStateTitle}>No Education Added Yet</h3>
          <p className={styles.emptyStateText}>
            Add your educational credentials to verify your academic background.
          </p>
          {isEditing && (
            <button 
              type="button" 
              onClick={handleOpenAdd} 
              className={styles.emptyStateBtn}
            >
              Add Education
            </button>
          )}
        </div>
      ) : (
        <div className={styles.educationList}>
          {eduList.map((edu) => (
            editingId === edu.id && showForm ? (
              <React.Fragment key={edu.id}>
                {renderForm()}
              </React.Fragment>
            ) : (
              <div key={edu.id} className={styles.viewCard}>
                <div className={styles.timelineLogoLayout}>
                  <div className={styles.timelineLogo} style={{ background: institutionColor(edu.institution) }}>
                    {edu.institution ? edu.institution.charAt(0).toUpperCase() : '🎓'}
                  </div>
                  <div className={styles.flex1}>
                    <div className={styles.timelineCardHeader}>
                      <div>
                        <h4 className={styles.timelineTitle}>
                          {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
                        </h4>
                        <p className={styles.timelineSubHeader}>
                          {edu.institution || 'Unknown Institution'}{edu.grade ? ` • Grade: ${edu.grade}` : ''}
                        </p>
                        <span className={styles.educationDateText}>
                          {edu.start_year || 'N/A'} → {edu.is_current ? 'Present' : edu.end_year || 'N/A'}
                        </span>
                      </div>
                      
                      {isEditing && (
                        <div className={styles.actionButtonContainer}>
                          <button 
                            type="button" 
                            onClick={() => handleOpenEdit(edu)} 
                            className={`${styles.iconButton} ${styles.editIconBtn}`} 
                            title="Edit education"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDelete(edu.id)} 
                            className={`${styles.iconButton} ${styles.deleteIconBtn}`} 
                            title="Delete education"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                    {edu.description && (
                      <p className={styles.timelineDescText}>
                        {edu.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {isEditing && showForm && !editingId && renderForm()}
    </div>
  );
});
