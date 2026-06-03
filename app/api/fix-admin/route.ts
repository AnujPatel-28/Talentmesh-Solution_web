import { NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    const serviceKey = process.env.INSFORGE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: 'Missing config' }, { status: 500 });
    }

    const insforge = createClient({
        baseUrl: supabaseUrl,
        anonKey: serviceKey,
        isServerMode: true
    });

    const { data, error } = await insforge.database
        .from('profiles')
        .update({
            role: 'super_admin',
            completed_onboarding: true
        })
        .eq('email', email)
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: data });
}
