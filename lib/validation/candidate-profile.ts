import { z } from 'zod';

export const candidateProfileSchema = z.object({
  profile: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
  candidateProfile: z.object({
    headline: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience_years: z.number().nullable().optional(),
    education: z.string().optional(),
    resume_url: z.string().url().optional().or(z.literal('')),
    linkedin_url: z.string().url().optional().or(z.literal('')),
    github_url: z.string().url().optional().or(z.literal('')),
    portfolio_url: z.string().url().optional().or(z.literal('')),
    salary_min: z.number().nullable().optional(),
    salary_max: z.number().nullable().optional(),
    preferred_locations: z.array(z.string()).optional(),
    job_type: z.string().optional(),
  }).optional(),
});

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;
