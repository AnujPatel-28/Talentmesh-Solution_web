import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('INSFORGE_URL') || Deno.env.get('NEXT_PUBLIC_INSFORGE_URL')!;
const anonKey = Deno.env.get('INSFORGE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { email, password, role, name } = await req.json();

    if (!email || !password || !role || !name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const insforge = createClient({ baseUrl, anonKey });

    // 1. Sign up the user
    const { data, error: signupError } = await insforge.auth.signUp({
      email,
      password,
      name,
    });

    if (signupError) {
      return new Response(JSON.stringify({ error: signupError.message }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (data?.user) {
      // 2. Create the profile record
      const { error: profileError } = await insforge.database
        .from('profiles')
        .insert([{
          id: data.user.id,
          email: data.user.email,
          role,
          name,
          completed_onboarding: false,
        }]);

      if (profileError) {
        return new Response(JSON.stringify({ error: profileError.message }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ 
      requireEmailVerification: data?.requireEmailVerification,
      user: data?.user,
      accessToken: data?.accessToken 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Signup API Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
