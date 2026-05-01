# API Decommissioning Plan

The following Next.js API routes are now fully migrated to InsForge Edge Functions and are safe to remove.

## Fully Migrated (Safe to Delete)

- [x] `/api/auth/*` -> Migrated to `auth-session`, `auth-signup`, `auth-verify`, etc.
- [x] `/api/upload-resume` -> Migrated to `upload-resume` Edge Function.
- [x] `/api/upload-logo` -> Migrated to `upload-logo` Edge Function.
- [x] `/api/upload-blog-image` -> Migrated to `upload-blog-image` Edge Function.
- [x] `/api/resume/parse` -> Migrated to `resume-parse` Edge Function (using InsForge AI).
- [x] `/api/dashboard/*` -> Migrated to `dashboard` Edge Function (aggregated).

## Partially Migrated / Pending

- [ ] `/api/admin/*` -> Should be migrated to specialized admin Edge Functions.
- [ ] `/api/recruiter/*` -> Should be migrated to recruiter-specific Edge Functions.
- [ ] `/api/email/*` -> Can be handled via Edge Functions or direct SMTP integration.
- [ ] `/api/interview/*` -> Real-time integration via InsForge Realtime.
- [ ] `/api/mfa/*` -> Migrated to `mfa-enroll` / `mfa-verify` (once developed).

## Next Steps

1. Delete the `app/api/auth` directory.
2. Delete the `app/api/upload-*` directories.
3. Delete the `app/api/resume/parse` directory.
4. Verify all components are still functional.
