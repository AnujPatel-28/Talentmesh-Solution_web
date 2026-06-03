# TalentMesh - Developer & Architecture Documentation

This documentation is designed for developers to understand the codebase, project architecture, and how specific features map to the file system.

---

## 🏗 System Architecture

TalentMesh is built on a modern, serverless stack:
- **Frontend**: Next.js 14 (App Router) using React Server Components (RSC) where possible, styled with CSS Modules and Tailwind.
- **Backend-as-a-Service**: InsForge (PostgreSQL database, Auth, Storage, Edge Functions).
- **Client State**: Zustand for global state, React Context for Auth.
- **Edge Compute**: InsForge Edge Functions (Deno/TypeScript) for heavy lifting, AI processing, and secure administrative tasks.

---

## 📂 Core Directory Structure

```text
d:\Talentmesh-AI-Recruiting-\
├── app/                      # Next.js App Router root
│   ├── (auth)/               # Unauthenticated routes (Login, Signup, Verify)
│   ├── api/                  # Next.js API Routes (Webhooks, internal proxies)
│   ├── browse-jobs/          # Public job search pages
│   ├── dashboard/            # Protected role-based dashboards (Admin, Candidate, Recruiter)
│   ├── onboarding/           # Post-signup role onboarding flows
│   └── globals.css           # Global Tailwind and CSS resets
├── components/               # Shared React components
│   ├── admin/                # Admin-specific UI (Universal Search, Data Tables)
│   ├── auth/                 # Forms, SSO buttons, OTP inputs
│   ├── candidate/            # Resume uploaders, Application Modals
│   ├── recruiter/            # Pipeline Kanban, Candidate Profile Drawers
│   └── shared/               # Buttons, Inputs, Modals, Loaders
├── insforge/                 # Backend infrastructure
│   ├── functions/            # Deno Edge Functions for serverless compute
│   └── migrations/           # SQL scripts for DB schema, RLS, triggers
├── lib/                      # Core utility libraries and SDK wrappers
│   ├── api/                  # Typed API fetchers mapped to Edge Functions/DB
│   └── auth/                 # AuthContext and server-side auth utilities
├── types/                    # Global TypeScript interfaces and DB schema types
└── scripts/                  # CI/CD and developer utility scripts
```

---

## 🌟 Feature-to-File Mapping

This section breaks down exactly **which files do what** for every major feature in the platform.

### 1. Authentication & Role Routing
Handles user sign-up, login, token management, and strict role-based redirection.
- **Frontend Entry points**: 
  - `app/(auth)/login/page.tsx`
  - `app/(auth)/signup/[role]/page.tsx`
- **Auth State & Context**: 
  - `lib/auth/AuthContext.tsx` (Provides global `user` and `role` to React tree).
  - `lib/auth/server-auth.ts` (Validates tokens in Server Components).
- **Backend Handlers**:
  - `insforge/functions/auth-signup/index.ts` (Triggered on signup to create base profiles).
  - `insforge/functions/auth-session/index.ts` (Handles token refresh and session state).
- **Route Protection**: 
  - `middleware.ts` (Validates JWT and enforces `/dashboard/admin` vs `/dashboard/recruiter` isolation).

### 2. Candidate Onboarding & Profile Builder
After signup, candidates must build their profile (resume, skills, experience) before applying to jobs.
- **Frontend Forms**: `app/onboarding/candidate/page.tsx`
- **Profile UI**: `app/dashboard/candidate/[role_id]/profile/page.tsx`
- **Resume Manager**: `components/candidate/ResumeManager.tsx` (Handles InsForge Storage uploads).
- **Backend**:
  - `insforge/functions/profile-complete-onboarding/` (Upgrades user status to 'active').
  - `insforge/functions/candidate-profile/` (Fetches/Updates candidate JSON data).

### 3. Recruiter Onboarding & Company Verification
Recruiters must verify their identity and company before publishing jobs.
- **Frontend Flow**: `app/onboarding/recruiter/setup/page.tsx` & `documents/page.tsx`
- **Verification UI**: `components/auth/RecruiterRegisterForm.tsx`
- **Backend (KYC)**: `insforge/functions/recruiter-request/` (Submits KYC docs to Admin queue).

### 4. Job Management & ATS Pipeline (Recruiter)
Recruiters create jobs and manage candidates through a Kanban pipeline.
- **Job Posting Wizard**: `app/dashboard/recruiter/[role_id]/jobs/[job_id]/page.tsx`
- **Kanban Pipeline UI**: `app/dashboard/recruiter/[role_id]/pipeline/page.tsx`
- **Candidate Drawer**: `components/recruiter/CandidateProfileDrawer.tsx` (Slide-out view of a candidate's resume/profile).
- **Backend APIs**:
  - `lib/api/jobs.ts` (Frontend fetchers for job CRUD).
  - `insforge/functions/jobs/` & `jobs-id/` (Edge functions validating job creation logic).

### 5. Job Discovery & Applications (Candidate)
Candidates browse open jobs and submit applications.
- **Public Job Board**: `app/browse-jobs/page.tsx` & `[id]/page.tsx`
- **Application Modal**: `components/candidate/ApplyModal.tsx`
- **Application Tracker**: `app/dashboard/candidate/[role_id]/page.tsx`
- **Backend Handlers**:
  - `insforge/functions/candidate-applications/` (Fetches a user's application history).
  - `insforge/functions/update-application/` (Handles state changes when candidate accepts/withdraws).

### 6. AI Matching & Recommendations
Calculates match scores between candidate skills and job requirements.
- **Frontend Integration**: Displayed via `<MatchScore />` badges in job lists.
- **API Fetcher**: `lib/api/aiSuggest.ts`
- **AI Backend Compute**:
  - `insforge/functions/ai-match/index.ts` (Performs semantic comparison via OpenAI/OpenRouter APIs).
  - `insforge/functions/recommendations/index.ts` (Generates daily personalized job feeds for candidates).

### 7. Super Admin Control Panel
Admins oversee the entire platform, approve recruiters, and view analytics.
- **Admin Dashboard Layout**: `app/dashboard/admin/page.tsx`
- **Approvals UI**: `app/dashboard/admin/recruiters/page.tsx` (Approve/Reject KYC).
- **Universal Search Component**: `components/admin/UniversalSearch.tsx` (Cross-table search).
- **Admin API Handlers**:
  - `insforge/functions/admin-recruiters/` (Executes approval and sends emails).
  - `insforge/functions/admin-reports/` (Aggregates platform revenue and usage stats).
  - `insforge/functions/admin-audit-logs/` (Tracks system-wide events).

### 8. Real-time Interviews (Video/Room)
Integrated platform for conducting live video interviews.
- **Room UI**: `app/(company)/interviews/[id]/room/page.tsx`
- **Post-Interview Review**: `app/(company)/interviews/[id]/review/page.tsx`
- **Backend Linker**: `lib/api/interview.ts` (Coordinates with external video SDKs like Daily.co).

---

## 🔌 API & Edge Function Architecture

Rather than connecting the Next.js client directly to the PostgreSQL database, **all complex business logic goes through InsForge Edge Functions** (`insforge/functions/`).

**Why?**
1. **Security**: Bypasses the need to expose raw DB operations to the client.
2. **Performance**: Edge functions run close to the database and return localized JSON.
3. **Third-Party Integrations**: Safe execution environment for AI keys (OpenRouter), Email triggers (Nodemailer), and Webhooks.

**How to call an Edge function from the Frontend:**
Use the global `lib/insforge.ts` client:
```typescript
import { insforge } from '@/lib/insforge';

const { data, error } = await insforge.functions.invoke('ai-match', {
  body: { jobId: '123', candidateId: '456' }
});
```

---

## 🗄️ Database & Schema Notes
The database enforces security primarily via **Row Level Security (RLS)**.
- See `insforge/migrations/` for all `fix-rls-*.sql` files.
- **Rule of Thumb**: A Candidate profile row can only be `SELECT`ed by the candidate themselves, OR by a Recruiter if the candidate has applied to their job.
