'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './candidates.module.css';

type CandidateProfile = {
  headline?: string;
  skills?: string[];
  experience_years?: number | null;
  education?: string;
  resume_url?: string;
  profile_strength?: number;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
};

type AdminCandidate = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
  candidate_profiles: CandidateProfile | CandidateProfile[];
};

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCandidates = async (currentSearch = search) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        search: currentSearch,
        page: '0',
        limit: '50',
      });
      const response = await fetch(`/api/admin/candidates?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load candidates');
      }

      setCandidates(payload.candidates || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchCandidates(search);
  };

  const getProfile = (candidate: AdminCandidate): CandidateProfile | null => {
    if (!candidate.candidate_profiles) return null;
    if (Array.isArray(candidate.candidate_profiles)) {
      return candidate.candidate_profiles[0] || null;
    }
    return candidate.candidate_profiles;
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Super Admin Candidates</p>
          <h1 className={styles.title}>Review, manage, and verify every TalentMesh candidate.</h1>
          <p className={styles.subtitle}>Detailed view of candidate profiles, resumes, and professional presence.</p>
        </div>
      </div>

      <div className={styles.toolbarRow}>
        <form className={styles.toolbar} onSubmit={handleSearchSubmit}>
          <input
            className={styles.searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidates by name or email"
          />
          <button type="submit" className={styles.primaryButton}>
            Search
          </button>
        </form>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.emptyState}>Loading candidates...</div>
        ) : candidates.length === 0 ? (
          <div className={styles.emptyState}>No candidates found.</div>
        ) : (
          candidates.map((candidate) => {
            const profile = getProfile(candidate);
            return (
              <article key={candidate.id} className={styles.candidateCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.initials}>{candidate.name ? candidate.name.charAt(0).toUpperCase() : '?'}</div>
                  <div className={styles.mainInfo}>
                    <h3 className={styles.name}>{candidate.name || 'Anonymous Candidate'}</h3>
                    <p className={styles.email}>{candidate.email}</p>
                  </div>
                  <div className={styles.strengthBadge}>
                    {profile?.profile_strength || 0}% Strength
                  </div>
                </div>

                <div className={styles.body}>
                  <p className={styles.headline}>{profile?.headline || 'No headline set'}</p>
                  <div className={styles.meta}>
                    <span>📍 {candidate.location || 'Location not set'}</span>
                    <span>💼 {profile?.experience_years ? `${profile.experience_years}y experience` : 'Entry level'}</span>
                  </div>

                  {profile?.skills && profile.skills.length > 0 && (
                    <div className={styles.skills}>
                      {profile.skills.slice(0, 5).map((skill, i) => (
                        <span key={i} className={styles.skillTag}>{skill}</span>
                      ))}
                      {profile.skills.length > 5 && <span className={styles.moreCount}>+{profile.skills.length - 5}</span>}
                    </div>
                  )}
                </div>

                <div className={styles.footer}>
                  <div className={styles.links}>
                    {profile?.resume_url && (
                      <a href={profile.resume_url} target="_blank" rel="noreferrer" className={styles.resumeLink}>
                        View Resume
                      </a>
                    )}
                    {profile?.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className={styles.socialLink}>
                        LinkedIn
                      </a>
                    )}
                    {profile?.github_url && (
                        <a href={profile.github_url} target="_blank" rel="noreferrer" className={styles.socialLink}>
                          GitHub
                        </a>
                      )}
                  </div>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => alert('Detailed candidate view is coming in the next update.')}
                  >
                    View Details
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
