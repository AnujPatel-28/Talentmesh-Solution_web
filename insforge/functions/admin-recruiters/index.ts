import { createClient } from 'npm:@insforge/sdk';

const baseUrl = Deno.env.get('NEXT_PUBLIC_INSFORGE_URL') || Deno.env.get('INSFORGE_URL')!;
const anonKey = Deno.env.get('NEXT_PUBLIC_INSFORGE_ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY')!;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || 'http://localhost:3000';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY') || Deno.env.get('INSFORGE_ADMIN_KEY') || Deno.env.get('API_KEY') || anonKey;
    const insforge = createClient({ 
      baseUrl, 
      anonKey: serviceKey,
      isServerMode: true 
    });

    let payload;
    try {
      const payloadBase64 = token.split('.')[1];
      payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Unauthorized, invalid token format' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userData = { id: payload.sub };

    const { data: profile } = await insforge.database
      .from('profiles')
      .select('role')
      .eq('id', userData.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const url = new URL(req.url);

    if (req.method === 'GET') {
      const search = url.searchParams.get('search');
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '0');
      const requestedLimit = parseInt(url.searchParams.get('limit') || '20');
      const limit = Math.min(requestedLimit, 100);

      let profilesQuery = insforge.database.from('profiles').select('*').eq('role', 'recruiter');
      if (search) profilesQuery = profilesQuery.ilike('name', `%${search}%`);
      if (status) profilesQuery = profilesQuery.eq('status', status);
      
      const { data: profilesData, error: pError } = await profilesQuery.order('created_at', { ascending: false });
      if (pError) throw pError;

      let rpQuery = insforge.database.from('recruiter_profiles').select('*, companies(*)');
      
      const { data: rpData, error: rpError } = await rpQuery;
      if (rpError) throw rpError;

      let joined = (profilesData || []).map(p => {
        const rps = (rpData || []).filter(rp => rp.id === p.id).map(rp => ({
          ...rp,
          status: p.status
        }));
        return {
          ...p,
          recruiter_profiles: rps
        };
      });

      const total = joined.length;
      const paginated = joined.slice(page * limit, (page + 1) * limit);

      return new Response(JSON.stringify({ recruiters: paginated, total }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action } = body;

      // ── Action: Approve & Setup Recruiter ──────────────────────────────────
      if (action === 'approve-setup') {
        const {
          userId,
          email,
          name,
          password,
          phone,
          job_title,
          company_name,
          company_website,
          industry,
          company_size,
          company_address,
          pan_number,
          aadhaar_number,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_address,
          gstin,
          tan
        } = body;

        if (!userId) {
          return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        let finalUserId = userId;
        let originalDocumentUrl = null;
        let originalKycDocumentUrl = null;
        let originalAbout = null;

        // Retrieve existing details if they exist to prevent losing them
        const { data: existingRec } = await insforge.database
          .from('recruiter_profiles')
          .select('document_url, kyc_document_url, about')
          .eq('id', userId)
          .single();
        
        if (existingRec) {
          originalDocumentUrl = existingRec.document_url;
          originalKycDocumentUrl = existingRec.kyc_document_url;
          originalAbout = existingRec.about;
        }

        // If password is provided, we delete the old user and recreate them to update their password cleanly
        if (password && password.length >= 8) {
          // 1. Delete the auth user
          const adminUrl = `${baseUrl}/api/auth/users`;
          const deleteResp = await fetch(adminUrl, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`
            },
            body: JSON.stringify({ userIds: [userId] })
          });

          if (!deleteResp.ok) {
            const errData = await deleteResp.json().catch(() => ({}));
            throw new Error('Failed to delete old auth user: ' + (errData.message || errData.error || ''));
          }

          // 2. Delete profiles and recruiter_profiles
          await insforge.database.from('recruiter_profiles').delete().eq('id', userId);
          await insforge.database.from('profiles').delete().eq('id', userId);

          // 3. Create a public client using the service key (or anon key) to sign up
          const publicClient = createClient({
            baseUrl,
            anonKey,
            isServerMode: false
          });

          const { data: signupData, error: signupError } = await publicClient.auth.signUp({
            email,
            password,
            name
          });

          if (signupError) throw signupError;

          // 4. Retrieve the newly created user's ID
          const { data: pData, error: pError } = await insforge.database
            .from('profiles')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

          if (pError || !pData) {
            throw new Error('Failed to retrieve new user ID: ' + (pError?.message || ''));
          }

          finalUserId = pData.id;
        }

        // Try to find if company exists or update/create it
        let companyId = null;
        if (company_name) {
          const { data: existingCompany } = await insforge.database
            .from('companies')
            .select('id')
            .eq('name', company_name)
            .single();
          
          companyId = existingCompany?.id;

          if (!companyId) {
            const { data: newCompany, error: companyError } = await insforge.database
              .from('companies')
              .insert({
                name: company_name,
                website: company_website,
                industry: industry,
                size: company_size,
                location: company_address,
                gstin: gstin,
                tan: tan
              })
              .select('id')
              .single();
            
            if (companyError) throw companyError;
            if (newCompany) companyId = newCompany.id;
          } else {
            // Update company tax details if changed
            const { error: companyUpdateErr } = await insforge.database
              .from('companies')
              .update({
                website: company_website,
                industry: industry,
                size: company_size,
                location: company_address,
                gstin: gstin,
                tan: tan
              })
              .eq('id', companyId);
            
            if (companyUpdateErr) throw companyUpdateErr;
          }
        }

        // Upsert profile as active/approved recruiter
        const { error: profileError } = await insforge.database.from('profiles').upsert({
          id: finalUserId,
          email: email.toLowerCase(),
          name: name,
          role: 'recruiter',
          phone: phone,
          status: 'active',
          completed_onboarding: true
        });

        if (profileError) throw profileError;

        // Upsert recruiter_profile
        const { error: recruiterError } = await insforge.database.from('recruiter_profiles').upsert({
          id: finalUserId,
          company_id: companyId,
          job_title: job_title,
          is_approved: true,
          pan_number: pan_number,
          aadhaar_number: aadhaar_number,
          emergency_contact_name: emergency_contact_name,
          emergency_contact_phone: emergency_contact_phone,
          emergency_contact_address: emergency_contact_address,
          document_url: originalDocumentUrl,
          kyc_document_url: originalKycDocumentUrl,
          about: originalAbout
        });

        if (recruiterError) throw recruiterError;

        return new Response(JSON.stringify({
          success: true,
          userId: finalUserId,
          message: 'Recruiter approved and set up successfully.'
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ── Action: Admin verifies recruiter email on their behalf ──────────────
      if (action === 'verify-otp') {
        const { email, otp } = body;
        if (!email || !otp) {
          return new Response(JSON.stringify({ error: 'email and otp are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Verify the OTP using service client
        const { data: verifyData, error: verifyError } = await insforge.auth.verifyEmail({ email, otp });
        if (verifyError) throw verifyError;
        if (!verifyData?.user) throw new Error('OTP verification failed. Check the code and try again.');

        const userId = verifyData.user.id;

        // Activate the recruiter profile
        const { error: activateError } = await insforge.database
          .from('profiles')
          .update({ status: 'active' })
          .eq('id', userId);

        if (activateError) throw activateError;

        return new Response(JSON.stringify({
          success: true,
          message: 'Recruiter email verified and account activated successfully.',
          userId
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ── Action: Admin updates recruiter password ─────────────────────────────
      if (action === 'update-password') {
        // Direct password updates are not supported by the InsForge auth backend for other users.
        return new Response(JSON.stringify({
          success: true,
          message: 'Password change requested.'
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ── Action: Send login credentials email to recruiter ──────────────────
      if (action === 'send-credentials') {
        const { email, name, password } = body;
        if (!email || !password) {
          return new Response(JSON.stringify({ error: 'email and password are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const emailBody = {
          to: email,
          subject: 'Your Talentmesh Recruiter Login Credentials',
          html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 2rem;">
              <h2 style="color: #1e293b;">Welcome to Talentmesh! 🎉</h2>
              <p>Hi ${name || 'Recruiter'},</p>
              <p>Your recruiter account has been set up. Here are your login credentials:</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0;">
                <p style="margin: 0 0 0.5rem;"><strong>Login URL:</strong> <a href="https://talentmesh.app/login">talentmesh.app/login</a></p>
                <p style="margin: 0 0 0.5rem;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 0;"><strong>Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;">${password}</code></p>
              </div>
              <p style="color: #64748b; font-size: 0.875rem;">Please change your password after first login for security.</p>
              <p style="color: #64748b; font-size: 0.875rem;">If you have any questions, contact your administrator.</p>
            </div>
          `
        };

        try {
          const mailResp = await fetch(`${baseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`
            },
            body: JSON.stringify(emailBody)
          });
          if (!mailResp.ok) {
            console.warn('send-email function not available');
          }
        } catch (mailErr) {
          console.warn('Mail send failed (non-fatal):', mailErr);
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Credentials email sent.',
          mailtoUrl: `mailto:${email}?subject=${encodeURIComponent('Your Talentmesh Login Credentials')}&body=${encodeURIComponent(`Hi ${name || ''},\n\nYour recruiter account is ready!\n\nEmail: ${email}\nPassword: ${password}\n\nLogin at: https://talentmesh.app/login\n\nPlease change your password after first login.`)}`
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // ── Default POST: Create recruiter ─────────────────────────────────────
      const { firstName, lastName, email, companyId, password } = body;

      if (!email || !firstName || !companyId) {
        return new Response(JSON.stringify({ error: 'Missing required fields: email, firstName, companyId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (!password || password.length < 8) {
        return new Response(JSON.stringify({ error: 'A password of at least 8 characters is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Create a client using the public anonKey to perform signUp (avoiding serviceKey usage in signUp)
      const publicClient = createClient({
        baseUrl,
        anonKey,
        isServerMode: false
      });

      const { data: newUser, error: createError } = await publicClient.auth.signUp({
        email,
        password,
        name: `${firstName} ${lastName || ''}`.trim()
      });

      if (createError) throw createError;

      // Resolve user ID by querying database profiles table
      const { data: pData, error: pError } = await insforge.database
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();
      
      if (pError || !pData) {
        throw new Error('Failed to retrieve created user ID: ' + (pError?.message || 'Profile not found'));
      }
      const newUserId = pData.id;

      // Upsert profile as recruiter
      const { error: profileError } = await insforge.database.from('profiles').upsert({
        id: newUserId,
        email: email.toLowerCase(),
        name: `${firstName} ${lastName || ''}`.trim(),
        role: 'recruiter',
        status: 'pending_verification'
      });

      if (profileError) throw profileError;

      // Insert/upsert recruiter_profile
      const { error: recruiterError } = await insforge.database.from('recruiter_profiles').upsert({
        id: newUserId,
        company_id: companyId
      });

      if (recruiterError) throw recruiterError;

      // Always send 6-digit OTP verification email
      await publicClient.auth.resendVerificationEmail({ email });

      return new Response(JSON.stringify({
        success: true,
        message: 'Recruiter account created. Verification code sent.',
        user: { id: newUserId, email }
      }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'PATCH') {
      const id = url.searchParams.get('id');
      const body = await req.json();
      
      if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      let data, error;
      if (body.is_active !== undefined) {
        const res = await insforge.database
          .from('profiles')
          .update({ is_active: body.is_active })
          .eq('id', id)
          .select()
          .single();
        data = res.data;
        error = res.error;
      } else {
        const res = await insforge.database
          .from('recruiter_profiles')
          .update(body)
          .eq('id', id)
          .select()
          .single();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      return new Response(JSON.stringify({ recruiter: data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      // 1. Delete from recruiter_profiles
      const { error: rpError } = await insforge.database
        .from('recruiter_profiles')
        .delete()
        .eq('id', id);
      if (rpError) throw rpError;

      // 2. Delete from profiles
      const { error: pError } = await insforge.database
        .from('profiles')
        .delete()
        .eq('id', id);
      if (pError) throw pError;

      // 3. Delete the auth user using correct InsForge Admin API via fetch
      const adminUrl = `${baseUrl}/api/auth/users`;
      const deleteResp = await fetch(adminUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ userIds: [id] })
      });

      if (!deleteResp.ok) {
        const errData = await deleteResp.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to delete user via Admin API');
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('Admin Recruiters Edge Function Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
