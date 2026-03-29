import 'server-only';

import { createClient } from '@insforge/sdk';
import { cookies } from 'next/headers';

export async function getServerInsforgeClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('tm_access_token')?.value;

  if (!token) {
    return null;
  }

  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    edgeFunctionToken: token,
    isServerMode: true,
  });
}
