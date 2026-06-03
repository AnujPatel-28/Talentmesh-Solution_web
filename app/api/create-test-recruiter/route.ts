import { createClient } from '@insforge/sdk';
import { NextResponse } from 'next/server';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const INSFORGE_SERVICE_KEY = process.env.INSFORGE_SERVICE_KEY;

export async function GET() {
  if (!INSFORGE_URL || !INSFORGE_SERVICE_KEY) {
    return NextResponse.json({ error: "Missing INSFORGE_URL or INSFORGE_SERVICE_KEY" }, { status: 500 });
  }

  const insforge = createClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_SERVICE_KEY,
    isServerMode: true,
  });

  const email = "recruiter@example.com";
  const password = "password123";

  try {
    // 1. Check if profile already exists to get ID
    const { data: existingProfile } = await insforge.database.from('profiles').select('id').eq('email', email).single();
    let userId = existingProfile?.id;

    if (!userId) {
      // 2. Create User
      const { data: authData, error: authError } = await insforge.auth.signUp({
        email,
        password,
        name: 'Test Recruiter',
        autoConfirm: true
      });

      if (authError && !authError.message.includes("already registered")) {
        throw authError;
      }

      userId = authData?.user?.id;

      if (!userId) {
        // Fallback if user was already registered but profile missing
        const { data: loginData, error: loginError } = await insforge.auth.signInWithPassword({ email, password });
        if (loginError || !loginData?.user) {
          throw new Error("Could not find, create, or login to user account.");
        }
        userId = loginData.user.id;
      }
    }

    const roleId = `recr_${Math.random().toString(36).substring(2, 10)}`;

    // 2. Ensure Profile exists
    await insforge.database.from('profiles').upsert({
      id: userId,
      email: email,
      name: 'Test Recruiter',
      role: 'recruiter',
      role_id: roleId,
      completed_onboarding: true
    });

    // 3. Create dummy company
    await insforge.database.from('companies').upsert({
      name: 'Test Tech Company',
      website: 'https://testtech.example.com',
      industry: 'Technology',
      size: '51-200'
    });

    const { data: fetchCompany } = await insforge.database.from('companies').select('id').eq('name', 'Test Tech Company').single();
    const companyId = fetchCompany?.id;

    // 4. Create recruiter_profiles entry
    await insforge.database.from('recruiter_profiles').upsert({
      id: userId,
      company_id: companyId,
      job_title: 'Senior Technical Recruiter',
      department: 'HR',
      permissions: ['all']
    });

    return NextResponse.json({
      success: true,
      message: "Successfully created test recruiter",
      credentials: { email, password, companyId }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
