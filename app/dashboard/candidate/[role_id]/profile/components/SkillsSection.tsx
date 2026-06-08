import React from 'react';
import styles from '../../../../shared-dashboard.module.css';
import SectionStatus from './SectionStatus';

interface SkillsSectionProps {
  skills?: string[] | null;
  isEditing: boolean;
  onUpdate: (skills: string[]) => void;
}

export default React.memo(function SkillsSection({
  skills = [],
  isEditing,
  onUpdate
}: SkillsSectionProps) {
  
  const skillList = skills || [];
  const isComplete = skillList.length >= 5;
  const tier = skillList.length <= 2 ? 'warning' : skillList.length >= 5 ? 'strong' : 'neutral';

  return (
    <div className={styles.profileSection} id="skills">
      <SectionStatus 
        title={isEditing ? `Skills (${skillList.length}/15)` : "Skills"} 
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} 
        count={isEditing ? undefined : skillList.length}
        isComplete={isComplete} 
        required={true}
      />

      <div className={styles.skillsTagEditor}>
        {skillList.map(skill => (
          <span key={skill} className={styles.skillBadge} data-tier={tier}>
            {skill}
            {isEditing && (
              <button 
                type="button" 
                onClick={() => {
                  const updated = skillList.filter(s => s !== skill);
                  onUpdate(updated);
                }}
                className={styles.skillRemoveBtn}
                aria-label={`Remove ${skill}`}
              >×</button>
            )}
          </span>
        ))}
        
        {isEditing && (
          <div className={styles.skillInputWrapper}>
            <input
              className={`${styles.formInput} ${styles.skillInput}`}
              placeholder={skillList.length >= 15 ? "Skill limit reached" : "Add a skill + press Enter"}
              disabled={skillList.length >= 15}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  const val = input.value.trim();
                  if (val && !skillList.includes(val)) {
                    if (skillList.length < 15) {
                      onUpdate([...skillList, val]);
                      input.value = '';
                    }
                  }
                }
              }}
            />
            {skillList.length >= 15 && (
              <span className={styles.skillLimitText}>
                You've added 15 skills — that's the maximum.
              </span>
            )}
          </div>
        )}
      </div>

      {!isEditing && skillList.length === 0 && (
        <p className={styles.emptySectionText}>
          No skills added yet. Click <strong>Edit Profile</strong> to add some skills.
        </p>
      )}
    </div>
  );
});
