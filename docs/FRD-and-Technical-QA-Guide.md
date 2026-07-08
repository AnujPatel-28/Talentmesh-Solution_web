# TalentMesh Solutions — Functional Requirements Document (FRD) & Technical QA Guide

**Product**: TalentMesh Recruitment & Staffing Platform  
**Version**: 1.0 (Public Beta)  
**Company**: Talent Mesh Solution Pvt. Ltd.  
**Last Updated**: 2026-07-08  
**Prepared For**: QA Team — Functional & Regression Testing  

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Authentication & Session Management](#3-authentication--session-management)
4. [Onboarding Flows](#4-onboarding-flows)
5. [Candidate Portal — Features & Test Cases](#5-candidate-portal)
6. [Recruiter Portal — Features & Test Cases](#6-recruiter-portal)
7. [Admin Portal — Features & Test Cases](#7-admin-portal)
8. [Platform-Wide / Shared Features](#8-platform-wide--shared-features)
9. [Edge Functions (Backend API) Reference](#9-edge-functions-backend-api-reference)
10. [Database Tables Reference](#10-database-tables-reference)
11. [Known Stubs & Planned Features](#11-known-stubs--planned-features)
12. [Status Legend](#12-status-legend)

---

## 1. Product Overview

TalentMesh Solutions is a result-driven recruitment and staffing platform providing end-to-end hiring lifecycle management. The platform serves **three user roles**:

| Role | Description | Subdomain |
|------|-------------|-----------|
| **Candidate** | Job seekers — browse jobs, apply, track applications, manage profile | `jobs.*` |
| **Recruiter** | Hiring managers — post jobs, manage pipeline, schedule interviews, extend offers | `app.*` |
| **Admin** | Platform administrators — oversee all users, approve recruiters/jobs, manage settings | `admin.*` |

### Business Rules
- Recruiters require admin approval before accessing the platform
- Candidates can self-register and begin browsing immediately after onboarding
- Admins have full CRUD access across all entities
- All API calls use InsForge SDK edge functions as the backend
- Session cookies are managed by a centralized Next.js API route (`/api/auth/session`)

---

## 2. Tech Stack & Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14+ (App Router), React 19, TypeScript |
| **Styling** | CSS Modules, Vanilla CSS |
| **State Management** | React Context (AuthContext), TanStack React Query |
| **Backend-as-a-Service** | InsForge (PostgreSQL, Auth, Storage, Edge Functions) |
| **Authentication** | InsForge Auth (Email/Password + Google/GitHub OAuth) |
| **File Storage** | InsForge Storage (Resumes, Avatars, Logos, Blog Images) |
| **Edge Functions** | 49 serverless functions (Deno runtime) |
| **Middleware** | `proxy.ts` — route protection, MFA validation, role-based redirects |
| **Deployment** | Vercel (Frontend), InsForge (Edge Functions) |
| **Real-time** | InsForge WebSocket pub/sub (notifications) |
| **Animations** | Framer Motion |
| **Charts** | Inline SVG/CSS-based visualizations |

### Key Architecture Patterns
- **Cookie Governance**: All session cookies (`tm_access_token`, `tm_role`, `tm_admin_access`) are exclusively set/cleared by `/api/auth/session` (server-side, HttpOnly)
- **Proxy Middleware**: `proxy.ts` validates `tm_access_token` cookie or `x-access-token` header on every request
- **Edge Function Pattern**: Client → `invokeFunction('function-name', { method, body, queries })` → InsForge Edge Function → PostgreSQL
- **Idempotency**: Write operations use `x-idempotency-key` headers to prevent duplicate submissions

---

## 3. Authentication & Session Management

### 3.1 Login Flow
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 3.1.1 | **Email/Password Login** | User enters email + password → InsForge `signInWithPassword()` → session cookie set via `/api/auth/session` | `insforge.auth.signInWithPassword` | ✅ LIVE |
| 3.1.2 | **Google OAuth Login** | "Continue with Google" button → OAuth redirect → `/auth/callback` processes token | InsForge OAuth | ✅ LIVE |
| 3.1.3 | **GitHub OAuth Login** | "Continue with GitHub" button → OAuth redirect → `/auth/callback` processes token | InsForge OAuth | ✅ LIVE |
| 3.1.4 | **Error Handling — Invalid Credentials** | Shows "Invalid email or password" message | Client-side validation | ✅ LIVE |
| 3.1.5 | **Error Handling — Unconfirmed Email** | Shows "Please confirm your email" + verification flow | `insforge.auth.verifyEmail` | ✅ LIVE |
| 3.1.6 | **"Remember Me" / Session Persistence** | Session persists for 7 days via HttpOnly cookie | `/api/auth/session` | ✅ LIVE |
| 3.1.7 | **Auto-redirect if already logged in** | If user has valid session, skip login page | `proxy.ts` middleware | ✅ LIVE |

#### QA Test Points — Login
- [ ] Enter valid candidate credentials → redirects to `/candidate/dashboard`
- [ ] Enter valid recruiter credentials → redirects to `/recruiter/dashboard`
- [ ] Enter valid admin credentials → redirects to `/<adminPath>/dashboard`
- [ ] Enter invalid email → shows validation error
- [ ] Enter wrong password → shows "Invalid email or password"
- [ ] Submit empty form → shows required field validation
- [ ] Login from `localhost` → cookie set without domain attribute
- [ ] Login from `*.qzz.io` → cookie domain set to `.qzz.io`
- [ ] Login from `*.talentmeshsolutions.com` → cookie domain set to `.talentmeshsolutions.com`
- [ ] Close browser, reopen → session should persist (7-day expiry)
- [ ] Verify no `?token=` appears in URL bar after redirect
- [ ] Verify `tm_access_token` cookie is `HttpOnly` (not accessible from JS console)

### 3.2 Signup Flow
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 3.2.1 | **Candidate Signup** | Email + password → profile creation → email verification | `auth-signup` | ✅ LIVE |
| 3.2.2 | **Recruiter Signup** | Email + password → profile creation → pending admin approval | `auth-signup` | ✅ LIVE |
| 3.2.3 | **Email Verification (OTP)** | 6-digit OTP sent to email → verified via `insforge.auth.verifyEmail` | InsForge Auth | ✅ LIVE |
| 3.2.4 | **Resend OTP** | Cooldown timer (60s) before allowing resend | Client-side timer | ✅ LIVE |
| 3.2.5 | **Role Selection** | `/signup` page → choose "Candidate" or "Recruiter" | Client routing | ✅ LIVE |

#### QA Test Points — Signup
- [ ] Candidate signup → receives verification email → OTP flow → redirect to onboarding
- [ ] Recruiter signup → receives verification email → redirect to pending-approval page
- [ ] Duplicate email signup → shows appropriate error
- [ ] Password < min length → shows validation error
- [ ] OTP resend button disabled during cooldown
- [ ] Expired OTP → shows error message

### 3.3 Password Recovery
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 3.3.1 | **Forgot Password** | Enter email → receive reset link | `admin-forgot-password` / InsForge Auth | ✅ LIVE |
| 3.3.2 | **Reset Password** | Token-based password reset page | InsForge Auth | ✅ LIVE |

### 3.4 Session Security
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 3.4.1 | **MFA (Multi-Factor Auth)** | TOTP-based MFA enrollment and verification | `mfa-status`, `mfa-backup-codes` | ✅ LIVE |
| 3.4.2 | **Session Timeout Warning** | Warning modal appears before session expires | AuthContext timer | ✅ LIVE |
| 3.4.3 | **Multi-tab Session Sync** | Session refresh coordinates across tabs | `useSessionRefresh` hook | ✅ LIVE |
| 3.4.4 | **Offline Detection** | Detects network loss and shows reconnect prompt | `useNetworkState` hook | ✅ LIVE |
| 3.4.5 | **Logout** | Clears all cookies via `/api/auth/session` DELETE | `/api/auth/session` | ✅ LIVE |

#### QA Test Points — Session Security
- [ ] Enable MFA → scan QR code → verify with TOTP code → MFA active
- [ ] Login with MFA enabled → prompted for TOTP after password
- [ ] Generate backup codes → use one to bypass MFA
- [ ] Leave tab idle for session timeout period → warning modal appears
- [ ] Click "Extend Session" → session refreshed
- [ ] Open two tabs → logout in one → both tabs should redirect to login
- [ ] Disconnect network → offline banner appears → reconnect → session resumes

---

## 4. Onboarding Flows

### 4.1 Candidate Onboarding
| # | Step | Description | Backend | Status |
|---|------|-------------|---------|--------|
| 4.1.1 | **Personal Info** | Name, phone, location | `candidate-profile` | ✅ LIVE |
| 4.1.2 | **Resume Upload** | PDF/DOCX upload → AI parsing | `upload-resume`, `resume-parse` | ✅ LIVE |
| 4.1.3 | **Skills & Experience** | Skills tags, experience years | `candidate-profile` | ✅ LIVE |
| 4.1.4 | **Job Preferences** | Preferred locations, job types, salary range, remote preference | `candidate-profile` | ✅ LIVE |
| 4.1.5 | **Complete Onboarding** | Marks `completed_onboarding = true` → redirects to dashboard | `profile-complete-onboarding` | ✅ LIVE |

#### QA Test Points — Candidate Onboarding
- [ ] Upload PDF resume → AI parses and pre-fills skills
- [ ] Upload DOCX resume → AI parses correctly
- [ ] Upload file > 10MB → shows error
- [ ] Skip optional fields → still completes onboarding
- [ ] After completion → `completed_onboarding` = true in DB
- [ ] Revisiting onboarding URL after completion → redirects to dashboard

### 4.2 Recruiter Onboarding
| # | Step | Description | Backend | Status |
|---|------|-------------|---------|--------|
| 4.2.1 | **Company Setup** | Company name, industry, website, logo upload | `company-profile`, `upload-logo` | ✅ LIVE |
| 4.2.2 | **Recruiter Profile** | Job title, phone | `recruiter-profile` | ✅ LIVE |
| 4.2.3 | **Documents Upload** | Company verification documents | `recruiter-document-proxy` | ✅ LIVE |
| 4.2.4 | **Hiring Interests** | Job categories, hiring volume, urgency | `recruiter-profile` | ✅ LIVE |
| 4.2.5 | **Pending Approval** | Recruiter waits for admin activation | `activate-recruiter` (admin-triggered) | ✅ LIVE |

#### QA Test Points — Recruiter Onboarding
- [ ] Upload company logo (PNG/JPG) → preview shown
- [ ] Fill all required fields → proceeds to next step
- [ ] After submission → lands on `/pending-approval` page
- [ ] Admin activates recruiter → recruiter can access dashboard on next login

---

## 5. Candidate Portal

**Base Route**: `/dashboard/candidate/[role_id]/`  
**Layout**: Sidebar navigation + top header with notifications & profile  

### 5.1 Dashboard Home (`page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.1.1 | **Job Feed** | Personalized job listings based on profile and preferences | `candidate-dashboard`, `jobs` | ✅ LIVE |
| 5.1.2 | **Search Bar** | Real-time job search by title, company, location | Client-side filter + `jobs` | ✅ LIVE |
| 5.1.3 | **Save Job** | Bookmark icon to save/unsave jobs | InsForge DB `saved_jobs` | ✅ LIVE |
| 5.1.4 | **Apply Modal** | Quick-apply modal with cover letter + resume selection | `ApplyModal` component | ✅ LIVE |
| 5.1.5 | **Job Cards** | Display: title, company, location, salary, type, experience, posted date | — | ✅ LIVE |
| 5.1.6 | **Company Logo** | Shows company logo from storage | `getPublicStorageUrl` | ✅ LIVE |
| 5.1.7 | **Share Job** | Share job link externally | Client-side | ✅ LIVE |
| 5.1.8 | **Application Stats Banner** | Shows total applications, interviews, profile strength | `candidate-dashboard` | ✅ LIVE |

#### QA Test Points — Dashboard Home
- [ ] Page loads → shows job feed with real data
- [ ] Search "Frontend" → filters matching jobs
- [ ] Click bookmark → job saved → icon fills
- [ ] Click bookmark again → job unsaved → icon unfills
- [ ] Click "Apply" → Apply Modal opens with resume picker
- [ ] Submit application → success toast → job card shows "Applied" badge
- [ ] Stats banner shows correct counts matching actual data

### 5.2 Find Jobs (`jobs/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.2.1 | **Job Search Page** | Dedicated job search with filters | `jobs` | ✅ LIVE |
| 5.2.2 | **Filter by Location** | Dropdown/input to filter by city | Client filter | ✅ LIVE |
| 5.2.3 | **Filter by Job Type** | Full-time, Part-time, Contract, Internship | Client filter | ✅ LIVE |
| 5.2.4 | **Filter by Experience** | Experience range filter | Client filter | ✅ LIVE |
| 5.2.5 | **Filter by Salary** | Salary range filter | Client filter | ✅ LIVE |

### 5.3 Job Detail (`jobs/[id]/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.3.1 | **Full Job Description** | Title, company, location, salary, description, requirements, benefits | `jobs-id` | ✅ LIVE |
| 5.3.2 | **Apply Button** | Direct apply from detail page | `ApplyModal` | ✅ LIVE |
| 5.3.3 | **Save/Bookmark** | Save from detail page | `saved_jobs` DB | ✅ LIVE |
| 5.3.4 | **Company Info** | Company name, logo, industry, size | `jobs-id` (joined) | ✅ LIVE |
| 5.3.5 | **Similar Jobs** | Related job suggestions | `recommendations` | ✅ LIVE |

#### QA Test Points — Job Detail
- [ ] Navigate to job detail → all fields populated
- [ ] Click Apply → modal opens → submit → "Applied" badge appears
- [ ] Already applied → Apply button shows "Applied" (disabled)
- [ ] Save job → bookmark persists on page reload

### 5.4 My Applications (`applications/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.4.1 | **Tab: Applied** | Applications in `applied`, `reviewing`, `shortlisted` status | `candidate-applications` | ✅ LIVE |
| 5.4.2 | **Tab: Interviews** | Applications in `interviewing`, `offered`, `hired` status | `candidate-applications` | ✅ LIVE |
| 5.4.3 | **Tab: Archived** | Applications in `rejected`, `withdrawn` status | `candidate-applications` | ✅ LIVE |
| 5.4.4 | **Tab: Saved** | Saved/bookmarked jobs (future feature) | — | 🔲 STUB |
| 5.4.5 | **Withdraw Application** | Confirmation modal → withdraw from `applied`, `reviewing`, `shortlisted`, `interviewing`, `offered` | `candidate-applications-id` PATCH | ✅ LIVE |
| 5.4.6 | **Status Pill** | Color-coded status badge (Applied=blue, Reviewing=amber, etc.) | Client component | ✅ LIVE |
| 5.4.7 | **Click-through to Detail** | Navigate to individual application detail | Router link | ✅ LIVE |

#### QA Test Points — My Applications
- [ ] Applied tab shows correct count & apps
- [ ] Interviews tab shows `interviewing`, `offered`, `hired` apps
- [ ] Archived tab shows `rejected` and `withdrawn` apps
- [ ] Click Withdraw → confirmation modal → confirm → app moves to Archived
- [ ] Cannot withdraw `hired` or `rejected` apps (button hidden)
- [ ] Status pills show correct colors per status

### 5.5 Application Detail (`applications/[app_id]/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.5.1 | **Application Status Card** | Current status with description and icon | `candidate-applications-id` GET | ✅ LIVE |
| 5.5.2 | **Progress Timeline** | Visual progress: Resume Review → Shortlisting → Interview → Offer | Client render | ✅ LIVE |
| 5.5.3 | **Job Details Section** | Linked job info (title, company, location, salary) | Joined query | ✅ LIVE |
| 5.5.4 | **Withdraw Button** | Withdraw from detail page (for eligible statuses) | `candidate-applications-id` PATCH | ✅ LIVE |
| 5.5.5 | **Cover Letter Display** | Shows submitted cover letter text | `candidate-applications-id` GET | ✅ LIVE |

### 5.6 Saved Jobs (`saved-jobs/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.6.1 | **Saved Jobs List** | All bookmarked jobs with unsave option | InsForge DB `saved_jobs` | ✅ LIVE |
| 5.6.2 | **Quick Apply from Saved** | Apply directly from saved list | `ApplyModal` | ✅ LIVE |
| 5.6.3 | **Remove from Saved** | Unsave button | DB delete | ✅ LIVE |

### 5.7 Interviews (`interviews/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.7.1 | **Upcoming Interviews** | List of scheduled interviews | InsForge DB `interviews` | ✅ LIVE |
| 5.7.2 | **Interview Details** | Date, time, type (video/in-person), interviewer, notes | `interviews` table join | ✅ LIVE |
| 5.7.3 | **Interview Status** | Scheduled, Completed, Cancelled | Status field | ✅ LIVE |
| 5.7.4 | **Calendar View** | Date-based interview display | Client-side | ✅ LIVE |

#### QA Test Points — Interviews
- [ ] Upcoming interviews appear with correct date/time
- [ ] Completed interviews move to history section
- [ ] Interview card shows job title, company, interviewer name

### 5.8 Messages (`messages/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.8.1 | **Message Inbox** | Real-time messaging with recruiters | InsForge DB `messages` | ✅ LIVE |
| 5.8.2 | **Conversation Thread** | Threaded message view | `messages` table | ✅ LIVE |
| 5.8.3 | **Send Message** | Text message composition and send | DB insert | ✅ LIVE |
| 5.8.4 | **Read Receipts** | Mark messages as read | DB update | ✅ LIVE |

### 5.9 Notifications (`notifications/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.9.1 | **Notification List** | All platform notifications | `notification-worker` | ✅ LIVE |
| 5.9.2 | **Mark as Read** | Individual + mark all as read | DB update | ✅ LIVE |
| 5.9.3 | **Notification Types** | Application updates, interview invites, messages, system alerts | Categorized | ✅ LIVE |
| 5.9.4 | **Real-time Push** | WebSocket-based instant notifications | InsForge Realtime | ✅ LIVE |

### 5.10 Profile (`profile/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.10.1 | **Personal Information** | Name, email, phone, location, avatar | `candidate-profile` GET/PATCH | ✅ LIVE |
| 5.10.2 | **Avatar Upload** | Profile photo upload with preview | InsForge Storage | ✅ LIVE |
| 5.10.3 | **Professional Headline** | One-line professional summary | `candidate_profiles.headline` | ✅ LIVE |
| 5.10.4 | **Skills Tags** | Add/remove skills with tag input | `candidate_profiles.skills` (array) | ✅ LIVE |
| 5.10.5 | **Work Experience** | Add/edit/delete work history entries | `candidate_profiles.work_experience` (JSON) | ✅ LIVE |
| 5.10.6 | **Education** | Add/edit/delete education entries | `candidate_profiles.education` (JSON) | ✅ LIVE |
| 5.10.7 | **Resume Management** | Upload/replace resume, view current | `upload-resume`, `resume-proxy` | ✅ LIVE |
| 5.10.8 | **Social Links** | LinkedIn, GitHub, Portfolio URLs | `candidate_profiles` columns | ✅ LIVE |
| 5.10.9 | **Salary Expectations** | Min/max salary + currency | `candidate_profiles.salary_min/max` | ✅ LIVE |
| 5.10.10 | **Job Preferences** | Remote preference, job types, preferred locations | `candidate_profiles` columns | ✅ LIVE |
| 5.10.11 | **Profile Strength Meter** | Percentage-based profile completeness indicator | Client calculation | ✅ LIVE |

#### QA Test Points — Profile
- [ ] Edit name → save → refreshed page shows new name
- [ ] Upload avatar → preview shown → save → avatar persists
- [ ] Add 5+ skills → all saved correctly
- [ ] Add work experience entry → appears in list
- [ ] Delete education entry → removed from list
- [ ] Update salary range → reflected in settings
- [ ] Profile strength increases as more fields are filled

### 5.11 Resumes (`resumes/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.11.1 | **Resume List** | All uploaded resumes | `resume-proxy` | ✅ LIVE |
| 5.11.2 | **Upload Resume** | PDF/DOCX upload | `upload-resume` | ✅ LIVE |
| 5.11.3 | **AI Resume Parsing** | Extracts skills, experience, education | `resume-parse` | ✅ LIVE |
| 5.11.4 | **Set Primary Resume** | Mark one resume as default for applications | DB update | ✅ LIVE |
| 5.11.5 | **Delete Resume** | Remove uploaded resume | Storage delete | ✅ LIVE |

### 5.12 Contributions/Referrals (`referrals/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.12.1 | **My Reviews** | Company reviews authored by candidate | — | ✅ LIVE (empty state) |
| 5.12.2 | **My Questions** | Questions asked about companies | — | ✅ LIVE (empty state) |
| 5.12.3 | **My Answers** | Answers provided to community questions | — | ✅ LIVE (empty state) |

### 5.13 Analytics (`analytics/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.13.1 | **Application Analytics** | Total apps, response rate, average response time | `candidate-applications` aggregation | ✅ LIVE |
| 5.13.2 | **Status Breakdown** | Pie/bar chart of application statuses | Client aggregation | ✅ LIVE |
| 5.13.3 | **Monthly Trend** | Applications over time chart | Client aggregation | ✅ LIVE |
| 5.13.4 | **Profile Views** | Number of recruiter views (if implemented) | — | ✅ LIVE |

### 5.14 Company Reviews (`company-reviews/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.14.1 | **Browse Company Reviews** | View reviews for companies | DB query | ✅ LIVE |
| 5.14.2 | **Write a Review** | Submit anonymous company review | DB insert | ✅ LIVE |
| 5.14.3 | **Rate Company** | Star rating for culture, management, etc. | DB columns | ✅ LIVE |

### 5.15 Salary Guide (`salary-guide/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.15.1 | **Browse Salary Data** | Salary ranges by role and location | DB/static data | ✅ LIVE |
| 5.15.2 | **Search by Role** | Filter salary data by job title | Client filter | ✅ LIVE |
| 5.15.3 | **Location Comparison** | Compare salaries across cities | Data render | ✅ LIVE |

### 5.16 Search (`search/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.16.1 | **Global Search** | Search across jobs, companies | Full-text search | ✅ LIVE |

### 5.17 Settings (`settings/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 5.17.1 | **Tab: Profile** | Edit personal info (name, email, phone, location) | `candidate-profile` PATCH | ✅ LIVE |
| 5.17.2 | **Tab: Preferences** | Job preferences (salary, remote, locations, job types) | `candidate-profile` PATCH | ✅ LIVE |
| 5.17.3 | **Tab: Security** | Change password, MFA toggle | `mfa-status`, InsForge Auth | ✅ LIVE |
| 5.17.4 | **Tab: Notifications** | Email notification preferences | `candidate-profile` PATCH | ✅ LIVE |
| 5.17.5 | **Tab: Privacy** | Profile visibility toggle, data download, account deletion | `candidate-profile` PATCH | ✅ LIVE |

#### QA Test Points — Settings
- [ ] Change name → save → reflected everywhere
- [ ] Change password → logout → login with new password works
- [ ] Enable MFA → QR code shown → verify → MFA active
- [ ] Disable MFA → prompted for current TOTP → confirmed → MFA disabled
- [ ] Toggle "Profile visible to recruiters" → setting saved
- [ ] Request account deletion → confirmation flow

---

## 6. Recruiter Portal

**Base Route**: `/dashboard/recruiter/[role_id]/`  
**Layout**: Sidebar navigation + top header  

### 6.1 Dashboard Home (`page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.1.1 | **Stats Cards** | Open jobs, total applicants, scheduled interviews, hires | `recruiter-dashboard` | ✅ LIVE |
| 6.1.2 | **Recent Jobs Table** | Latest posted jobs with status | `recruiter-dashboard` | ✅ LIVE |
| 6.1.3 | **Upcoming Interviews** | Next scheduled interviews | DB `interviews` query | ✅ LIVE |
| 6.1.4 | **Applications Queue** | New applications pending review (DataTable) | DB `applications` query | ✅ LIVE |
| 6.1.5 | **Candidate Profile Drawer** | Side drawer to preview candidate details | `CandidateProfileDrawer` component | ✅ LIVE |
| 6.1.6 | **Bulk Actions** | Select multiple applications → bulk status update | DB batch update | ✅ LIVE |
| 6.1.7 | **Filter by Job** | Filter applications queue by specific job | Client filter | ✅ LIVE |
| 6.1.8 | **Search Applications** | Search by candidate name/email | Client filter | ✅ LIVE |

#### QA Test Points — Recruiter Dashboard
- [ ] Stats cards show correct numbers matching DB
- [ ] Recent jobs list shows latest 5-10 jobs
- [ ] Upcoming interviews sorted by nearest first
- [ ] Click candidate row → profile drawer opens
- [ ] Select multiple → bulk "Move to Reviewing" → all updated
- [ ] Filter by job → only shows that job's applications

### 6.2 Jobs Management (`jobs/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.2.1 | **All Jobs List** | Paginated list of all recruiter's jobs | `insforge.database.from('jobs')` | ✅ LIVE |
| 6.2.2 | **Job Status Filter** | Filter: All, Published, Draft, Expired, Pending | Client filter | ✅ LIVE |
| 6.2.3 | **Search Jobs** | Search by title | Client filter | ✅ LIVE |
| 6.2.4 | **Job Stats** | Applications count, views per job | Joined queries | ✅ LIVE |

### 6.3 Post Job (`jobs/post-job/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.3.1 | **Job Title** | Text input for role title | — | ✅ LIVE |
| 6.3.2 | **Job Type** | Full-time, Part-time, Contract, Internship, Freelance | Dropdown | ✅ LIVE |
| 6.3.3 | **Location** | City selection + Remote option | Custom Select | ✅ LIVE |
| 6.3.4 | **Salary Range** | Min/Max salary + currency | Numeric inputs | ✅ LIVE |
| 6.3.5 | **Experience Range** | Min/Max years experience | Numeric inputs | ✅ LIVE |
| 6.3.6 | **Description** | Rich text job description | Textarea/Editor | ✅ LIVE |
| 6.3.7 | **Requirements** | Skills, qualifications list | Array input | ✅ LIVE |
| 6.3.8 | **Benefits** | Perks and benefits list | Array input | ✅ LIVE |
| 6.3.9 | **Save as Draft** | Save without publishing | `status: 'draft'` | ✅ LIVE |
| 6.3.10 | **Publish** | Submit for admin approval (if required) or publish directly | `status: 'pending'/'published'` | ✅ LIVE |

#### QA Test Points — Post Job
- [ ] Fill all required fields → Publish → job appears in listing
- [ ] Save as Draft → job saved with draft status
- [ ] Edit existing draft → changes saved
- [ ] Submit without required fields → validation errors shown
- [ ] Job requires admin approval → status shows "Pending Approval"

### 6.4 Job Detail (`jobs/[job_id]/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.4.1 | **Job Overview** | Full job details view | DB query | ✅ LIVE |
| 6.4.2 | **Edit Job** | Modify job details | DB update | ✅ LIVE |
| 6.4.3 | **Close/Expire Job** | Manually close a job listing | Status update | ✅ LIVE |
| 6.4.4 | **Application List** | All applications for this specific job | Joined query | ✅ LIVE |

### 6.5 Drafts (`jobs/drafts/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.5.1 | **Draft Jobs List** | Jobs saved as drafts | `status: 'draft'` filter | ✅ LIVE |
| 6.5.2 | **Resume Editing** | Click to continue editing draft | Router navigation | ✅ LIVE |
| 6.5.3 | **Delete Draft** | Remove draft job | DB delete | ✅ LIVE |

### 6.6 Published (`jobs/published/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.6.1 | **Published Jobs List** | Active published jobs | `status: 'published'` filter | ✅ LIVE |

### 6.7 Expired (`jobs/expired/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.7.1 | **Expired Jobs List** | Past expiry date jobs | `status: 'expired'` filter | ✅ LIVE |
| 6.7.2 | **Repost Job** | Clone expired job as new draft | Client action | ✅ LIVE |

### 6.8 Job Templates (`jobs/templates/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.8.1 | **Template List** | Saved job templates | DB query | ✅ LIVE |
| 6.8.2 | **Create from Template** | Quick job creation using template | Pre-fill | ✅ LIVE |

### 6.9 Candidates (`candidates/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.9.1 | **Candidate List** | All candidates who applied to recruiter's jobs | `candidates` edge fn | ✅ LIVE |
| 6.9.2 | **Candidate Search** | Search by name, email, skills | Client filter | ✅ LIVE |
| 6.9.3 | **Candidate Profile View** | Full candidate profile drawer | `CandidateProfileDrawer` | ✅ LIVE |
| 6.9.4 | **Resume Download** | Download candidate's resume | `resume-proxy` | ✅ LIVE |
| 6.9.5 | **AI Match Score** | AI-generated match score for candidate vs job | `ai-match` | ✅ LIVE |
| 6.9.6 | **Shortlisted Candidates** | Candidates marked as shortlisted | `/candidates/shortlisted` | ✅ LIVE |
| 6.9.7 | **Saved Candidates** | Bookmarked/saved candidate profiles | `/candidates/saved` | ✅ LIVE |
| 6.9.8 | **Candidate Search (Advanced)** | Dedicated search page for candidates | `/candidates/search` | ✅ LIVE |

#### QA Test Points — Candidates
- [ ] Candidate list populates with applicants for recruiter's jobs
- [ ] Search by skill → filters matching candidates
- [ ] Click candidate → profile drawer shows full details
- [ ] Download resume → PDF opens/downloads
- [ ] AI match score visible on candidate card

### 6.10 Pipeline (`pipeline/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.10.1 | **Kanban Board** | Drag-and-drop pipeline view across stages | `update-application` | ✅ LIVE |
| 6.10.2 | **Pipeline Stages** | Applied → Reviewing → Shortlisted → Interviewing → Offered → Hired → Rejected → Withdrawn | Column groups | ✅ LIVE |
| 6.10.3 | **Move Candidate** | Drag or click to move between stages | `update-application` PATCH | ✅ LIVE |
| 6.10.4 | **Filter by Job** | View pipeline for specific job | Client filter | ✅ LIVE |
| 6.10.5 | **Candidate Card** | Shows name, status, applied date | Card component | ✅ LIVE |

#### QA Test Points — Pipeline
- [ ] All 8 columns render: applied, reviewing, shortlisted, interviewing, offered, hired, rejected, withdrawn
- [ ] Move card from "Applied" to "Reviewing" → DB updated
- [ ] Filter by job → only that job's applicants shown
- [ ] Card shows correct candidate info

### 6.11 Interviews (`interviews/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.11.1 | **Interview List** | All scheduled/completed interviews | DB `interviews` query | ✅ LIVE |
| 6.11.2 | **Schedule Interview** | Create interview with candidate, date/time, type | DB insert + `interview-generator` | ✅ LIVE |
| 6.11.3 | **AI Interview Questions** | AI-generated interview questions based on job & candidate | `interview-generator` | ✅ LIVE |
| 6.11.4 | **Interview Status Update** | Mark as completed, cancelled, rescheduled | DB update | ✅ LIVE |
| 6.11.5 | **Interview Notes** | Add/edit post-interview notes and ratings | DB update | ✅ LIVE |

#### QA Test Points — Interviews
- [ ] Schedule interview → appears in list with correct datetime
- [ ] AI generates relevant interview questions
- [ ] Complete interview → status changes to "Completed"
- [ ] Cancel interview → status changes to "Cancelled"
- [ ] Add notes/rating after interview → saved

### 6.12 Offers (`offers/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.12.1 | **Offer List** | All extended offers | DB `offers` query | ✅ LIVE |
| 6.12.2 | **Create Offer** | Extend offer to candidate with salary details | DB insert | ✅ LIVE |
| 6.12.3 | **Offer Status** | Pending, Accepted, Rejected, Withdrawn | Status field | ✅ LIVE |
| 6.12.4 | **Withdraw Offer** | Recruiter withdraws an offer | Status update | ✅ LIVE |

### 6.13 NVite (`nvite/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.13.1 | **Invitation Dashboard** | List of sent invitations to candidates | DB query | ✅ LIVE |
| 6.13.2 | **Compose Invitation** | Send personalized invite to apply | `/nvite/compose` | ✅ LIVE |
| 6.13.3 | **Invitation Status** | Sent, Opened, Applied, Expired | Status tracking | ✅ LIVE |

### 6.14 Messages (`messages/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.14.1 | **Messaging Inbox** | Real-time messaging with candidates | DB `messages` | ✅ LIVE |
| 6.14.2 | **Send/Receive** | Bidirectional messaging | DB insert | ✅ LIVE |

### 6.15 Notifications (`notifications/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.15.1 | **Notification Feed** | Application updates, interview reminders | `notification-worker` | ⚠️ CHECK |

### 6.16 Reports (`reports/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.16.1 | **Hiring Funnel** | Applications → Reviewed → Shortlisted → Hired | Data aggregation | ✅ LIVE |
| 6.16.2 | **Time-to-Hire** | Average days from posting to hire | Calculated metric | ✅ LIVE |
| 6.16.3 | **Source Analytics** | Application source tracking | Data aggregation | ✅ LIVE |

### 6.17 Integrations (`integrations/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.17.1 | **ATS Integrations** | Third-party ATS connections | Config-based | ✅ LIVE |
| 6.17.2 | **Calendar Sync** | Google Calendar / Outlook sync | External API | ✅ LIVE |

### 6.18 Settings (`settings/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.18.1 | **Tab: Profile** | Edit name, email, phone, avatar, job title | `recruiter-profile` PATCH | ✅ LIVE |
| 6.18.2 | **Tab: Company** | Edit company name, logo, website, industry | `company-profile` PATCH | ✅ LIVE |
| 6.18.3 | **Tab: Hiring** | Hiring preferences and defaults | `recruiter-profile` PATCH | ✅ LIVE |
| 6.18.4 | **Tab: Templates** | Email/message templates | — | ✅ LIVE |
| 6.18.5 | **Tab: Billing** | Subscription and payment info | — | 🔲 STUB |
| 6.18.6 | **Tab: Team** | Team member management | — | ✅ LIVE |

#### QA Test Points — Settings
- [ ] Upload avatar → preview → save → persists
- [ ] Upload company logo → preview → save → shows on jobs
- [ ] Change company name → reflected on all job listings
- [ ] Change password → works (for email auth providers)
- [ ] OAuth users → password fields hidden

### 6.19 Pending Approval (`pending-approval/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 6.19.1 | **Waiting State** | Shows message that account is pending admin approval | — | ✅ LIVE |
| 6.19.2 | **Contact Support** | Link to contact admin | Static link | ✅ LIVE |

---

## 7. Admin Portal

**Base Route**: `/dashboard/admin/` (protected by `NEXT_PUBLIC_ADMIN_SECRET_PATH`)  
**Layout**: Sidebar navigation + top header  

### 7.1 Dashboard Home (`page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.1.1 | **Platform Metrics** | Total Jobs, Applications, Candidates, Recruiters | `admin-dashboard` | ✅ LIVE |
| 7.1.2 | **Alerts Widget** | Pending recruiters, pending jobs, reported jobs, new users 24h | `admin-dashboard` | ✅ LIVE |
| 7.1.3 | **Recent Activity Feed** | Latest platform activities with actor info | `admin-dashboard` | ✅ LIVE |
| 7.1.4 | **Quick Actions** | Post Job, Review Applications, View Reports | Navigation links | ✅ LIVE |
| 7.1.5 | **Refresh Button** | Manual data refresh with cache invalidation | `invalidateDashboardCache` | ✅ LIVE |
| 7.1.6 | **Loading Skeletons** | Independent skeleton states for each widget | Widget-level loading | ✅ LIVE |

#### QA Test Points — Admin Dashboard
- [ ] All 4 stat cards show correct numbers
- [ ] Alerts badge shows pending items count
- [ ] Activity feed shows latest 10 activities
- [ ] Click "Refresh" → data reloads
- [ ] Each widget loads independently (progressive rendering)

### 7.2 Job Approvals (`job-approvals/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.2.1 | **Pending Jobs List** | Jobs submitted for approval | `admin-jobs` | ✅ LIVE |
| 7.2.2 | **Approve Job** | Approve and publish job listing | `admin-jobs` PATCH | ✅ LIVE |
| 7.2.3 | **Reject Job** | Reject with reason | `admin-jobs` PATCH | ✅ LIVE |
| 7.2.4 | **Job Preview** | Full job preview before approval | Job detail render | ✅ LIVE |

### 7.3 Applications (`applications/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.3.1 | **All Applications** | Platform-wide applications list with filters | `admin-applications` | ✅ LIVE |
| 7.3.2 | **Status Filter** | Filter by application status | Client filter | ✅ LIVE |
| 7.3.3 | **Update Status** | Admin can update any application status | `admin-applications` PATCH | ✅ LIVE |
| 7.3.4 | **Withdrawn Guard** | Cannot update withdrawn applications (409 error) | Backend validation | ✅ LIVE |

### 7.4 Candidates (`candidates/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.4.1 | **Candidate Directory** | All registered candidates | `admin-candidates` | ✅ LIVE |
| 7.4.2 | **Search Candidates** | Search by name, email, skills | `admin-candidates` + filter | ✅ LIVE |
| 7.4.3 | **View Profile** | Full candidate profile view | Detail query | ✅ LIVE |
| 7.4.4 | **Suspend/Ban** | Admin can disable candidate accounts | Role/status update | ✅ LIVE |

### 7.5 Recruiters (`recruiters/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.5.1 | **Recruiter Directory** | All registered recruiters | `admin-recruiters` | ✅ LIVE |
| 7.5.2 | **Pending Approvals** | Recruiters awaiting activation | Status filter | ✅ LIVE |
| 7.5.3 | **Approve Recruiter** | Activate a recruiter account | `activate-recruiter` | ✅ LIVE |
| 7.5.4 | **Reject Recruiter** | Deny recruiter access | Status update | ✅ LIVE |
| 7.5.5 | **View Details** | Full recruiter + company details | Detail query | ✅ LIVE |

#### QA Test Points — Recruiters
- [ ] Pending recruiters listed with registration date
- [ ] Click Approve → recruiter status changes to active
- [ ] Click Reject → recruiter notified
- [ ] Approved recruiter can now login and access dashboard

### 7.6 Companies (`companies/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.6.1 | **Company Directory** | All registered companies | `admin-companies` | ✅ LIVE |
| 7.6.2 | **Company Details** | Name, industry, website, logo, recruiter count | Detail view | ✅ LIVE |
| 7.6.3 | **Edit Company** | Modify company information | `admin-companies` PATCH | ✅ LIVE |

### 7.7 Jobs Management (`jobs/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.7.1 | **All Jobs List** | Platform-wide job listings | `admin-jobs` | ✅ LIVE |
| 7.7.2 | **Filter by Status** | Published, Draft, Pending, Expired, Closed | Client filter | ✅ LIVE |
| 7.7.3 | **Edit Job** | Admin can modify any job | `admin-jobs` PATCH | ✅ LIVE |
| 7.7.4 | **Delete Job** | Remove job listing | `admin-jobs` DELETE | ✅ LIVE |
| 7.7.5 | **Force Publish/Unpublish** | Override job status | `admin-jobs` PATCH | ✅ LIVE |

### 7.8 Announcements (`announcements/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.8.1 | **Announcement List** | All platform announcements | `admin-announcements` | ✅ LIVE |
| 7.8.2 | **Create Announcement** | Title, body, target audience, priority | `admin-announcements` POST | ✅ LIVE |
| 7.8.3 | **Edit Announcement** | Modify existing announcement | `admin-announcements` PATCH | ✅ LIVE |
| 7.8.4 | **Delete Announcement** | Remove announcement | `admin-announcements` DELETE | ✅ LIVE |
| 7.8.5 | **Target Audience** | All Users, Candidates, Recruiters, Admins | Audience field | ✅ LIVE |

### 7.9 Blogs (`blogs/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.9.1 | **Blog List** | All blog posts | `admin-blogs` | ✅ LIVE |
| 7.9.2 | **Create Blog Post** | Title, content, cover image, tags | `admin-blogs` POST | ✅ LIVE |
| 7.9.3 | **Upload Blog Image** | Cover image upload | `upload-blog-image` | ✅ LIVE |
| 7.9.4 | **Edit Blog Post** | Modify existing post | `admin-blogs` PATCH | ✅ LIVE |
| 7.9.5 | **Delete Blog Post** | Remove post | `admin-blogs` DELETE | ✅ LIVE |
| 7.9.6 | **Publish/Draft Toggle** | Toggle between published and draft | Status update | ✅ LIVE |

### 7.10 Audit Logs (`audit-logs/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.10.1 | **Audit Log Feed** | All admin actions with timestamps | `admin-audit-logs` | ✅ LIVE |
| 7.10.2 | **Filter by Action Type** | Login, CRUD, Approval, etc. | Client filter | ✅ LIVE |
| 7.10.3 | **Filter by Date Range** | Date picker for range | Client filter | ✅ LIVE |
| 7.10.4 | **Export Audit** | Download audit log as CSV | `admin-export-audit` | ✅ LIVE |
| 7.10.5 | **Actor Details** | Who performed the action | Joined query | ✅ LIVE |

### 7.11 Reports (`reports/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.11.1 | **Tab: Ecosystem** | Platform-wide metrics, hiring funnel, growth trends, top skills, status breakdown | `admin-reports` | ✅ LIVE |
| 7.11.2 | **Tab: Operations** | System telemetry — trace logs, contract violations, performance metrics | Client localStorage | ✅ LIVE |
| 7.11.3 | **Hiring Funnel Chart** | Jobs Posted → Applications → Reviewed → Shortlisted → Hired | SVG chart | ✅ LIVE |
| 7.11.4 | **Growth Trend** | User/application growth over time | Line chart | ✅ LIVE |
| 7.11.5 | **Top Skills** | Most common candidate skills | Bar chart | ✅ LIVE |
| 7.11.6 | **Feature Flags** | Current feature flag states | `getAllFeatureFlags` | ✅ LIVE |

### 7.12 Search (`search/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.12.1 | **Global Search** | Search across users, jobs, companies | Multi-table query | ✅ LIVE |

### 7.13 Notifications (`notifications/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.13.1 | **Admin Notifications** | System alerts, approval requests | `notification-worker` | ✅ LIVE |

### 7.14 Settings (`settings/page.tsx`)
| # | Feature | Description | Backend | Status |
|---|---------|-------------|---------|--------|
| 7.14.1 | **Tab: General** | Platform settings, admin profile, admin team management | `admin-settings` | ✅ LIVE |
| 7.14.2 | **  → Admin Name** | Edit admin display name | `profiles` PATCH | ✅ LIVE |
| 7.14.3 | **  → Feature Flags** | Toggle platform features on/off | `admin-settings` PATCH | ✅ LIVE |
| 7.14.4 | **  → Maintenance Mode** | Enable/disable maintenance mode | `admin-settings` PATCH | ✅ LIVE |
| 7.14.5 | **  → Admin Team** | List admins, invite new admin by email | `profiles` query + insert | ✅ LIVE |
| 7.14.6 | **Tab: Devices** | Active user sessions list with revoke ability | `user_sessions` query | ✅ LIVE |
| 7.14.7 | **  → Revoke Session** | Force logout a specific session | `user_sessions` update | ✅ LIVE |
| 7.14.8 | **Tab: Quarantine** | Quarantined files management | `quarantined_files` query | ✅ LIVE |
| 7.14.9 | **  → Restore File** | Restore a quarantined file | Status update | ✅ LIVE |
| 7.14.10 | **  → Delete Permanently** | Permanently delete quarantined file | Storage delete | ✅ LIVE |

#### QA Test Points — Admin Settings
- [ ] Toggle feature flag → setting persists after refresh
- [ ] Enable maintenance mode → platform shows maintenance page
- [ ] Invite new admin → email sent → new admin can login
- [ ] View active sessions → shows IP, device, last active
- [ ] Revoke session → that session becomes invalid
- [ ] View quarantined files → restore one → file accessible again

### 7.15 Stub Pages (Coming Soon)
| # | Feature | Page | ETA | Status |
|---|---------|------|-----|--------|
| 7.15.1 | **Email Templates** | `email-templates/page.tsx` | Q3 2026 | 🔲 STUB |
| 7.15.2 | **Plans & Quotas** | `plans/page.tsx` | Q3 2026 | 🔲 STUB |
| 7.15.3 | **Billing & Revenue** | `billing/page.tsx` | Q3 2026 | 🔲 STUB |
| 7.15.4 | **Team & RBAC** | `team/page.tsx` | Q3 2026 | 🔲 STUB |
| 7.15.5 | **Impersonation** | `impersonate/page.tsx` | TBD | 🔲 STUB |

---

## 8. Platform-Wide / Shared Features

### 8.1 Navigation & Layout
| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 8.1.1 | **Role-based Sidebar** | Different nav items per role | ✅ LIVE |
| 8.1.2 | **Responsive Layout** | Mobile/tablet/desktop responsive | ✅ LIVE |
| 8.1.3 | **Breadcrumbs** | Context-aware breadcrumb navigation | ✅ LIVE |
| 8.1.4 | **Notification Bell** | Header notification count badge | ✅ LIVE |
| 8.1.5 | **User Avatar Menu** | Profile picture → dropdown with settings/logout | ✅ LIVE |
| 8.1.6 | **Loading Skeletons** | Skeleton screens during data loading | ✅ LIVE |
| 8.1.7 | **Error Boundaries** | Graceful error states per page | ✅ LIVE |

### 8.2 Shared UI Components
| # | Component | Usage |
|---|-----------|-------|
| 8.2.1 | `Toast` | Success/error/info notifications |
| 8.2.2 | `ConfirmModal` | Destructive action confirmations |
| 8.2.3 | `DataTable` | Paginated, sortable, selectable tables |
| 8.2.4 | `FilterBar` | Search + dropdown filters |
| 8.2.5 | `StatCard` | Metric display cards |
| 8.2.6 | `StatusPill` | Color-coded status badges |
| 8.2.7 | `CustomSelect` | Styled dropdown component |
| 8.2.8 | `LoadingScreen` | Full-page loading state |
| 8.2.9 | `FormSkeleton` | Form loading skeleton |
| 8.2.10 | `AnimateOnScroll` | Scroll-triggered animations |
| 8.2.11 | `CandidateProfileDrawer` | Side panel for candidate details |
| 8.2.12 | `ApplyModal` | Job application submission modal |

### 8.3 Cross-Cutting Concerns
| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 8.3.1 | **Idempotency** | All write operations include `x-idempotency-key` | ✅ LIVE |
| 8.3.2 | **CSRF Protection** | `insforge_csrf_token` cookie for auth flows | ✅ LIVE |
| 8.3.3 | **Rate Limiting** | Proxy middleware rate limiting | ✅ LIVE |
| 8.3.4 | **Input Sanitization** | XSS prevention on all user inputs | ✅ LIVE |
| 8.3.5 | **Observability** | Trace logging for admin dashboard performance | ✅ LIVE |
| 8.3.6 | **Offline Queue** | Actions queued when offline, replayed on reconnect | ✅ LIVE |
| 8.3.7 | **Progressive Loading** | Widget-level independent loading states | ✅ LIVE |
| 8.3.8 | **Cache Management** | `metricCache` for admin dashboard data | ✅ LIVE |

---

## 9. Edge Functions (Backend API) Reference

| # | Function Name | Methods | Purpose | Used By |
|---|---------------|---------|---------|---------|
| 1 | `activate-recruiter` | POST | Admin activates a recruiter account | Admin |
| 2 | `admin-announcements` | GET/POST/PATCH/DELETE | CRUD for platform announcements | Admin |
| 3 | `admin-applications` | GET/PATCH | View and update all applications | Admin |
| 4 | `admin-audit` | GET | Audit data retrieval | Admin |
| 5 | `admin-audit-logs` | GET | Audit log feed | Admin |
| 6 | `admin-auth-login` | POST | Admin-specific login | Admin |
| 7 | `admin-blogs` | GET/POST/PATCH/DELETE | Blog post management | Admin |
| 8 | `admin-candidates` | GET | Candidate directory | Admin |
| 9 | `admin-companies` | GET/PATCH | Company management | Admin |
| 10 | `admin-dashboard` | GET | Dashboard metrics + alerts | Admin |
| 11 | `admin-export-audit` | GET | Export audit logs as CSV | Admin |
| 12 | `admin-forgot-password` | POST | Password reset for admin | Admin |
| 13 | `admin-jobs` | GET/POST/PATCH/DELETE | Job management | Admin |
| 14 | `admin-recruiter` | GET/PATCH | Single recruiter management | Admin |
| 15 | `admin-recruiters` | GET | Recruiter directory | Admin |
| 16 | `admin-reports` | GET | Platform-wide reports data | Admin |
| 17 | `admin-settings` | GET/PATCH | Platform settings CRUD | Admin |
| 18 | `ai-match` | POST | AI matching score between candidate & job | Recruiter |
| 19 | `auth-session` | GET/POST/DELETE | Session validation & user_sessions management | All |
| 20 | `auth-signup` | POST | User registration | Public |
| 21 | `auth-verify` | POST | Email verification | Public |
| 22 | `candidate-applications` | GET | List candidate's applications | Candidate |
| 23 | `candidate-applications-id` | GET/PATCH | Single application detail + withdraw | Candidate |
| 24 | `candidate-dashboard` | GET | Candidate dashboard data | Candidate |
| 25 | `candidate-profile` | GET/PATCH | Candidate profile CRUD | Candidate |
| 26 | `candidates` | GET | Candidate listing for recruiters | Recruiter |
| 27 | `cleanup-idempotency-keys` | POST | Periodic cleanup of expired keys | System |
| 28 | `cleanup-stale-resources` | POST | Periodic cleanup of stale data | System |
| 29 | `company-profile` | GET/PATCH | Company profile CRUD | Recruiter |
| 30 | `dashboard` | GET | Generic dashboard data | All |
| 31 | `interview-generator` | POST | AI interview question generation | Recruiter |
| 32 | `jobs` | GET | Public job listings | Candidate |
| 33 | `jobs-id` | GET | Single job detail | Candidate |
| 34 | `mfa-backup-codes` | GET/POST | MFA backup codes management | All |
| 35 | `mfa-status` | GET/PATCH | MFA enable/disable/verify | All |
| 36 | `notification-worker` | POST | Process and send notifications | System |
| 37 | `profile-complete-onboarding` | POST | Mark onboarding as complete | Candidate/Recruiter |
| 38 | `recommendations` | GET | Job recommendations for candidate | Candidate |
| 39 | `recruiter-dashboard` | GET | Recruiter dashboard data | Recruiter |
| 40 | `recruiter-document-proxy` | GET/POST | Document upload/download for recruiters | Recruiter |
| 41 | `recruiter-profile` | GET/PATCH | Recruiter profile CRUD | Recruiter |
| 42 | `recruiter-request` | POST | Recruiter access request | Recruiter |
| 43 | `resume-parse` | POST | AI resume parsing (extract skills, experience) | Candidate |
| 44 | `resume-proxy` | GET | Secure resume download proxy | Recruiter/Admin |
| 45 | `update-application` | PATCH | Update application status | Recruiter/Admin |
| 46 | `upload-blog-image` | POST | Blog cover image upload | Admin |
| 47 | `upload-logo` | POST | Company logo upload | Recruiter |
| 48 | `upload-resume` | POST | Resume file upload | Candidate |
| 49 | `test-auth-pattern` | GET | Auth pattern testing (dev only) | Dev |

---

## 10. Database Tables Reference

| Table | Primary User | Purpose |
|-------|-------------|---------|
| `profiles` | All | User identity: id, email, name, role, avatar_url, phone, location |
| `candidate_profiles` | Candidate | Extended candidate data: skills, headline, resume_url, salary, preferences |
| `recruiter_profiles` | Recruiter | Extended recruiter data: job_title, company_id, recruiter_role |
| `companies` | Recruiter/Admin | Company data: name, logo_url, website, industry |
| `jobs` | Recruiter/Admin | Job listings: title, description, type, location, salary, status, recruiter_id |
| `applications` | All | Job applications: candidate_id, job_id, status, cover_letter, applied_at |
| `interviews` | Recruiter/Candidate | Interview records: scheduled_at, type, status, notes, rating |
| `offers` | Recruiter/Candidate | Job offers: salary, status, start_date |
| `messages` | All | In-app messaging: sender_id, receiver_id, content, read_at |
| `notifications` | All | Platform notifications: user_id, type, content, read |
| `saved_jobs` | Candidate | Bookmarked jobs: candidate_id, job_id |
| `user_sessions` | All | Active sessions: token_fingerprint, ip_hash, user_agent, revoked_at |
| `audit_logs` | Admin | Admin action logs: actor_id, action, target, created_at |
| `announcements` | Admin | Platform announcements: title, body, audience, priority |
| `blog_posts` | Admin | Blog content: title, content, cover_image, tags, status |
| `quarantined_files` | Admin | Quarantined uploads: bucket, path, status, expires_at |
| `platform_settings` | Admin | System configuration: general, feature_flags, maintenance |
| `idempotency_keys` | System | Dedup keys for write operations |

---

## 11. Known Stubs & Planned Features

| Feature | Module | Current State | ETA |
|---------|--------|---------------|-----|
| Email Template Studio | Admin | Coming Soon page | Q3 2026 |
| Plan & Quota Manager | Admin | Coming Soon page | Q3 2026 |
| Revenue & Billing Engine | Admin | Coming Soon page | Q3 2026 |
| Admin Team & RBAC | Admin | Coming Soon page | Q3 2026 |
| Impersonation | Admin | Dead UI (disabled) | TBD |
| Candidate Offers Page | Candidate | Not implemented | TBD |
| Saved Jobs Tab | Candidate Apps | Empty state | TBD |
| Advanced Candidate Search | Recruiter | Basic implementation | TBD |
| Recruiter Analytics Page | Recruiter | Not implemented | TBD |

---

## 12. Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ LIVE | Feature is fully implemented and functional |
| ⚠️ CHECK | Feature exists but may have wiring issues — verify data flow |
| 🔲 STUB | Placeholder/Coming Soon page — no functional backend |
| ❌ MISSING | Referenced but no page/route exists |

---

*This document should be treated as a living reference. QA should verify each test point against the deployed environment and update status fields accordingly.*

**Prepared by**: Engineering Team  
**Review Date**: 2026-07-08  
**Next Review**: Before Production Launch
