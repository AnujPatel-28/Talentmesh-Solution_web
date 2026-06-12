import { ApplicationStatus } from './application-status';

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  interviewing: "Interviewing",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
} as const;

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: '#3b82f6',      // Blue
  reviewing: '#f59e0b',    // Amber
  shortlisted: '#10b981',  // Emerald
  interviewing: '#7c3aed', // Purple
  offered: '#10b981',      // Emerald
  hired: '#059669',        // Dark Emerald
  rejected: '#ef4444',     // Red
  withdrawn: '#64748b',    // Slate
} as const;
