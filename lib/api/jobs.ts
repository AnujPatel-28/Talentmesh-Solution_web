import { insforge, invokeFunction } from '../insforge';
import { handleApiCall } from './index';

export interface Job {
    id: string;
    title: string;
    description: string;
    requirements: string[];
    skills_required: string[];
    location: string;
    type: string;
    department?: string;
    salary_min: number | null;
    salary_max: number | null;
    currency: string;
    experience_min: number | null;
    experience_max: number | null;
    status: 'active' | 'paused' | 'closed' | 'draft';
    created_at: string;
    updated_at: string;
    applications_count?: number;
    companies?: {
        name: string;
        logo_url: string | null;
    };
    salary?: string;
    posted_days?: number;
    ai_match_rate?: number;
    company_profiles?: any;
}

export interface JobFilters {
    search?: string;
    type?: string;
    location?: string;
    industry?: string;
    salary_min?: number;
    salary_max?: number;
    date_posted?: string;
    page?: number;
    limit?: number;
}

/**
 * Helper to build a URL with query parameters for Edge Functions
 */
function buildUrl(slug: string, params: Record<string, any>): string {
    const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
    );
    const query = new URLSearchParams(cleanParams as any).toString();
    return query ? `${slug}?${query}` : slug;
}

/**
 * Fetch approved/active jobs via Edge Function
 */
export async function getApprovedJobs(filters: JobFilters = {}): Promise<Job[]> {
    const { data, error } = await invokeFunction('jobs', {
        method: 'GET',
        queries: filters as any
    });

    if (error) throw error;
    return (data?.data || []) as Job[];
}

/**
 * Fetch a single job by ID via Edge Function
 */
export async function getJobById(id: string): Promise<Job | null> {
    const { data, error } = await invokeFunction(`jobs-id?id=${id}`, {
        method: 'GET'
    });

    if (error) {
        if (error.status === 404) return null;
        throw error;
    }
    return data?.job as Job;
}

/**
 * Legacy support for JobsApi object pattern
 */
export const JobsApi = {
    fetchAll: async (filters?: JobFilters) => invokeFunction(buildUrl('jobs', filters || {}), { method: 'GET' }),
    fetchById: async (id: string) => invokeFunction(`jobs-id?id=${id}`, { method: 'GET' }),
    create: async (job: Partial<Job>) => {
        return handleApiCall(async () => 
            insforge.database
                .from('jobs')
                .insert([job])
                .select()
                .single() as any
        );
    },
    update: async (id: string, updates: Partial<Job>) => {
        return handleApiCall(async () => 
            insforge.database
                .from('jobs')
                .update(updates)
                .eq('id', id)
                .select()
                .single() as any
        );
    },
    delete: async (id: string) => {
        return handleApiCall(async () => 
            insforge.database
                .from('jobs')
                .delete()
                .eq('id', id) as any
        );
    }
};

