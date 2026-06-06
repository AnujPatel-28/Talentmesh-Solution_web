/**
 * Resolves a storage path/key to a browser-ready proxied URL.
 * Returns absolute URLs as-is for backward compatibility.
 */
export function getPublicStorageUrl(bucketName: string, pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return '';

  // 1. Backward Compatibility: return absolute URLs directly
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  // 2. Resolve relative path/key for browser proxy
  return `/api/v1/remote/api/storage/buckets/${bucketName}/objects/${encodeURIComponent(pathOrUrl)}`;
}

/**
 * Resolves a storage path/key to a server-side backend URL.
 * Returns absolute URLs as-is for backward compatibility.
 */
export function getServerStorageUrl(bucketName: string, pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return '';

  // 1. Backward Compatibility: return absolute URLs directly
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  // 2. Resolve relative path/key using direct backend base URL
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || '';
  return `${baseUrl}/api/storage/buckets/${bucketName}/objects/${encodeURIComponent(pathOrUrl)}`;
}
