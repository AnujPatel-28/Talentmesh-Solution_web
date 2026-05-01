import { insforge, handleApiCall } from './index';
import { QueryFilter } from '@/types/filters';
import { ApiState } from '@/types/dashboard';

export const SearchApi = {
  /**
   * Search for jobs based on filters
   */
  async searchJobs(filters: QueryFilter, limit: number = 20, offset: number = 0) {
    return handleApiCall(async () => {
      let query = insforge.database
        .from('jobs')
        .select(`
          *,
          company:companies(name, logo_url)
        `, { count: 'exact' });

      // Apply Location Filter
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      // Apply Job Types
      if (filters.jobTypes.length > 0) {
        query = query.in('type', filters.jobTypes);
      }

      // Apply Salary Range
      query = query.gte('salary_min', filters.salary.min);
      query = query.lte('salary_max', filters.salary.max);

      // Note: aiMatchRate removed as it's not in the base schema

      // Pagination
      query = query.range(offset, offset + limit - 1);
      
      return query as any;
    });
  },

  /**
   * Search for candidates based on filters
   */
  async searchCandidates(filters: QueryFilter, limit: number = 20, offset: number = 0) {
    return handleApiCall(async () => {
      // In InsForge/PostgREST, we can join profiles using the foreign key
      let query = insforge.database
        .from('candidate_profiles')
        .select(`
          *,
          profiles(name, avatar_url, location)
        `, { count: 'exact' });

      // Apply Skills (Logic: AND vs OR)
      if (filters.skills.length > 0) {
        if (filters.skillLogic === 'AND') {
          query = query.contains('skills', filters.skills);
        } else {
          query = query.overlaps('skills', filters.skills);
        }
      }

      // Apply Experience
      query = query.gte('experience_years', filters.yearsExp.min);
      query = query.lte('experience_years', filters.yearsExp.max);

      // Apply AI Score (profile_strength)
      if (filters.aiScoreMin > 0) {
        query = query.gte('profile_strength', filters.aiScoreMin);
      }

      // Pagination
      query = query.range(offset, offset + limit - 1);

      return query as any;
    });
  },

  /**
   * Save a search configuration
   */
  async saveSearch(userId: string, name: string, filters: QueryFilter): Promise<ApiState<any>> {
    return handleApiCall(async () => 
      insforge.database
        .from('saved_searches')
        .insert([{ user_id: userId, name, filters }])
        .select()
        .single() as any
    );
  },

  /**
   * Fetch saved searches for a user
   */
  async getSavedSearches(userId: string): Promise<ApiState<any[]>> {
    return handleApiCall(async () => 
      insforge.database
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as any
    );
  },

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(id: string): Promise<ApiState<null>> {
    return handleApiCall(async () => 
      insforge.database
        .from('saved_searches')
        .delete()
        .eq('id', id) as any
    );
  }
};
