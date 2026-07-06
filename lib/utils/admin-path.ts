/**
 * Utility to get the configured Secret Admin Path.
 * If NEXT_PUBLIC_ADMIN_SECRET_PATH is set in .env.local (e.g. 'sys-ctrl-9842a'),
 * all admin routes dynamically use that prefix without breaking existing code.
 */
export function getAdminSecretPath(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH) {
    return process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH.replace(/^\/+|\/+$/g, '');
  }
  return 'admin';
}

export function getAdminUrl(subPath: string = '/dashboard'): string {
  const secretPath = getAdminSecretPath();
  const cleanSubPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
  
  if (cleanSubPath.startsWith('/admin')) {
    return cleanSubPath.replace('/admin', `/${secretPath}`);
  }
  return `/${secretPath}${cleanSubPath}`;
}
