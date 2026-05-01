import { insforge } from '@/lib/insforge';

/**
 * Utility for uploading resumes to the 'resumes' bucket.
 * Constraints: Max 5MB, application/pdf only.
 */
/*export async function uploadResume(file: File, userId: string): Promise<string> {
  // 1. Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Invalid file type. Only PDF resumes are accepted.');
  }
 
  // 2. Validate file size (5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Resume must be less than 5MB.');
  }

  // 3. Upload to userId/filename.pdf
  const path = `${userId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await insforge.storage
    .from('resumes')
    .upload(path, file)
    

  if (error) {
    console.error('Resume upload error:', error);
    throw new Error(`Failed to upload resume: ${error.message}`);
  }

  if (!data?.url) {
    throw new Error('Upload succeeded but no URL was returned.');
  }

  return data.url;
}
*/
/*export async function uploadResume(file: File, userId: string): Promise<string> {
  // 1. Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF resumes are accepted.');
  }

  // 2. Validate file size
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Max 5MB allowed.');
  }

  // 3. Generate path
  const path = `${userId}/${Date.now()}_${file.name}`;

  // 4. Ensure session
  const { data: sessionData } = await insforge.auth.refreshSession();
  if (!sessionData?.accessToken) {
    throw new Error('User not authenticated');
  }

  // 5. Upload file
  const { error } = await insforge.storage
    .from('resumes')
    .upload(path, file);

  if (error) {
    console.error('Upload error:', error);
    throw new Error(error.message);
  }

  // 6. Get public URL (ONLY THIS) fixed again
  /*const { data: publicUrlData } = insforge.storage
    .from('resumes')
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
  // 6. Get public URL
   const result = insforge.storage
       .from('resumes')
       .getPublicUrl(path);

       const publicUrl = (result as any).data.publicUrl;

       return publicUrl;
}*/
export async function uploadResume(file: File, userId: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  // Use the Edge Function URL directly for FormData upload
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL?.replace('ap-southeast.', 'functions.');
  const url = `${baseUrl}/upload-resume`;

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      // The Edge Function will expect an Authorization header if we want to use the user's context
      // but here we might just rely on the anon key if the function is public, 
      // or we can pass the token if available.
    }
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.url;
}




/**
 * Utility for uploading profile pictures to the 'avatars' bucket.
 * Constraints: Max 2MB, images only (jpeg, png, webp).
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  // 1. Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid image type. Use JPEG, PNG, or WebP.');
  }

  // 2. Validate file size (2MB)
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Image too large. Profile picture must be less than 2MB.');
  }

  // 3. Upload to userId/filename
  const path = `${userId}/${Date.now()}_${file.name}`;
  const { data, error } = await insforge.storage
    .from('avatars')
    .upload(path, file);

  if (error) {
    console.error('Avatar upload error:', error);
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }

  if (!data?.url) {
    throw new Error('Upload succeeded but no URL was returned.');
  }

  return data.url;
}

/**
 * Utility for uploading company logos to the 'company-logos' bucket.
 * Constraints: Max 2MB, images + SVG.
 */
export async function uploadCompanyLogo(file: File, companyId: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('companyId', companyId);

  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL?.replace('ap-southeast.', 'functions.');
  const url = `${baseUrl}/upload-logo`;

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.url;
}

/**
 * Utility for deleting files from a storage bucket.
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await insforge.storage.from(bucket).remove(path);

  if (error) {
    console.error(`Delete error in ${bucket}:`, error);
    throw new Error(`Failed to delete file from ${bucket}: ${error.message}`);
  }
}
/**
 * Utility for uploading blog cover images to the 'blog-images' bucket.
 * Constraints: Max 5MB, patterns (jpeg, png, webp).
 */
export async function uploadBlogImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL?.replace('ap-southeast.', 'functions.');
  const url = `${baseUrl}/upload-blog-image`;

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.url;
}
