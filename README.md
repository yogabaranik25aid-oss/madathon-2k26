# madathon-2k26
## ReworkGuard — Bug Accountability and Rework Cost Tracker

> **Hackathon Edition**: Engineering defect accountability, corrective maintenance time tracking, financial rework cost analysis in INR (₹), and manager sign-off workflows.

---

## 🎯 Project Goal
ReworkGuard provides engineering organizations with transparent visibility into:
1. **Executive Dashboard (`/dashboard`)**: Overview of total modules, defects, corrective maintenance hours, total rework costs in INR (₹), manager waiver cost tracking, Recharts monthly trend, and root-cause distributions.
2. **Software Modules (`/modules`)**: Defect density ($Bugs / KLOC$), module health status, version tracking, and module ownership provenance.
3. **Bug Tracking (`/bugs` & `/bugs/:id`)**: Defect accountability, automatic module linking, separation of provenance owner vs assigned fixer, corrective hours logging, rate snapshot calculations, and QA reopen verification.
4. **Manager Reviews (`/manager/reviews`)**: Formal sign-offs, verified root-cause categorization, decision dispositions (`Approved for Accounting`, `Waived`, `Disputed`, `Pending`), required waiver/dispute justifications, and audit logs.
5. **Governance & Fairness Policy**: Rework metrics are used strictly for architectural retrospectives, code quality, and project accounting — **never automatically deducted from employee salaries**. Any actual payroll adjustments strictly require independent lawful HR authorization.

---

## 🛠️ Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Visualizations**: Recharts (Monthly rework cost line chart, root-cause distribution chart)
- **Icons**: Lucide React
- **Backend**: Node.js, Express, REST API with server-side validation and role verification
- **Database**: PostgreSQL (Supabase / local instance ready with `server/schema.sql` and `server/init-db.ts`), bundled with a transactional datastore pre-seeded with realistic data for zero-config execution.

---

## 📁 Repository Structure

```
mdc/
├── package.json                 # Unified monorepo scripts & dependencies
├── tsconfig.json               # TypeScript compiler config
├── vite.config.ts              # Vite configuration with /api proxy to port 5001
├── tailwind.config.js          # Crisp professional white-theme Tailwind design
├── postcss.config.js           # PostCSS configuration
├── index.html                  # HTML entry point with Inter typography
│
├── types/
│   └── index.ts                # Shared TypeScript models (User, Module, Bug, TimeEntry, Review, AuditLog, etc.)
│
├── server/
│   ├── index.ts                # Express server entry point & static SPA hosting
│   ├── routes.ts               # Express API routes with server-side validation & role checks
│   ├── db.ts                   # Transactional datastore & rework cost calculation engine
│   ├── schema.sql              # Shared PostgreSQL / Supabase DDL schema for 6 tables + seed data
│   └── init-db.ts              # Automated PostgreSQL schema migration & seed script
│
└── src/
    ├── main.tsx                # Client React mount
    ├── App.tsx                 # Root router & application provider tree
    ├── index.css               # Base Tailwind styles & custom scrollbars
    │
    ├── context/
    │   └── AppContext.tsx      # Global state, route handling, persona switcher, bug routing (/bugs/:id)
    │
    ├── services/
    │   └── api.ts              # Unified API client connecting to Express endpoints
    │
    ├── components/
    │   ├── common/
    │   │   ├── Button.tsx      # Button variants (primary, secondary, outline, danger, ghost)
    │   │   ├── Card.tsx        # White card container with subtle borders
    │   │   ├── Modal.tsx       # Accessible dialog modal with ESC key and backdrop
    │   │   ├── FormControls.tsx# FormField, Input, Textarea, Select
    │   │   ├── StatusBadge.tsx # High-contrast status badges for bugs, reviews, modules
    │   │   ├── SeverityBadge.tsx # Critical, Major, Minor, High, Medium, Low badges
    │   │   ├── RootCauseBadge.tsx# Code defect, requirement change, external dependency, etc.
    │   │   ├── LoadingSpinner.tsx# Polished loading spinner
    │   │   ├── EmptyState.tsx  # Empty state with actionable button
    │   │   ├── ErrorAlert.tsx  # Dismissible error banners
    │   │   └── Toast.tsx       # Live toast notifications for all user actions
    │   └── layout/
    │       └── Layout.tsx      # Responsive sidebar, navigation, persona switcher, live indicators
    │
    └── pages/
        ├── DashboardPage.tsx   # /dashboard: 4 summary cards, Recharts monthly trend, root causes, recent bugs
        ├── ModulesPage.tsx     # /modules: Modules table, Add Module modal, module details, status transitions
        ├── BugsPage.tsx        # /bugs & /bugs/:id: Bug list, Report Bug modal, Log Corrective Time, QA reopen
        └── ManagerReviewsPage.tsx # /manager/reviews: Awaiting review table, review modal, waiver justification, audit trail
```

---

## 🗄️ Database Setup Instructions

The database schema (`server/schema.sql`) defines 6 unified relational tables:
1. `users`: Developers, Managers, and QA engineers with their respective `hourly_rate` in INR (₹).
2. `modules` & `module_status_history`: Codebase modules with `code`, `owner_id`, `version`, and status history.
3. `bugs` & `bug_status_history`: Defects with `module_id`, `module_version`, `original_module_owner_id`, `assigned_to_id`, `severity`, `status`, `corrective_hours`, `hourly_rate`, and `rework_cost`.
4. `time_entries`: Logged corrective maintenance records with `hours_spent`, `cost`, `work_description`, and `date`.
5. `reviews`: Manager evaluations with `root_cause`, `decision`, `comments`, and timestamp.
6. `audit_logs`: Immutable audit trail of every status transition, time log, and review decision.

### Initializing Local PostgreSQL or Supabase:
```bash
# Set your PostgreSQL or Supabase connection string:
export DATABASE_URL="postgresql://postgres:password@localhost:5432/reworkguard"

# Run the automated schema migration & seed script:
npm run db:init
```

*Note: If no `DATABASE_URL` is set, ReworkGuard automatically uses the high-performance in-memory datastore pre-seeded with realistic data for zero-config execution.*

---

## 🚀 Commands to Run

### Development Mode (Concurrent Frontend + Backend)
```bash
npm run dev
```
- Starts Vite frontend on `http://localhost:3000`
- Starts Express backend on `http://localhost:5001`
- Automatically proxies `/api` calls from Vite to Express

### Run Backend Standalone
```bash
npm run dev:server
```

### Run Frontend Standalone
```bash
npm run dev:client
```

### Production Build & Serve
```bash
npm run build
npm start
```

---

## 👥 Safe Demo Accounts & Persona Simulation

In the bottom of the sidebar, you can switch personas in 1 click:
| Name | Role | Email | Base Rate (INR) | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Sarah Connor** | Manager | `sarah.connor@reworkguard.io` | ₹750/hr | Review bug root causes, approve/waive rework costs, view audit logs, manage all modules |
| **Alex Rivera** | Developer | `alex.rivera@reworkguard.io` | ₹500/hr | Manage owned modules, report defects, log corrective hours, mark bugs Fixed |
| **Devon Lee** | Developer | `devon.lee@reworkguard.io` | ₹500/hr | Manage owned modules, report defects, log corrective hours, mark bugs Fixed |
| **Marcus Vance** | Developer | `marcus.vance@reworkguard.io` | ₹600/hr | Manage owned modules, report defects, log corrective hours, mark bugs Fixed |
| **Priya Sharma** | QA Lead | `priya.sharma@reworkguard.io` | ₹450/hr | Verification lead; authorized to **Reopen** bugs if fix verification fails |

---

## 🧪 Verified End-to-End Test Scenario

The complete lifecycle was tested and verified end-to-end:
1. **Module Creation**: Created *Payment Processing Gateway* (`PAYMENT`) owned by Developer A (*Alex Rivera*).
2. **Defect Reporting**: Reported a bug linked to that module, assigned to Developer B (*Devon Lee*), with module provenance cleanly separated.
3. **Corrective Time Tracking**: Logged 3.0 corrective maintenance hours at an illustrative rate of ₹500/hour.
4. **Cost Calculation**: Confirmed rework cost calculated to exactly **₹1,500** ($3\text{h} \times ₹500/\text{hr}$).
5. **Status Transition**: Transitioned defect status to `Fixed`.
6. **Manager Review**: Impersonated Manager (*Sarah Connor*), classified the root cause as *Requirement Change*, and recorded a **Waived** decision with documented justification.
7. **Audit Trail**: Confirmed that the review decision and audit entry were recorded with timestamp, reviewer ID, and comments.
8. **Dashboard Cost Integrity**: Confirmed that on `/dashboard`, the 3.0 hours and ₹1,500 rework cost **remain included** in overall cost reporting while being tracked under `manager_waiver_cost`.

---

## 📋 Implemented Features
- [x] Executive Dashboard (`/dashboard`) with 4 KPI summary cards, Recharts monthly trend, root causes distribution, recent bugs table, date filters, and manual refresh.
- [x] Module Management (`/modules`) with modules table, Add Module modal, validation against duplicate codes, module details view, and status history.
- [x] Bug Tracking (`/bugs` & `/bugs/:id`) with 9-column bug list, Report Bug modal with automatic module lookup, dedicated Bug Details view, corrective hours form with live cost calculation ($Hours \times Rate$), and QA-only reopen enforcement.
- [x] Manager Review (`/manager/reviews`) with awaiting review queue, root-cause categorization, decision dispositions (`Approved for Accounting`, `Waived`, `Disputed`, `Pending`), required justification for waivers/disputes, review history, and immutable audit logs.
- [x] Universal INR (`₹`) formatting for all monetary metrics.
- [x] Clear statutory compliance notices: No automatic salary deductions exist.

---

## ⚠️ Remaining Limitations & Notes
- **External Database Dependency**: When running without PostgreSQL, all changes persist in-memory for the duration of the server process. Connecting a PostgreSQL/Supabase database via `DATABASE_URL` provides permanent disk persistence.
- **Email Dispatching**: The system records transactional notifications in audit logs; live SMTP/SendGrid delivery is mocked for sandbox safety.
- **Authentication**: Authentication in this demonstration uses frictionless persona switching; enterprise SAML/SSO integration can be added using the existing `users` table schema.
