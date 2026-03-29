import { NextResponse } from 'next/server';
import { insforgeAdmin } from '@/lib/insforge-admin';
import { getServerUser } from '@/lib/server-auth';

export async function POST(req: Request) {
  try {
    const user = await getServerUser();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('companyId') as string;

    if (!file || !companyId || !insforgeAdmin) {
      return NextResponse.json(
        { error: 'Missing file, companyId, or admin client' },
        { status: 400 }
      );
    }

    // 1. File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Use JPEG, PNG, WebP, or SVG.' },
        { status: 400 }
      );
    }

    // 2. File size validation (max 2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Company logo must be less than 2MB' },
        { status: 400 }
      );
    }

    const path = `${companyId}/${Date.now()}_${file.name}`;

    // Upload using admin client to bypass RLS issues on inserts
    const { error } = await insforgeAdmin.storage
      .from('company-logos')
      .upload(path, file as any);

    if (error) {
      console.error('Admin storage upload error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const result = insforgeAdmin.storage
      .from('company-logos')
      .getPublicUrl(path);

    const publicUrl = (result as any).data?.publicUrl || (result as any).publicUrl;

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Upload Logo Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
