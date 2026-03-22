import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://localhost',
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'anon',
});

console.log('Available Auth methods:');
console.log(Object.keys(client.auth).filter(k => typeof (client.auth as any)[k] === 'function'));

console.log('HttpClient methods:');
console.log(Object.keys((client as any).auth.http || {}).filter(k => typeof (client as any).auth.http[k] === 'function'));
