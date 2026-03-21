import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title must be less than 120 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000, 'Description must be less than 5000 characters'),
  requirements: z.array(z.string()).min(1, 'Please add at least one requirement'),
  skills_required: z.array(z.string()).max(20, 'You can add up to 20 skills'),
  type: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']),
  location: z.string().min(1, 'Location is required'),
  salary_min: z.number().positive('Minimum salary must be positive'),
  salary_max: z.number().positive('Maximum salary must be positive'),
  currency: z.enum(['INR', 'USD']),
  experience_min: z.number().min(0).max(30, 'Experience must be between 0 and 30 years'),
  department: z.string().optional(),
  expires_at: z.date().refine((date) => date > new Date(), {
    message: 'Expiry date must be in the future',
  }).optional(),
}).refine((data) => data.salary_max > data.salary_min, {
  message: 'Maximum salary must be greater than minimum salary',
  path: ['salary_max'],
});

export const updateJobSchema = createJobSchema.partial();

export const jobFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']).optional(),
  location: z.string().optional(),
  page: z.number().int().positive('Page must be a positive integer').default(1),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobFilterInput = z.infer<typeof jobFilterSchema>;

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

export const validateCreateJob = (data: unknown) => {
  const result = createJobSchema.safeParse(data);
  return result.success 
    ? { success: true, data: result.data, errors: null } 
    : { success: false, data: null, errors: flattenErrors(result.error) };
};

export const validateUpdateJob = (data: unknown) => {
  const result = updateJobSchema.safeParse(data);
  return result.success 
    ? { success: true, data: result.data, errors: null } 
    : { success: false, data: null, errors: flattenErrors(result.error) };
};

export const validateJobFilter = (data: unknown) => {
  const result = jobFilterSchema.safeParse(data);
  return result.success 
    ? { success: true, data: result.data, errors: null } 
    : { success: false, data: null, errors: flattenErrors(result.error) };
};
