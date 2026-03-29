import { NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Missing file or userId' },
        { status: 400 }
      );
    }

    // 🔥 VALIDATION START

    // 1. File type (PDF only)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // 2. File size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Max 5MB allowed' },
        { status: 400 }
      );
    }

    // 🔥 VALIDATION END

    // Create server client
    const insforge = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    });

    const path = `${userId}/${Date.now()}_${file.name}`;
   
    // for finding error
    //     console.log('Path:', path);
   

    // 🔥 ADD THIS HERE
   console.log("Uploading file:", {
  name: file.name,
  size: file.size,
  type: file.type,
  userId,
      });



    // Upload file
    const { error } = await insforge.storage
      .from('resumes')
      .upload(path, file as any);

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const result = insforge.storage
      .from('resumes')
      .getPublicUrl(path);

    const publicUrl = (result as any).publicUrl;
    // 🔥 SAVE TO DB
    await insforge.database
      .from('candidate_profiles')
      .update({ resume_path: path })
      .eq('id', userId);
      return NextResponse.json({ url: publicUrl });

  } 
  /*/catch (err) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }*/
  catch (err: any) {
  console.error('FULL ERROR:', err);
  
  return NextResponse.json(
    { error: err?.message || 'Upload failed' },
    { status: 500 }
  );
}
}