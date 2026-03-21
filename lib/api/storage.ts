import { insforge } from '@/lib/insforge';

/**
 * Utility for uploading resumes to the 'resumes' bucket.
 * Constraints: Max 5MB, application/pdf only.
 */
export async function uploadResume(file: File, userId: string): Promise<string> {
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
    .upload(path, file);

  if (error) {
    console.error('Resume upload error:', error);
    throw new Error(`Failed to upload resume: ${error.message}`);
  }

  if (!data?.url) {
    throw new Error('Upload succeeded but no URL was returned.');
  }

  return data.url;
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
  // 1. Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid image type. Use JPEG, PNG, WebP, or SVG.');
  }

  // 2. Validate file size (2MB)
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Logo too large. Company logo must be less than 2MB.');
  }

  // 3. Upload to companyId/filename
  const path = `${companyId}/${Date.now()}_${file.name}`;
  const { data, error } = await insforge.storage
    .from('company-logos')
    .upload(path, file);

  if (error) {
    console.error('Logo upload error:', error);
    throw new Error(`Failed to upload logo: ${error.message}`);
  }

  if (!data?.url) {
    throw new Error('Upload succeeded but no URL was returned.');
  }

  return data.url;
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
