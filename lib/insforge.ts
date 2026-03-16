import { createClient } from '@insforge/sdk';

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://sytk3jgv.ap-southeast.insforge.app';
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'your-anon-key-here';

export const insforge = createClient({
  baseUrl,
  anonKey,
});
