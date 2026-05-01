import { insforge, handleApiCall } from './index';
import { Candidate, ApiState } from '@/types/dashboard';

export const CandidatesApi = {
  /**
   * Fetch all candidates
   */
  async fetchAll(): Promise<ApiState<Candidate[]>> {
    return handleApiCall(async () => 
      insforge.database
        .from('candidates')
        .select('*')
        .order('appliedAt', { ascending: false }) as any
    );
  },

  /**
   * Fetch a single candidate by ID
   */
  async fetchById(id: string): Promise<ApiState<Candidate>> {
    return handleApiCall(async () => 
      insforge.database
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single() as any
    );
  },

  /**
   * Create a new candidate
   */
  async create(candidate: Omit<Candidate, 'id'>): Promise<ApiState<Candidate>> {
    return handleApiCall(async () => 
      insforge.database
        .from('candidates')
        .insert([candidate])
        .select()
        .single() as any
    );
  },

  /**
   * Update an existing candidate
   */
  async update(id: string, updates: Partial<Candidate>): Promise<ApiState<Candidate>> {
    return handleApiCall(async () => 
      insforge.database
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .select()
        .single() as any
    );
  },

  /**
   * Delete a candidate
   */
  async delete(id: string): Promise<ApiState<null>> {
    return handleApiCall(async () => 
      insforge.database
        .from('candidates')
        .delete()
        .eq('id', id) as any
    );
  },

  /**
   * Fetch candidates by pipeline stage
   */
  async fetchByStage(stageId: string): Promise<ApiState<Candidate[]>> {
    return handleApiCall(async () => 
      insforge.database
        .from('candidates')
        .select('*')
        .eq('stage', stageId)
        .order('aiScore', { ascending: false }) as any
    );
  }
};
