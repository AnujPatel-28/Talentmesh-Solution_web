import { useEffect } from 'react';
import { refreshAccessToken } from '@/lib/insforge';

/**
 * Periodically refreshes user sessions to prevent surprise logouts while active.
 * Timeout intervals scale based on roles:
 * - Admin / Super Admin: 5 minutes
 * - Recruiter: 10 minutes
 * - Candidate / Default: 15 minutes
 */
export function useSessionRefresh(role?: string) {
  useEffect(() => {
    if (!role) return;

    let intervalMs = 15 * 60 * 1000; // Default candidate / fallback rate: 15m
    
    if (role === 'admin' || role === 'super_admin') {
      intervalMs = 5 * 60 * 1000; // Admin rate: 5m
    } else if (role === 'recruiter') {
      intervalMs = 10 * 60 * 1000; // Recruiter rate: 10m
    } else if (role === 'candidate') {
      intervalMs = 15 * 60 * 1000; // Candidate rate: 15m
    }

    // Add a randomized jitter (up to 10 seconds) to prevent simultaneous intervals
    const jitter = Math.random() * 10000;
    const finalInterval = intervalMs + jitter;

    const intervalId = setInterval(async () => {
      // Avoid rotating tokens in inactive tabs to lower backend workloads
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const lastRefresh = parseInt(localStorage.getItem('tm_last_refresh_time') || '0');
        const now = Date.now();
        
        // Coordinated lock: if another tab refreshed within the last 45 seconds, skip this cycle
        if (now - lastRefresh < 45 * 1000) {
          console.log('[SessionRefresh] Token rotation skipped: another tab refreshed recently.');
          return;
        }

        // Lock refresh timestamp before calling API to prevent race conditions
        localStorage.setItem('tm_last_refresh_time', now.toString());

        console.log(`[SessionRefresh] Rotating token proactively for role: ${role}`);
        try {
          await refreshAccessToken();
        } catch (err) {
          console.warn('[SessionRefresh] Proactive token rotation failed:', err);
        }
      }
    }, finalInterval);

    return () => clearInterval(intervalId);
  }, [role]);
}
