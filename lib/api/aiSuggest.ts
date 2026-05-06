import { insforge } from '../insforge';

export interface Suggestion {
  label: string;
  source: 'exact' | 'ai';
  description?: string;
}

const CACHE = new Map<string, Suggestion[]>();

export const AISuggestApi = {
  /**
   * Get semantic suggestions for skills or job titles
   */
  async getSuggestions(
    query: string, 
    type: 'skill' | 'job_title', 
    context?: string[]
  ): Promise<Suggestion[]> {
    const cacheKey = `${type}:${query}:${context?.join(',') || ''}`;
    if (CACHE.has(cacheKey)) {
      return CACHE.get(cacheKey)!;
    }

    // Manual debounce/timeout orchestration
    return new Promise(async (resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn('AI Suggestion timed out');
        resolve([]); // Fallback to empty (caller will merge with exact)
      }, 2000);

      try {
        const prompt = `
          You are a professional HR assistant for TalentMesh.
          Based on the partial query "${query}", suggest 5-8 relevant ${type}s.
          ${context && context.length > 0 ? `Context (user's existing skills/experience): ${context.join(', ')}` : ''}
          
          Guidelines:
          - Return highly professional and industry-standard terms.
          - If the user has context, suggest terms that complement the existing ${type}s.
          - For skills, ignore capitalization and focus on modern tech/business stack.
          - For job titles, focus on standard seniority/specialization levels.
          
          RESPONSE FORMAT:
          Return ONLY a JSON array of strings. Example: ["React", "Next.js"]
        `;

        const completion = await insforge.ai.chat.completions.create({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          maxTokens: 200,
        });

        const content = completion.choices[0].message.content;
        const parsed = JSON.parse(content.replace(/[\s\S]*?(\[[\s\S]*\])[\s\S]*/, '$1') || '[]');
        
        const suggestions: Suggestion[] = parsed.map((label: string) => ({
          label,
          source: 'ai'
        }));

        CACHE.set(cacheKey, suggestions);
        clearTimeout(timeoutId);
        resolve(suggestions);
      } catch (error) {
        console.error('AI Suggestion Error:', error);
        clearTimeout(timeoutId);
        resolve([]);
      }
    });
  }
};
