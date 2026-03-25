import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/handler';
import { insforgeAdmin } from '@/lib/insforge-admin';

export const GET = withApi(
  {
    allowedRoles: ['admin', 'super_admin'],
    requireAuth: true,
  },
  async (req, { query }) => {
    if (!insforgeAdmin) {
      return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    try {
      let queryBuilder = insforgeAdmin.database
        .from('profiles')
        .select(`
          id,
          email,
          name,
          phone,
          location,
          is_active,
          created_at,
          candidate_profiles (
            headline,
            skills,
            experience_years,
            education,
            resume_url,
            profile_strength,
            linkedin_url,
            github_url,
            portfolio_url
          )
        `)
        .eq('role', 'candidate')
        .order('created_at', { ascending: false });

      if (search) {
        queryBuilder = queryBuilder.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const from = page * limit;
      const to = from + limit - 1;
      queryBuilder = queryBuilder.range(from, to);

      const { data: candidates, error, count } = await queryBuilder;

      if (error) throw error;

      return NextResponse.json({
        candidates: candidates || [],
        count: count || 0,
      });
    } catch (err: any) {
      console.error('Admin Fetch Candidates Error:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
);
