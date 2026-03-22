import { z } from 'zod';

export const candidateProfileSchema = z.object({
  // Profiles table fields
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().max(20).optional(),
  location: z.string().max(100).optional(),
  bio: z.string().max(1000, 'Bio must be at most 1000 characters').optional(),
  
  // Candidate profiles table fields
  headline: z.string().max(160, 'Headline must be at most 160 characters').optional(),
  skills: z.array(z.string()).max(30, 'You can add up to 30 skills').default([]),
  experience_years: z.number().min(0).max(50, 'Experience must be between 0 and 50 years').default(0),
  salary_min: z.number().min(0).optional(),
  salary_max: z.number().min(0).optional(),
  job_types: z.array(z.string()).default([]),
  preferred_locations: z.array(z.string()).default([]),
  open_to_remote: z.boolean().default(true),
  linkedin_url: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
  github_url: z.string().url('Invalid GitHub URL').or(z.literal('')).optional(),
  portfolio_url: z.string().url('Invalid Portfolio URL').or(z.literal('')).optional(),
});

export const applicationSchema = z.object({
  cover_letter: z.string().max(1500, 'Cover letter must be at most 1500 characters').optional(),
});

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;

const flattenErrors = (error: z.ZodError) => {
  const errors: Record<string, string> = {};
  error.issues.forEach((err: z.ZodIssue) => {
    const path = err.path[0]?.toString();
    if (path && !errors[path]) {
      errors[path] = err.message;
    }
  });
  return errors;
};

export const validateCandidateProfile = (data: unknown) => {
  const result = candidateProfileSchema.safeParse(data);
  return result.success 
    ? { success: true, data: result.data, errors: null } 
    : { success: false, data: null, errors: flattenErrors(result.error) };
};

export const validateApplication = (data: unknown) => {
  const result = applicationSchema.safeParse(data);
  return result.success 
    ? { success: true, data: result.data, errors: null } 
    : { success: false, data: null, errors: flattenErrors(result.error) };
};
