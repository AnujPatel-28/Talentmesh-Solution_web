import { z } from 'zod';

export const candidateProfileSchema = z.object({
  headline: z.string().max(160, 'Headline must be at most 160 characters').optional(),
  skills: z.array(z.string()).max(30, 'You can add up to 30 skills').default([]),
  experience_years: z.number().min(0).max(50, 'Experience must be between 0 and 50 years').default(0),
  salary_min: z.number().positive('Minimum salary must be positive').optional(),
  salary_max: z.number().positive('Maximum salary must be positive').optional(),
  bio: z.string().max(1000, 'Bio must be at most 1000 characters').optional(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
  github_url: z.string().url('Invalid GitHub URL').or(z.literal('')).optional(),
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
