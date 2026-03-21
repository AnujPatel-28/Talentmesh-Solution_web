# TalentMesh — AI-Powered Recruiting Portal

<p align="center">
  <img src="public/TalentMesh_page-0002-removebg-preview.png" alt="TalentMesh Logo" width="280" />
</p>

<p align="center">
  <strong>An intelligent recruiting platform connecting top talent with leading companies across India & USA.</strong>
</p>

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | CSS Modules |
| **Icons** | Custom SVG Icons |
| **Images** | `next/image` with optimization |
| **Fonts** | Inter (Google Fonts via `next/font`) |

---

## 📁 Project Structure

```
app/
├── (auth)/                    # Authentication pages
│   ├── login/                 # Login (candidate & recruiter toggle)
│   ├── signup/                # Multi-step signup with role selection
│   └── forgot-password/       # Password reset
│
├── dashboard/                 # Protected dashboards (shared layout)
│   ├── layout.tsx             # Shared sidebar + topbar layout
│   ├── candidate/             # Candidate dashboard
│   │   ├── page.tsx           # Home — stats, recommendations
│   │   ├── jobs/              # Job listings grid
│   │   │   └── [id]/          # Job detail inner page
│   │   ├── applications/      # Application tracking
│   │   ├── messages/          # Messaging
│   │   ├── analytics/         # Profile analytics
│   │   ├── profile/           # Profile management
│   │   └── settings/          # Account & preferences
│   │
│   ├── recruiter/             # Recruiter dashboard
│   │   ├── page.tsx           # Home — hiring pipeline
│   │   ├── jobs/              # Job posting management
│   │   ├── candidates/        # Candidate pool
│   │   ├── interviews/        # Interview scheduling
│   │   ├── reports/           # Hiring analytics
│   │   └── settings/          # Account & company settings
│   │
│   └── admin/                 # Admin dashboard
│       ├── page.tsx           # Overview — platform stats
│       ├── jobs/              # Manage all jobs (post/edit/approve)
│       ├── candidates/        # Accept/reject candidates
│       ├── recruiters/        # Approve/suspend recruiters
│       ├── reports/           # Platform analytics
│       └── settings/          # Admin & platform settings
│
├── browse-jobs/               # Public job search
│   └── [id]/                  # Public job detail page
├── employers/                 # Employer landing pages
├── job-seekers/               # Job seeker landing page
├── features/                  # Features overview
├── pricing/                   # Pricing page
├── about/                     # About the company
├── contact/                   # Contact page
├── blog/                      # Blog
├── careers/                   # Company careers
├── podcast/                   # Podcast page
├── salaries/                  # Salary explorer
├── privacy/                   # Privacy policy
├── terms/                     # Terms of service
├── security/                  # Security page
└── under-construction/        # Placeholder page

components/
├── layout/
│   ├── Navbar/                # Main site navigation
│   ├── NavbarWrapper.tsx      # Auto-hides navbar on dashboard routes
│   └── Footer/                # Site footer
```

---

## ✨ Key Features

### 🌐 Public Website
- Premium landing page with glassmorphism and micro-animations
- Job search with filters (location, salary, type)
- Detailed job pages with AI match scores
- Employer & job seeker landing pages
- SEO optimized with sitemap, robots.txt, and meta tags

### 👤 Candidate Dashboard
- AI-matched job recommendations
- Job detail inner pages with premium "Apply Now" button
- Application tracker with status updates
- Profile analytics and messaging
- Job preferences and notification settings

### 🏢 Recruiter Dashboard
- Hiring pipeline overview with stats
- Job posting management (create/edit)
- Candidate pool with match scores
- Interview scheduling
- Hiring reports and analytics
- Company information settings

### 🛡️ Admin Dashboard
- Platform-wide statistics and activity feed
- Post/edit/approve/remove jobs on behalf of recruiters
- Accept/reject candidate applications
- Approve/suspend/reactivate recruiter accounts
- Hiring funnel analytics and top performers
- Platform toggle settings (auto-approve, maintenance mode)

### 🎨 Design System
- Custom SVG icons throughout (no emojis)
- Responsive sidebar with collapsible navigation
- Icon-only glow effect on active/hover nav items
- Official TalentMesh logos (full logo expanded, icon when collapsed)
- Premium gradient buttons with hover animations
- Dark-themed background for auth pages

---

## 🏃 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Dashboard Access (Dev Only)

| Dashboard | URL |
|-----------|-----|
| Candidate | [/dashboard/candidate](http://localhost:3000/dashboard/candidate) |
| Recruiter | [/dashboard/recruiter](http://localhost:3000/dashboard/recruiter) |
| Admin | [/dashboard/admin](http://localhost:3000/dashboard/admin) |

> **Note:** Authentication is currently under development. Login and signup forms show a "Coming Soon" notice instead of redirecting to dashboards. Dashboards are accessible via direct URL during development only.

---

## 🛡️ Manual Admin Creation

For security reasons, admin accounts cannot be created via the signup form.

1. **InsForge Dashboard**: Go to [Authentication → Users](https://console.insforge.com).
2. **Create User**: Add a new user with their email and password.
3. **Environment Variables**: Ensure the admin's email is added to the `ADMIN_EMAILS` comma-separated list in `.env.local`.
4. **User Metadata**: In the InsForge Dashboard, set the user's metadata to:
   ```json
   {
     "role": "admin",
     "name": "Admin Full Name"
   }
   ```
5. **Direct Entry**: Alternatively, manually insert a row into the `profiles` table with `role = 'admin'`.

---

## 🔐 Auth Status

| Feature | Status |
|---------|--------|
| Login UI | ✅ Complete |
| Signup UI (multi-step) | ✅ Complete |
| Forgot Password UI | ✅ Complete |
| Auth flow (backend) | 🚧 Coming Soon |
| Admin auth (separate) | 🚧 Planned |
| Route protection | 🚧 Planned |

---

## 📦 Deployment

The app is optimized for deployment on [Vercel](https://vercel.com):

```bash
npm run build
```

All pages are statically generated where possible for optimal performance.

---

## 📄 License

Private — © TalentMesh 2024-2026
