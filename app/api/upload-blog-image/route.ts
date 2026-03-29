import { NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Missing file' },
        { status: 400 }
      );
    }

    // Server client setup (mirroring upload-resume pattern)
    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    });

    // Custom path for blogs
    const path = `blog/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

    console.log('Uploading blog image to the final bucket:', path);

    // Upload using the SQL-verified bucket
    const { data, error } = await insforge.storage
      .from('blog_images_final')
      .upload(path, file as any);

    if (error) {
      console.error('Final upload API failure:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get public URL using the pattern from upload-resume
    const result = insforge.storage
      .from('blog_images_final')
      .getPublicUrl(path);

    const publicUrl = (result as any).publicUrl || (result as any).data?.publicUrl || result;

    return NextResponse.json({ url: publicUrl });

  } catch (err: any) {
    console.error('BLOG UPLOAD CATASTROPHE:', err);
    return NextResponse.json(
      { error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
