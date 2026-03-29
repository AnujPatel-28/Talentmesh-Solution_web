import { NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { withApi } from '@/lib/api/handler';
import { z } from 'zod';

export const GET = withApi(
    {
        allowedRoles: ['admin', 'super_admin'],
    },
    async () => {
        if (!insforgeAdmin) return new NextResponse('Admin client not initialized', { status: 500 });

        const { data, error } = await insforgeAdmin
            .database
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ companies: data });
    }
);

export const POST = withApi(
    {
        schema: {
            body: z.object({
                name: z.string().min(1, 'Company name is required'),
                logo_url: z.string().optional().nullable()
            })
        },
        allowedRoles: ['admin', 'super_admin'],
        auditLog: true,
    },
    async (req, { body }) => {
        if (!insforgeAdmin) return new NextResponse('Admin client not initialized', { status: 500 });

        const { name, logo_url } = body as any;

        const { data, error } = await insforgeAdmin
            .database
            .from('companies')
            .insert([{ name, logo_url }])
            .select('*')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ company: data, success: true }, { status: 201 });
    }
);
