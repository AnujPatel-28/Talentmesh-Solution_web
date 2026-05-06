export interface CandidateProfileFormData {
  headline: string;
  skills: string[];
  experience_years: number | null;
  education: string;
  resume_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  preferred_locations: string[];
  job_type: string;
  open_to_remote: boolean;
  is_visible: boolean;
  profile_strength: number;
}

export interface CandidateSettingsBundle {
  profile: {
    id: string;
    email: string;
    name: string;
    phone: string;
    location: string;
    role: string | null;
    public_id?: string;
    completed_onboarding: boolean;
  };
  candidateProfile: CandidateProfileFormData;
}

const SKILL_KEYWORDS = [
  'javascript',
  'typescript',
  'react',
  'next.js',
  'nextjs',
  'node.js',
  'node',
  'python',
  'java',
  'c++',
  'c#',
  'sql',
  'postgresql',
  'mongodb',
  'aws',
  'docker',
  'kubernetes',
  'tailwind',
  'figma',
  'graphql',
  'rest',
  'html',
  'css',
  'vue',
  'angular',
  'php',
  'go',
  'rust',
  'firebase',
  'supabase',
  'insforge',
];

const HEADLINE_KEYWORDS = [
  'frontend',
  'backend',
  'fullstack',
  'developer',
  'engineer',
  'designer',
  'manager',
  'analyst',
  'marketer',
  'product',
  'data',
  'devops',
  'mobile',
  'ios',
  'android',
  'qa',
  'recruiter',
];

function isFilled(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function sanitizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(
      value
        .map((item) => String(item).trim())
        .filter(Boolean)
    )];
  }

  if (typeof value === 'string') {
    return [...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )];
  }

  return [];
}

export function sanitizeOptionalNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getDefaultCandidateProfile(): CandidateProfileFormData {
  return {
    headline: '',
    skills: [],
    experience_years: null,
    education: '',
    resume_url: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    salary_min: null,
    salary_max: null,
    currency: 'INR',
    preferred_locations: [],
    job_type: '',
    open_to_remote: true,
    is_visible: true,
    profile_strength: 0,
  };
}

export function calculateCandidateProfileStrength(
  profile: Pick<CandidateSettingsBundle['profile'], 'name' | 'phone' | 'location'>,
  candidateProfile: Partial<CandidateProfileFormData>,
): number {
  let score = 0;

  if (isFilled(profile.name)) score += 10;
  if (isFilled(profile.phone)) score += 10;
  if (isFilled(profile.location)) score += 10;

  if (sanitizeStringArray(candidateProfile.skills).length >= 3) score += 20;
  if (candidateProfile.experience_years !== null && candidateProfile.experience_years !== undefined) score += 15;

  if (isFilled(candidateProfile.resume_url)) score += 20;
  if (isFilled(candidateProfile.linkedin_url)) score += 10;
  if (isFilled(candidateProfile.headline)) score += 15;

  return Math.min(score, 100);
}

export function deriveResumeAutoFill(resumeUrl: string): Pick<CandidateProfileFormData, 'headline' | 'skills'> {
  if (!resumeUrl) {
    return { headline: '', skills: [] };
  }

  const decoded = decodeURIComponent(resumeUrl).toLowerCase();
  const rawFileName = decoded.split('/').pop()?.split('?')[0] ?? '';
  const cleaned = rawFileName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\b(resume|cv|profile|updated|final|latest|copy)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(Boolean);
  const headlineTokens = words.filter((word) => HEADLINE_KEYWORDS.includes(word));
  const skillMatches = SKILL_KEYWORDS.filter((skill) => decoded.includes(skill));

  return {
    headline: headlineTokens.length > 0 ? titleCase(headlineTokens.slice(0, 4).join(' ')) : '',
    skills: skillMatches.map((skill) => titleCase(skill.replace('.js', ''))),
  };
}

export function applyResumeAutofill(candidateProfile: CandidateProfileFormData): CandidateProfileFormData {
  if (!candidateProfile.resume_url) {
    return candidateProfile;
  }

  const derived = deriveResumeAutoFill(candidateProfile.resume_url);

  return {
    ...candidateProfile,
    headline: candidateProfile.headline || derived.headline,
    skills: candidateProfile.skills.length > 0 ? candidateProfile.skills : derived.skills,
  };
}

export function normalizeCandidateProfile(input: Partial<CandidateProfileFormData>): CandidateProfileFormData {
  return {
    headline: typeof input.headline === 'string' ? input.headline.trim() : '',
    skills: sanitizeStringArray(input.skills),
    experience_years: sanitizeOptionalNumber(input.experience_years),
    education: typeof input.education === 'string' ? input.education.trim() : '',
    resume_url: typeof input.resume_url === 'string' ? input.resume_url.trim() : '',
    linkedin_url: typeof input.linkedin_url === 'string' ? input.linkedin_url.trim() : '',
    github_url: typeof input.github_url === 'string' ? input.github_url.trim() : '',
    portfolio_url: typeof input.portfolio_url === 'string' ? input.portfolio_url.trim() : '',
    salary_min: sanitizeOptionalNumber(input.salary_min),
    salary_max: sanitizeOptionalNumber(input.salary_max),
    currency: typeof input.currency === 'string' ? input.currency.trim() : 'INR',
    preferred_locations: sanitizeStringArray(input.preferred_locations),
    job_type: typeof input.job_type === 'string' ? input.job_type.trim() : '',
    open_to_remote: typeof input.open_to_remote === 'boolean' ? input.open_to_remote : true,
    is_visible: typeof input.is_visible === 'boolean' ? input.is_visible : true,
    profile_strength: sanitizeOptionalNumber(input.profile_strength) ?? 0,
  };
}
