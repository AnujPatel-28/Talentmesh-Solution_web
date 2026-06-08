import React, { useState, useEffect, useRef } from 'react';
import styles from '../../../../shared-dashboard.module.css';

interface StickyActionBarProps {
  isEditing: boolean;
  candidateName: string;
  completionScore: number;
  isSaving: boolean;
  isDirty: boolean;
  onSave: () => void;
  onCancel: () => void;
  onEditToggle: () => void;
}

export default React.memo(function StickyActionBar({
  isEditing,
  candidateName,
  completionScore,
  isSaving,
  isDirty,
  onSave,
  onCancel,
  onEditToggle
}: StickyActionBarProps) {
  const [sentinelHidden, setSentinelHidden] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver works with ANY scroll container (window OR inner div)
  // rootMargin of -54px accounts for the 54px dashboard topbar height
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setSentinelHidden(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-54px 0px 0px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const showBar = isEditing || sentinelHidden;

  return (
    <>
      {/* Sentinel div in normal page flow — when scrolled out of view, bar appears */}
      <div
        ref={sentinelRef}
        style={{ height: 1, pointerEvents: 'none', visibility: 'hidden', marginBottom: 0 }}
        aria-hidden="true"
      />

      {showBar && (
        <div className={styles.stickyActionBar} role="region" aria-label="Profile controls">
          <div className={styles.stickyActionContent}>
            <div>
              <span className={styles.stickyName}>{candidateName}</span>
              <span className={styles.stickySub}>
                Strength: {completionScore}%{' '}
                {isEditing ? (
                  isSaving ? (
                    <span className={styles.saveStatus} data-status="saving">· Saving...</span>
                  ) : isDirty ? (
                    <span className={styles.saveStatus} data-status="dirty">· ● Unsaved changes</span>
                  ) : (
                    <span className={styles.saveStatus} data-status="saved">· ✓ Saved</span>
                  )
                ) : (
                  <span className={styles.saveStatus} data-status="saved">· View mode</span>
                )}
              </span>
            </div>
            <div className={styles.stickyButtons}>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={onCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={onSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={onEditToggle}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});
