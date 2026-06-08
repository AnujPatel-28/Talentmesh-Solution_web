import { NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';

export async function GET(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    const serviceKey = process.env.INSFORGE_SERVICE_KEY;

    const insforge = createClient({
        baseUrl: supabaseUrl,
        anonKey: serviceKey,
        isServerMode: true
    });

    const { data: policies, error } = await insforge.database.rpc('exec_sql', { query: "SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles';" });

    // If rpc doesn't work, maybe just try an insert?
    return NextResponse.json({ policies, error });
}
