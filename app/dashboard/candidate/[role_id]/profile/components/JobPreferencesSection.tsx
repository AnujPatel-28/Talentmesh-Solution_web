import React from 'react';
import styles from '../../../../shared-dashboard.module.css';
import SectionStatus from './SectionStatus';
import type { CandidateProfile } from '@/types/user';

interface JobPreferencesSectionProps {
  preferredLocations?: string[] | null;
  jobTypes?: string[] | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  openToRemote?: boolean | null;
  isEditing: boolean;
  onUpdate: (fields: Partial<CandidateProfile>) => void;
}

export default React.memo(function JobPreferencesSection({
  preferredLocations = [],
  jobTypes = [],
  salaryMin,
  salaryMax,
  currency = 'INR',
  openToRemote = true,
  isEditing,
  onUpdate
}: JobPreferencesSectionProps) {
  
  const locations = preferredLocations || [];
  const types = jobTypes || [];
  const isComplete = locations.length > 0 && types.length > 0 && (!!salaryMin || !!salaryMax);

  const formattedSalary = React.useMemo(() => {
    if (!salaryMin && !salaryMax) return 'Not specified';
    const symbol = currency === 'INR' ? '₹' : (currency === 'USD' ? '$' : currency + ' ');
    const minStr = salaryMin ? salaryMin.toLocaleString('en-IN') : null;
    const maxStr = salaryMax ? salaryMax.toLocaleString('en-IN') : null;
    if (minStr && maxStr) return `${symbol}${minStr} – ${symbol}${maxStr}`;
    if (minStr) return `${symbol}${minStr}+`;
    return `${symbol}${maxStr} max`;
  }, [salaryMin, salaryMax, currency]);

  return (
    <div className={styles.profileSection}>
      <SectionStatus 
        title="Job Preferences" 
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>} 
        isComplete={isComplete} 
        required={true}
      />

      {isEditing ? (
        <div className={styles.editGrid}>
          {/* Preferred Locations Input */}
          <div className={styles.fieldFull}>
            <label className={styles.formLabel}>Preferred Locations (Press Enter to add)</label>
            <div className={styles.tagInput}>
              {locations.map(loc => (
                <span key={loc} className={styles.skillChip}>
                  {loc}
                  <button 
                    type="button" 
                    onClick={() => {
                      const updated = locations.filter(l => l !== loc);
                      onUpdate({ preferred_locations: updated });
                    }}
                    aria-label={`Remove ${loc}`}
                  >×</button>
                </span>
              ))}
              <input 
                placeholder={locations.length ? "" : "e.g. Bangalore, Mumbai"}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    const val = input.value.trim();
                    if (val && !locations.includes(val)) {
                      onUpdate({ preferred_locations: [...locations, val] });
                      input.value = '';
                    }
                  }
                }} 
              />
            </div>
          </div>

          {/* Job Types Checkboxes */}
          <div className={styles.fieldFull}>
            <label className={styles.formLabel}>Job Types (Select all that apply)</label>
            <div className={styles.checkboxGroupWrap}>
              {['Full-time', 'Contract', 'Freelance', 'Internship', 'Remote', 'Hybrid', 'Onsite'].map(type => {
                const isChecked = types.includes(type);
                return (
                  <label key={type} className={styles.formCheckboxGroup}>
                    <input 
                      type="checkbox"
                      checked={!!isChecked}
                      onChange={(e) => {
                        const updated = e.target.checked 
                          ? [...types, type] 
                          : types.filter(t => t !== type);
                        onUpdate({ job_types: updated });
                      }}
                    />
                    {type}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Expected Salary range */}
          <div className={`${styles.formGrid2Col} ${styles.fieldFull}`}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Min Expected Salary (Monthly)</label>
              <input
                type="number"
                className={styles.formInput}
                placeholder="e.g. 50000"
                value={salaryMin ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseInt(e.target.value) || 0;
                  onUpdate({ salary_min: val });
                }}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Max Expected Salary (Monthly)</label>
              <input
                type="number"
                className={styles.formInput}
                placeholder="e.g. 90000"
                value={salaryMax ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseInt(e.target.value) || 0;
                  onUpdate({ salary_max: val });
                }}
              />
            </div>
          </div>

          {/* Open to Remote Checkbox */}
          <div className={styles.fieldFull}>
            <label className={styles.formCheckboxGroup}>
              <input 
                type="checkbox"
                checked={openToRemote ?? true}
                onChange={(e) => onUpdate({ open_to_remote: e.target.checked })}
              />
              <span>Open to Remote Preference (recruiters will see you are open to remote roles)</span>
            </label>
          </div>
        </div>
      ) : (
        <div className={styles.preferencesGrid}>
          <div>
            <span className={styles.preferenceLabel}>Preferred Locations</span>
            <div className={styles.preferenceBadgeGroup}>
              {locations.length > 0 ? (
                locations.map(loc => (
                  <span key={loc} className={styles.skillBadge}>{loc}</span>
                ))
              ) : (
                <span className={styles.emptySectionText}>Not specified</span>
              )}
            </div>
          </div>
          <div>
            <span className={styles.preferenceLabel}>Job Types</span>
            <div className={styles.preferenceBadgeGroup}>
              {types.length > 0 ? (
                types.map(type => (
                  <span key={type} className={styles.skillBadge} data-tier="strong">{type}</span>
                ))
              ) : (
                <span className={styles.emptySectionText}>Not specified</span>
              )}
            </div>
          </div>
          <div>
            <span className={styles.preferenceLabel}>Expected Salary</span>
            <strong className={styles.preferenceValueStrong}>{formattedSalary}</strong>
          </div>
          <div>
            <span className={styles.preferenceLabel}>Open to Remote</span>
            <span className={openToRemote ? styles.visibilityBadgeVisible : styles.visibilityBadgeHidden}>
              {openToRemote ? '✓ Yes, Open' : 'No'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
