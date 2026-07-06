import crypto from 'crypto';

/**
 * Validates the admin invite token against the environment variable.
 * Only runs on the server.
 */
export function validateAdminToken(token: string): boolean {
  if (typeof window !== 'undefined') {
    throw new Error('validateAdminToken must only be called on the server');
  }

  const secret = process.env.ADMIN_INVITE_TOKEN;
  if (!secret) return false;

  return token === secret;
}

/**
 * Checks if the provided email is in the admin whitelist.
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase());

  return adminEmails.includes(email.toLowerCase());
}

/**
 * Generates a new random admin token for setup.
 * Used only in dev/seed scripts.
 */
export function generateAdminToken(): string {
  const token = crypto.randomUUID();
  return token;
}
