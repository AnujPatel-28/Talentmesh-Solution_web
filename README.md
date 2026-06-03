# TalentMesh — AI-Powered Recruiting Portal

<p align="center">
  <img src="public/TalentMesh_page-0002-removebg-preview.png" alt="TalentMesh Logo" width="280" />
</p>

<p align="center">
  <strong>An intelligent recruiting platform connecting top talent with leading companies across India & USA.</strong>
</p>

---

## 🚀 Overview

TalentMesh is a next-generation Applicant Tracking System (ATS) and Job Portal built on **Next.js 14** and **InsForge BaaS**. It leverages AI to match candidates with recruiters, offering a seamless, premium user experience with role-based dashboards, real-time interviews, and an integrated CRM.

For a comprehensive breakdown of all features, please refer to the [Full Documentation](DOCUMENTATION.md).

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Backend** | InsForge (PostgreSQL, Auth, Edge Functions, Storage) |
| **Language** | TypeScript |
| **Styling** | CSS Modules & Tailwind CSS |
| **Icons** | Custom SVG Icons & Lucide React |
| **Images** | `next/image` with optimization |
| **Fonts** | Inter (Google Fonts via `next/font`) |
| **Testing** | Playwright (e2e), Vitest (unit) |

---

## ✨ Core Features at a Glance

- **Role-Based Architecture**: Distinct, fully protected experiences for **Candidates**, **Recruiters**, and **Admins**.
- **AI Matching**: Smart candidate-to-job recommendations and profile scoring.
- **Applicant Tracking (ATS)**: Kanban pipelines, interview scheduling, and offer management.
- **Real-Time Interviews**: Integrated interview rooms with review capabilities.
- **Enterprise Administration**: Complete control over users, companies, jobs, and platform settings.

*See [DOCUMENTATION.md](DOCUMENTATION.md) for detailed feature lists.*

---

## 🏃 Getting Started

### Prerequisites
- Node.js (v18+)
- InsForge Project (Database, Auth, Storage configured)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_INSFORGE_URL=your-project-url
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
ADMIN_EMAILS=admin@talentmesh.ai
```

---

## 🔐 Authentication & Roles

Authentication is fully implemented via InsForge Auth with strict Middleware route protection. 

- **Candidates**: Can sign up freely, build profiles, upload resumes, and apply for jobs.
- **Recruiters**: Must undergo KYC verification and approval before publishing jobs.
- **Admins**: Pre-whitelisted via environment variables.

---

## 📦 Deployment

The app is optimized for deployment on [Vercel](https://vercel.com):

```bash
npm run build
```

---

## 📄 License

Private — © TalentMesh 2024-2026
