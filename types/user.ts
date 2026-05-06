export type UserRole = 'candidate' | 'recruiter' | 'admin' | 'super_admin';

export interface CandidateProfile {
  id: string;
  headline?: string;
  skills?: string[];
  experience_years?: number;
  education?: any[];
  work_history?: any[];
  resume_url?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  job_types?: string[];
  preferred_locations?: string[];
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  open_to_remote?: boolean;
  profile_strength: number;
  is_visible?: boolean;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string | UserRole;
  phone?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  candidate_profiles?: CandidateProfile;
  completed_onboarding?: boolean;
}
