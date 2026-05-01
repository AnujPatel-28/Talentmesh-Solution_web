import { CandidateSchema } from '../lib/validators/dashboard';
import { parseApiResponse } from '../lib/validators/index';

const validCandidate = {
  id: 'cand_123',
  name: 'Jane Doe',
  avatar: 'JD',
  role: 'Frontend Engineer',
  stage: 'Interview',
  aiScore: 95,
  skillAlignment: 90,
  experienceFit: 85,
  culturalMatch: 92,
  skills: ['React', 'TypeScript'],
  yearsExp: 5,
  location: 'New York, NY',
  appliedAt: new Date().toISOString(),
  urgent: false,
  status: 'active',
  salary: '$120k',
};

const invalidCandidate = {
  ...validCandidate,
  aiScore: 105, // Should fail (max 100)
};

console.log('--- Testing Valid Candidate ---');
try {
  const parsed = parseApiResponse(CandidateSchema, validCandidate);
  console.log('✅ Validation passed');
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error('❌ Validation failed unexpectedly:', message);
}

console.log('--- Testing Invalid Candidate (Score > 100) ---');
try {
  parseApiResponse(CandidateSchema, invalidCandidate);
  console.error('❌ Validation passed unexpectedly');
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.log('✅ Validation failed correctly:', message);
}
