# Talentmesh — Audit Reports Index

This directory contains all technical audit reports for the Talentmesh AI Recruiting platform. Reports are organized by feature area. Each audit is a living document — update it whenever a related feature is changed, fixed, or extended.

---

## Directory Structure

```
audits/
├── README.md                          ← This file (index)
│
├── candidate/
│   ├── README.md                      ← Index of all candidate-area audits
│   ├── resume-system-audit.md         ← Resume upload, management, RLS, storage
│   └── profile-system-audit.md        ← Profile page, sync bugs, hydration
│
├── admin/
│   ├── README.md                      ← Index of all admin-area audits
│   └── job-approvals-audit.md         ← Job approval workflow, constraint mapping
│
├── recruiter/
│   └── README.md                      ← (Placeholder for future recruiter audits)
│
└── shared/
    ├── README.md                      ← Shared/infrastructure audits
    └── storage-rls-audit.md           ← Storage bucket RLS policies audit
```

---

## How to Use This Directory

- **When you change code** related to a feature, open the matching audit `.md` file and add a note at the bottom under `## Changelog`.
- **When you find a new bug**, add it to the relevant audit file under `## Known Issues`.
- **When a bug is fixed**, update its status to ✅ Fixed with the date and PR/commit ref.
- **When sharing with teammates**, send the specific audit file link — each file is self-contained.

---

## Feature Coverage Status

| Feature | Audit File | Status |
|---|---|---|
| Candidate Resume System | `candidate/resume-system-audit.md` | ✅ Active |
| Candidate Profile System | `candidate/profile-system-audit.md` | 🔄 Pending |
| Admin Job Approvals | `admin/job-approvals-audit.md` | ✅ Active |
| Admin Dashboard & Sidebar | `admin/dashboard-sidebar-audit.md` | ✅ Active |
| Admin Candidates Management | `admin/candidate-management-audit.md` | ✅ Active |
| Admin Recruiters Management | `admin/recruiter-management-audit.md` | ✅ Active |
| Background Export Queue System | `admin/export-system-audit.md` | ✅ Active |
| Storage RLS Policies | `shared/storage-rls-audit.md` | ✅ Active |
| Recruiter Portal | `recruiter/README.md` | 📋 Placeholder |
