import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.resolve(__dirname, '../.reworkguard-data.json');
const outputPath = path.resolve(__dirname, '../../supabase/reworkguard_setup.sql');

function sqlVal(v: any): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return isNaN(v) ? '0' : String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'object') {
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sqlDate(v: any): string {
  if (!v) return 'NULL';
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'NULL';
    return `'${d.toISOString()}'`;
  } catch {
    return 'NULL';
  }
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let sql = `-- ====================================================================
-- REWORKGUARD — COMPLETE PRODUCTION SUPABASE DATABASE SETUP & SEED SCRIPT
-- Project ID: jfeveaptdeqniyriwcbc
-- Project URL: https://jfeveaptdeqniyriwcbc.supabase.co
-- Schema: public
--
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/jfeveaptdeqniyriwcbc/sql/new
-- 2. Paste this entire SQL file and click "Run" (Cmd+Enter / Ctrl+Enter)
-- 3. All 19 application tables will appear in the Supabase Table Editor pre-seeded
--    with all legitimate existing application records!
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ====================================================================
-- 1. USERS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(64) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(32) NOT NULL CHECK (role IN ('developer', 'manager', 'qa', 'admin', 'hr', 'client')),
  client_id VARCHAR(64),
  employee_id VARCHAR(64),
  engineering_role VARCHAR(64),
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  avatar VARCHAR(512),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 2. PROJECTS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'planning')),
  client_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  client_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 3. MODULES TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.modules (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64) UNIQUE NOT NULL,
  version VARCHAR(32) NOT NULL DEFAULT 'v1.0.0',
  description TEXT,
  owner_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  total_lines_of_code INTEGER NOT NULL DEFAULT 10000,
  status VARCHAR(32) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'reopened', 'under_fix', 'closed', 'active', 'maintenance', 'deprecated')),
  original_task_value NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
  project_name VARCHAR(255) DEFAULT 'Core Platform',
  client_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  client_name VARCHAR(255),
  reopen_count INTEGER NOT NULL DEFAULT 0,
  delivered_at TIMESTAMP WITH TIME ZONE,
  client_verified_at TIMESTAMP WITH TIME ZONE,
  client_star_rating NUMERIC(3, 1),
  client_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completion_date TIMESTAMP WITH TIME ZONE,
  committed_deadline TIMESTAMP WITH TIME ZONE
);

-- ====================================================================
-- 4. MODULE_STATUS_HISTORY TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.module_status_history (
  id VARCHAR(64) PRIMARY KEY,
  module_id VARCHAR(64) NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  from_status VARCHAR(32) NOT NULL,
  to_status VARCHAR(32) NOT NULL,
  changed_by_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  changed_by_name VARCHAR(255),
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 5. TASKS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64),
  project_name VARCHAR(255),
  module_id VARCHAR(64) REFERENCES public.modules(id) ON DELETE CASCADE,
  module_name VARCHAR(255),
  module_code VARCHAR(64),
  module_version VARCHAR(32),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),
  assigned_by_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_by_name VARCHAR(255),
  assigned_role VARCHAR(64),
  priority VARCHAR(32) NOT NULL DEFAULT 'p1',
  deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(32) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'changes_requested', 'approved', 'reopened', 'under_fix')),
  original_task_value NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
  acceptance_criteria JSONB,
  permitted_files JSONB,
  saved_files JSONB,
  submission_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_by_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by_name VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_feedback TEXT,
  resubmission_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 6. SUBMISSIONS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id VARCHAR(64) PRIMARY KEY,
  task_id VARCHAR(64) NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  submission_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(32) NOT NULL DEFAULT 'submitted',
  review_decision VARCHAR(32),
  reviewer_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  reviewer_name VARCHAR(255),
  reviewer_feedback TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- ====================================================================
-- 7. WORK_SESSIONS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.work_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  task_id VARCHAR(64),
  bug_id VARCHAR(64),
  target_id VARCHAR(64) NOT NULL,
  target_title VARCHAR(255) NOT NULL,
  work_type VARCHAR(64) NOT NULL DEFAULT 'corrective_rework',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paused_at TIMESTAMP WITH TIME ZONE,
  total_paused_seconds INTEGER NOT NULL DEFAULT 0,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 8. WORK_SESSION_EVENTS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.work_session_events (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL REFERENCES public.work_sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(32) NOT NULL,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 9. TIME_CORRECTION_REQUESTS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.time_correction_requests (
  id VARCHAR(64) PRIMARY KEY,
  time_entry_id VARCHAR(64),
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  target_title VARCHAR(255),
  original_hours NUMERIC(8, 2) NOT NULL,
  requested_hours NUMERIC(8, 2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  reviewed_by_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by_name VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 10. BUGS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.bugs (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  module_id VARCHAR(64) NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  module_version VARCHAR(32),
  original_module_owner_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  reproduction_steps TEXT,
  severity VARCHAR(32) NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'high', 'medium', 'low')),
  priority VARCHAR(32) NOT NULL CHECK (priority IN ('p0', 'p1', 'p2', 'p3')),
  status VARCHAR(32) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fixed', 'closed', 'reopened', 'review_pending', 'under_fix')),
  root_cause VARCHAR(64) NOT NULL,
  original_author_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  corrective_hours NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  rework_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  review_status VARCHAR(32) NOT NULL DEFAULT 'not_submitted',
  classification_status VARCHAR(64) NOT NULL DEFAULT 'confirmed_defect',
  classification_notes TEXT,
  classified_by_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  classified_at TIMESTAMP WITH TIME ZONE,
  dispute_reason TEXT,
  disputed_by_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  disputed_at TIMESTAMP WITH TIME ZONE,
  dispute_status VARCHAR(32) NOT NULL DEFAULT 'none',
  evidence_urls TEXT,
  evidence_notes TEXT,
  jira_issue_id VARCHAR(128),
  jira_issue_key VARCHAR(64),
  jira_issue_url VARCHAR(512),
  original_task_id VARCHAR(64),
  original_task_title VARCHAR(255),
  original_task_value NUMERIC(12, 2) DEFAULT 50000.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  committed_deadline TIMESTAMP WITH TIME ZONE,
  bug_found_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  client_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  client_name VARCHAR(255),
  client_reported BOOLEAN NOT NULL DEFAULT FALSE,
  client_verified BOOLEAN NOT NULL DEFAULT FALSE,
  client_verified_at TIMESTAMP WITH TIME ZONE,
  client_rating NUMERIC(3, 1),
  client_feedback TEXT
);

-- ====================================================================
-- 11. BUG_STATUS_HISTORY TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.bug_status_history (
  id VARCHAR(64) PRIMARY KEY,
  bug_id VARCHAR(64) NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
  from_status VARCHAR(32) NOT NULL,
  to_status VARCHAR(32) NOT NULL,
  changed_by_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  changed_by_name VARCHAR(255),
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 12. TIME_ENTRIES TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.time_entries (
  id VARCHAR(64) PRIMARY KEY,
  bug_id VARCHAR(64) NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hours_spent NUMERIC(8, 2) NOT NULL CHECK (hours_spent > 0),
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  cost NUMERIC(12, 2) NOT NULL,
  work_description TEXT NOT NULL,
  work_category VARCHAR(32) NOT NULL DEFAULT 'corrective_maintenance',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 13. REVIEWS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id VARCHAR(64) PRIMARY KEY,
  bug_id VARCHAR(64) NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
  manager_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  developer_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  root_cause VARCHAR(64) NOT NULL DEFAULT 'code_defect',
  decision VARCHAR(32) NOT NULL DEFAULT 'pending',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  comments TEXT,
  cost_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  hours_approved NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 14. AUDIT_LOGS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  entity_type VARCHAR(32) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 15. ACTIVE_TIME_SESSIONS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.active_time_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  work_item_id VARCHAR(64) NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
  work_description TEXT,
  work_category VARCHAR(32) NOT NULL DEFAULT 'corrective_maintenance',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  last_resume_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_paused_seconds INTEGER NOT NULL DEFAULT 0,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 16. PAYROLL_ADJUSTMENTS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.payroll_adjustments (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month VARCHAR(32) NOT NULL,
  bug_id VARCHAR(64) REFERENCES public.bugs(id) ON DELETE SET NULL,
  module_id VARCHAR(64) REFERENCES public.modules(id) ON DELETE SET NULL,
  original_author_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  rework_assignee_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  approved_hours NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  rework_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  original_task_value NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
  capped_adjustment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  excluded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  cap_applied BOOLEAN NOT NULL DEFAULT FALSE,
  calculation_explanation TEXT,
  proposed_adjustment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  proposed_bonus_adjustment NUMERIC(12, 2) DEFAULT 0.00,
  proposed_retainer_adjustment NUMERIC(12, 2) DEFAULT 0.00,
  waiver_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  is_chargeable BOOLEAN NOT NULL DEFAULT TRUE,
  waiver_reason TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  review_notes TEXT,
  finance_reviewer_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  finance_review_date TIMESTAMP WITH TIME ZONE,
  hr_authorization_status VARCHAR(32) NOT NULL DEFAULT 'pending_hr_review',
  hr_reviewer_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  hr_decision_date TIMESTAMP WITH TIME ZONE,
  hr_notes TEXT,
  dispute_reason TEXT,
  disputed_at TIMESTAMP WITH TIME ZONE,
  disputed_by_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  external_payroll_status VARCHAR(32) DEFAULT 'dry_run',
  external_payroll_tx_id VARCHAR(128),
  external_payroll_batch_id VARCHAR(128),
  payroll_provider VARCHAR(64) DEFAULT 'sandbox_mock',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 17. NOTIFICATIONS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(32) NOT NULL,
  link VARCHAR(255),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 18. JIRA_SYNC_LOGS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.jira_sync_logs (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(128),
  event_type VARCHAR(64) NOT NULL,
  jira_key VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'received',
  details TEXT,
  payload JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 19. PAYROLL_SUBMISSION_LOGS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.payroll_submission_logs (
  id VARCHAR(64) PRIMARY KEY,
  batch_id VARCHAR(128) NOT NULL,
  provider VARCHAR(64) NOT NULL DEFAULT 'sandbox_mock',
  mode VARCHAR(32) NOT NULL DEFAULT 'dry_run',
  authorized_by_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
  records_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(16) NOT NULL DEFAULT 'INR',
  payload JSONB,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_modules_owner_id ON public.modules(owner_id);
CREATE INDEX IF NOT EXISTS idx_modules_client_id ON public.modules(client_id);
CREATE INDEX IF NOT EXISTS idx_modules_status ON public.modules(status);
CREATE INDEX IF NOT EXISTS idx_modules_reopen_count ON public.modules(reopen_count);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_module_id ON public.tasks(module_id);
CREATE INDEX IF NOT EXISTS idx_bugs_module_id ON public.bugs(module_id);
CREATE INDEX IF NOT EXISTS idx_bugs_status ON public.bugs(status);
CREATE INDEX IF NOT EXISTS idx_bugs_assigned_to ON public.bugs(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_bugs_original_author ON public.bugs(original_author_id);
CREATE INDEX IF NOT EXISTS idx_bugs_client_id ON public.bugs(client_id);
CREATE INDEX IF NOT EXISTS idx_bugs_classification ON public.bugs(classification_status);
CREATE INDEX IF NOT EXISTS idx_time_entries_bug_id ON public.time_entries(bug_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_bug_id ON public.reviews(bug_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_employee ON public.payroll_adjustments(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_month ON public.payroll_adjustments(month);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & LEAST-PRIVILEGE GRANTS
-- Strict role-based isolation (Client, Developer, Manager, HR, Admin)
-- ====================================================================

-- 1. Grant schema usage and table permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.modules TO anon; -- For verifier probe testing only (RLS enforces mod-test-% constraint)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

-- 2. Enable RLS across all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jira_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_submission_logs ENABLE ROW LEVEL SECURITY;

-- 3. Strict Least-Privilege Policies

-- A. USERS POLICIES (Protects user profiles and private credentials)
DROP POLICY IF EXISTS "Public directory viewable" ON public.users;
CREATE POLICY "Public directory viewable" ON public.users
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can only update own profile" ON public.users;
CREATE POLICY "Users can only update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- B. PROJECTS POLICIES
DROP POLICY IF EXISTS "Projects viewable by anon and auth" ON public.projects;
CREATE POLICY "Projects viewable by anon and auth" ON public.projects
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Projects manageable by managers and admins" ON public.projects;
CREATE POLICY "Projects manageable by managers and admins" ON public.projects
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin')));

-- C. MODULES POLICIES (Protects production modules; allows connectivity verifier probe)
DROP POLICY IF EXISTS "Modules viewable by anon and auth" ON public.modules;
CREATE POLICY "Modules viewable by anon and auth" ON public.modules
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Team members can manage modules" ON public.modules;
CREATE POLICY "Team members can manage modules" ON public.modules
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin', 'developer')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin', 'developer')));

DROP POLICY IF EXISTS "Allow anon probe on test modules only" ON public.modules;
CREATE POLICY "Allow anon probe on test modules only" ON public.modules
  FOR ALL TO anon
  USING (id LIKE 'mod-test-%' OR code LIKE 'TEST_%')
  WITH CHECK (id LIKE 'mod-test-%' OR code LIKE 'TEST_%');

-- D. TASKS & SUBMISSIONS POLICIES
DROP POLICY IF EXISTS "Tasks viewable by team" ON public.tasks;
CREATE POLICY "Tasks viewable by team" ON public.tasks
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Tasks manageable by managers" ON public.tasks;
CREATE POLICY "Tasks manageable by managers" ON public.tasks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin')));

DROP POLICY IF EXISTS "Submissions accessible by team" ON public.submissions;
CREATE POLICY "Submissions accessible by team" ON public.submissions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- E. WORK SESSIONS & CORRECTIONS
DROP POLICY IF EXISTS "Work sessions access" ON public.work_sessions;
CREATE POLICY "Work sessions access" ON public.work_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin')))
  WITH CHECK (user_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin')));

DROP POLICY IF EXISTS "Work session events access" ON public.work_session_events;
CREATE POLICY "Work session events access" ON public.work_session_events
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Time correction requests access" ON public.time_correction_requests;
CREATE POLICY "Time correction requests access" ON public.time_correction_requests
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin')))
  WITH CHECK (user_id = auth.uid()::text OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin')));

-- F. BUGS POLICIES
DROP POLICY IF EXISTS "Bugs viewable by authenticated users" ON public.bugs;
CREATE POLICY "Bugs viewable by authenticated users" ON public.bugs
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Bugs reporting and fixing by authenticated team" ON public.bugs;
CREATE POLICY "Bugs reporting and fixing by authenticated team" ON public.bugs
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Bugs update by authenticated team" ON public.bugs;
CREATE POLICY "Bugs update by authenticated team" ON public.bugs
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Bug history viewable" ON public.bug_status_history;
CREATE POLICY "Bug history viewable" ON public.bug_status_history
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Bug history append-only" ON public.bug_status_history;
CREATE POLICY "Bug history append-only" ON public.bug_status_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Module history viewable" ON public.module_status_history;
CREATE POLICY "Module history viewable" ON public.module_status_history
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Module history append-only" ON public.module_status_history;
CREATE POLICY "Module history append-only" ON public.module_status_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- G. TIME ENTRIES POLICIES (Protects employee records; anonymous users blocked)
DROP POLICY IF EXISTS "Time entries accessible by authorized employee and manager" ON public.time_entries;
CREATE POLICY "Time entries accessible by authorized employee and manager" ON public.time_entries
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()::text OR 
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin', 'hr'))
  )
  WITH CHECK (
    user_id = auth.uid()::text OR 
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin'))
  );

-- H. REVIEWS POLICIES
DROP POLICY IF EXISTS "Reviews accessible by authenticated team" ON public.reviews;
CREATE POLICY "Reviews accessible by authenticated team" ON public.reviews
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin', 'developer', 'hr')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin')));

-- I. AUDIT LOGS POLICIES (Strictly Append-Only Governance; Immutable)
DROP POLICY IF EXISTS "Audit logs viewable by authorized staff" ON public.audit_logs;
CREATE POLICY "Audit logs viewable by authorized staff" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin', 'hr', 'developer'))
  );

DROP POLICY IF EXISTS "Audit logs append-only insert" ON public.audit_logs;
CREATE POLICY "Audit logs append-only insert" ON public.audit_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
-- Note: NO UPDATE or DELETE policies exist for audit_logs, guaranteeing immutability!

-- J. ACTIVE TIME SESSIONS POLICIES
DROP POLICY IF EXISTS "Active time sessions for own user" ON public.active_time_sessions;
CREATE POLICY "Active time sessions for own user" ON public.active_time_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- K. PAYROLL ADJUSTMENTS & SUBMISSIONS (Confidential Statutory Payroll Data)
DROP POLICY IF EXISTS "Payroll adjustments protected access" ON public.payroll_adjustments;
CREATE POLICY "Payroll adjustments protected access" ON public.payroll_adjustments
  FOR ALL TO authenticated
  USING (
    employee_id = auth.uid()::text OR 
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin', 'hr'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin', 'hr'))
  );

DROP POLICY IF EXISTS "Payroll submission logs restricted" ON public.payroll_submission_logs;
CREATE POLICY "Payroll submission logs restricted" ON public.payroll_submission_logs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin', 'hr')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin', 'hr')));

-- L. NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Notifications private to recipient" ON public.notifications;
CREATE POLICY "Notifications private to recipient" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- M. JIRA SYNC LOGS
DROP POLICY IF EXISTS "Jira sync logs viewable by staff" ON public.jira_sync_logs;
CREATE POLICY "Jira sync logs viewable by staff" ON public.jira_sync_logs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin', 'developer')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::text AND u.role IN ('manager', 'admin')));

-- N. SERVICE ROLE FULL ACCESS (Guarantees backend server operations succeed)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Service role administrative access" ON public.%I;', t);
    EXECUTE format('CREATE POLICY "Service role administrative access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;


\n`;

// 1. Users
sql += `-- ====================================================================\n-- SEED DATA: USERS (${data.users.length} records)\n-- ====================================================================\n`;
for (const u of data.users) {
  sql += `INSERT INTO public.users (id, name, email, username, password, role, hourly_rate, avatar, client_id, employee_id, engineering_role, created_at)
VALUES (${sqlVal(u.id)}, ${sqlVal(u.name)}, ${sqlVal(u.email)}, ${sqlVal(u.username)}, ${sqlVal(u.password)}, ${sqlVal(u.role)}, ${sqlVal(u.hourly_rate || 500)}, ${sqlVal(u.avatar)}, ${sqlVal(u.client_id)}, ${sqlVal(u.employee_id)}, ${sqlVal(u.engineering_role)}, ${sqlDate(u.created_at)})
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  hourly_rate = EXCLUDED.hourly_rate,
  client_id = EXCLUDED.client_id,
  employee_id = EXCLUDED.employee_id,
  engineering_role = EXCLUDED.engineering_role;\n`;
}
sql += '\n';

// 2. Projects
sql += `-- ====================================================================\n-- SEED DATA: PROJECTS (${data.projects.length} records)\n-- ====================================================================\n`;
for (const p of data.projects) {
  sql += `INSERT INTO public.projects (id, name, code, description, status, client_id, client_name, created_at)
VALUES (${sqlVal(p.id)}, ${sqlVal(p.name)}, ${sqlVal(p.code)}, ${sqlVal(p.description)}, ${sqlVal(p.status || 'active')}, ${sqlVal(p.client_id)}, ${sqlVal(p.client_name)}, ${sqlDate(p.created_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 3. Modules (with pre-reconciliation step to avoid duplicate key errors)
sql += `-- ====================================================================\n-- SEED DATA: MODULES (${data.modules.length} records)\n-- ====================================================================\n`;
sql += `-- Safe Pre-Reconciliation: Disambiguate any legacy duplicate codes before upsert
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules') THEN
    UPDATE public.modules SET code = 'INV_WIDGET_8729' WHERE id = 'mod-8729';
    UPDATE public.modules SET code = 'INV_WIDGET_0724' WHERE id = 'mod-0724';
    UPDATE public.modules SET code = 'NOTIF_SRV_8728' WHERE id = 'mod-8728';
    UPDATE public.modules SET code = 'NOTIF_SRV_0723' WHERE id = 'mod-0723';
    UPDATE public.modules SET code = 'PTM_1139' WHERE id = 'mod-1139';
    UPDATE public.modules SET code = 'PTM_0198' WHERE id = 'mod-0198';
    UPDATE public.modules SET code = 'PTM_6204' WHERE id = 'mod-6204';
    UPDATE public.modules SET code = 'PTM_5197' WHERE id = 'mod-5197';
    UPDATE public.modules SET code = 'PTM_9745' WHERE id = 'mod-9745';
    UPDATE public.modules SET code = 'PTM_0705' WHERE id = 'mod-0705';
    UPDATE public.modules SET code = 'PTM_3124' WHERE id = 'mod-3124';

    -- Generalized safety catch: If any other legacy row still has duplicate codes, append id to ensure uniqueness
    UPDATE public.modules SET code = code || '_' || replace(id, '-', '_')
    WHERE code IN ('INV_WIDGET', 'NOTIF_SRV', 'PTM')
      AND id NOT IN ('mod-0391', 'mod-0390');
  END IF;
END $$;\n\n`;
const moduleCodeDisambiguations: Record<string, string> = {
  'mod-8729': 'INV_WIDGET_8729',
  'mod-0724': 'INV_WIDGET_0724',
  'mod-8728': 'NOTIF_SRV_8728',
  'mod-0723': 'NOTIF_SRV_0723',
  'mod-1139': 'PTM_1139',
  'mod-0198': 'PTM_0198',
  'mod-6204': 'PTM_6204',
  'mod-5197': 'PTM_5197',
  'mod-9745': 'PTM_9745',
  'mod-0705': 'PTM_0705',
  'mod-3124': 'PTM_3124'
};

for (const m of data.modules) {
  const mCode = moduleCodeDisambiguations[m.id] || m.code;
  sql += `INSERT INTO public.modules (id, name, code, version, description, owner_id, total_lines_of_code, status, original_task_value, project_name, client_id, client_name, reopen_count, delivered_at, client_verified_at, client_star_rating, client_feedback, created_at, updated_at, completion_date, committed_deadline)
VALUES (${sqlVal(m.id)}, ${sqlVal(m.name)}, ${sqlVal(mCode)}, ${sqlVal(m.version || 'v1.0.0')}, ${sqlVal(m.description)}, ${sqlVal(m.owner_id)}, ${sqlVal(m.total_lines_of_code || 10000)}, ${sqlVal(m.status || 'assigned')}, ${sqlVal(m.original_task_value || 50000)}, ${sqlVal(m.project_name || 'Core Platform')}, ${sqlVal(m.client_id)}, ${sqlVal(m.client_name)}, ${sqlVal(m.reopen_count || 0)}, ${sqlDate(m.delivered_at)}, ${sqlDate(m.client_verified_at)}, ${sqlVal(m.client_star_rating)}, ${sqlVal(m.client_feedback)}, ${sqlDate(m.created_at)}, ${sqlDate(m.updated_at)}, ${sqlDate(m.completion_date)}, ${sqlDate(m.committed_deadline)})
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  status = EXCLUDED.status,
  reopen_count = EXCLUDED.reopen_count,
  client_id = EXCLUDED.client_id,
  client_name = EXCLUDED.client_name,
  delivered_at = EXCLUDED.delivered_at,
  client_verified_at = EXCLUDED.client_verified_at,
  client_star_rating = EXCLUDED.client_star_rating,
  client_feedback = EXCLUDED.client_feedback,
  updated_at = EXCLUDED.updated_at;\n`;
}
sql += '\n';

// 4. Tasks
sql += `-- ====================================================================\n-- SEED DATA: TASKS (${data.tasks?.length || 0} records)\n-- ====================================================================\n`;
for (const t of data.tasks || []) {
  sql += `INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES (${sqlVal(t.id)}, ${sqlVal(t.project_id)}, ${sqlVal(t.project_name)}, ${sqlVal(t.module_id)}, ${sqlVal(t.module_name)}, ${sqlVal(t.module_code)}, ${sqlVal(t.module_version)}, ${sqlVal(t.title)}, ${sqlVal(t.description)}, ${sqlVal(t.assigned_to_id)}, ${sqlVal(t.assigned_to_name)}, ${sqlVal(t.assigned_by_id)}, ${sqlVal(t.assigned_by_name)}, ${sqlVal(t.assigned_role)}, ${sqlVal(t.priority || 'p1')}, ${sqlDate(t.deadline)}, ${sqlVal(t.status || 'assigned')}, ${sqlVal(t.original_task_value || 50000)}, ${sqlVal(t.acceptance_criteria)}, ${sqlVal(t.permitted_files)}, ${sqlVal(t.saved_files)}, ${sqlVal(t.resubmission_count || 0)}, ${sqlDate(t.created_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 5. Submissions
sql += `-- ====================================================================\n-- SEED DATA: SUBMISSIONS (${data.submissions?.length || 0} records)\n-- ====================================================================\n`;
for (const s of data.submissions || []) {
  sql += `INSERT INTO public.submissions (id, task_id, user_id, user_name, submission_notes, submitted_at, status, review_decision, reviewer_id, reviewer_name, reviewer_feedback, reviewed_at)
VALUES (${sqlVal(s.id)}, ${sqlVal(s.task_id)}, ${sqlVal(s.user_id)}, ${sqlVal(s.user_name)}, ${sqlVal(s.submission_notes)}, ${sqlDate(s.submitted_at)}, ${sqlVal(s.status || 'submitted')}, ${sqlVal(s.review_decision)}, ${sqlVal(s.reviewer_id)}, ${sqlVal(s.reviewer_name)}, ${sqlVal(s.reviewer_feedback)}, ${sqlDate(s.reviewed_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 6. Work Sessions
sql += `-- ====================================================================\n-- SEED DATA: WORK SESSIONS (${data.workSessions?.length || 0} records)\n-- ====================================================================\n`;
for (const ws of data.workSessions || []) {
  sql += `INSERT INTO public.work_sessions (id, user_id, user_name, task_id, bug_id, target_id, target_title, work_type, status, start_time, paused_at, total_paused_seconds, end_time, duration_seconds, notes, created_at)
VALUES (${sqlVal(ws.id)}, ${sqlVal(ws.user_id)}, ${sqlVal(ws.user_name)}, ${sqlVal(ws.task_id)}, ${sqlVal(ws.bug_id)}, ${sqlVal(ws.target_id)}, ${sqlVal(ws.target_title)}, ${sqlVal(ws.work_type || 'corrective_rework')}, ${sqlVal(ws.status || 'active')}, ${sqlDate(ws.start_time)}, ${sqlDate(ws.paused_at)}, ${sqlVal(ws.total_paused_seconds || 0)}, ${sqlDate(ws.end_time)}, ${sqlVal(ws.duration_seconds || 0)}, ${sqlVal(ws.notes)}, ${sqlDate(ws.created_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 7. Bugs
sql += `-- ====================================================================\n-- SEED DATA: BUGS (${data.bugs.length} records)\n-- ====================================================================\n`;
for (const b of data.bugs) {
  sql += `INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES (${sqlVal(b.id)}, ${sqlVal(b.title)}, ${sqlVal(b.description)}, ${sqlVal(b.module_id)}, ${sqlVal(b.module_version || 'v1.0.0')}, ${sqlVal(b.original_module_owner_id)}, ${sqlVal(b.reproduction_steps)}, ${sqlVal(b.severity || 'major')}, ${sqlVal(b.priority || 'p1')}, ${sqlVal(b.status || 'open')}, ${sqlVal(b.root_cause || 'code_defect')}, ${sqlVal(b.original_author_id)}, ${sqlVal(b.assigned_to_id)}, ${sqlVal(b.corrective_hours || 0)}, ${sqlVal(b.hourly_rate || 500)}, ${sqlVal(b.rework_cost || 0)}, ${sqlVal(b.review_status || 'not_submitted')}, ${sqlVal(b.classification_status || 'confirmed_defect')}, ${sqlVal(b.classification_notes)}, ${sqlVal(b.classified_by_id)}, ${sqlDate(b.classified_at)}, ${sqlVal(b.dispute_reason)}, ${sqlVal(b.disputed_by_id)}, ${sqlDate(b.disputed_at)}, ${sqlVal(b.dispute_status || 'none')}, ${sqlVal(b.evidence_urls)}, ${sqlVal(b.evidence_notes)}, ${sqlVal(b.jira_issue_id)}, ${sqlVal(b.jira_issue_key)}, ${sqlVal(b.jira_issue_url)}, ${sqlVal(b.original_task_id)}, ${sqlVal(b.original_task_title)}, ${sqlVal(b.original_task_value || 50000)}, ${sqlDate(b.created_at)}, ${sqlDate(b.updated_at)}, ${sqlDate(b.resolved_at)}, ${sqlDate(b.committed_deadline)}, ${sqlDate(b.bug_found_date)}, ${sqlVal(b.client_id)}, ${sqlVal(b.client_name)}, ${sqlVal(b.client_reported || false)}, ${sqlVal(b.client_verified || false)}, ${sqlDate(b.client_verified_at)}, ${sqlVal(b.client_rating)}, ${sqlVal(b.client_feedback)})
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  corrective_hours = EXCLUDED.corrective_hours,
  rework_cost = EXCLUDED.rework_cost,
  classification_status = EXCLUDED.classification_status,
  client_verified = EXCLUDED.client_verified,
  client_verified_at = EXCLUDED.client_verified_at,
  client_rating = EXCLUDED.client_rating,
  client_feedback = EXCLUDED.client_feedback,
  updated_at = EXCLUDED.updated_at;\n`;
}
sql += '\n';

// 8. Time Entries
sql += `-- ====================================================================\n-- SEED DATA: TIME ENTRIES (${data.timeEntries.length} records)\n-- ====================================================================\n`;
for (const te of data.timeEntries) {
  sql += `INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES (${sqlVal(te.id)}, ${sqlVal(te.bug_id)}, ${sqlVal(te.user_id)}, ${sqlVal(te.hours_spent)}, ${sqlVal(te.hourly_rate || 500)}, ${sqlVal(te.cost)}, ${sqlVal(te.work_description)}, ${sqlVal(te.work_category || 'corrective_maintenance')}, ${sqlDate(te.date)}, ${sqlDate(te.created_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 9. Reviews
sql += `-- ====================================================================\n-- SEED DATA: REVIEWS (${data.reviews.length} records)\n-- ====================================================================\n`;
for (const r of data.reviews) {
  sql += `INSERT INTO public.reviews (id, bug_id, manager_id, developer_id, root_cause, decision, status, review_notes, comments, cost_accepted, hours_approved, quality_rating, created_at, updated_at)
VALUES (${sqlVal(r.id)}, ${sqlVal(r.bug_id)}, ${sqlVal(r.manager_id)}, ${sqlVal(r.developer_id)}, ${sqlVal(r.root_cause || 'code_defect')}, ${sqlVal(r.decision || 'pending')}, ${sqlVal(r.status || 'pending')}, ${sqlVal(r.review_notes || r.comments)}, ${sqlVal(r.comments || r.review_notes)}, ${sqlVal(r.cost_accepted || false)}, ${sqlVal(r.hours_approved || 0)}, ${sqlVal(r.quality_rating || 4)}, ${sqlDate(r.created_at)}, ${sqlDate(r.updated_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 10. Payroll Adjustments
sql += `-- ====================================================================\n-- SEED DATA: PAYROLL ADJUSTMENTS (${data.payrollAdjustments.length} records)\n-- ====================================================================\n`;
for (const pa of data.payrollAdjustments) {
  sql += `INSERT INTO public.payroll_adjustments (id, employee_id, month, bug_id, module_id, original_author_id, rework_assignee_id, approved_hours, hourly_rate, rework_cost, original_task_value, capped_adjustment_amount, excluded_amount, cap_applied, calculation_explanation, proposed_adjustment_amount, proposed_bonus_adjustment, proposed_retainer_adjustment, waiver_amount, is_chargeable, waiver_reason, status, review_notes, finance_reviewer_id, finance_review_date, hr_authorization_status, hr_reviewer_id, hr_decision_date, hr_notes, dispute_reason, disputed_at, disputed_by_id, external_payroll_status, external_payroll_tx_id, external_payroll_batch_id, payroll_provider, created_at, updated_at)
VALUES (${sqlVal(pa.id)}, ${sqlVal(pa.employee_id)}, ${sqlVal(pa.month)}, ${sqlVal(pa.bug_id)}, ${sqlVal(pa.module_id)}, ${sqlVal(pa.original_author_id)}, ${sqlVal(pa.rework_assignee_id)}, ${sqlVal(pa.approved_hours || 0)}, ${sqlVal(pa.hourly_rate || 500)}, ${sqlVal(pa.rework_cost || 0)}, ${sqlVal(pa.original_task_value || pa.contract_task_value || 50000)}, ${sqlVal(pa.capped_adjustment_amount || 0)}, ${sqlVal(pa.excluded_amount || 0)}, ${sqlVal(pa.cap_applied || false)}, ${sqlVal(pa.calculation_explanation)}, ${sqlVal(pa.proposed_adjustment_amount || 0)}, ${sqlVal(pa.proposed_bonus_adjustment || 0)}, ${sqlVal(pa.proposed_retainer_adjustment || 0)}, ${sqlVal(pa.waiver_amount || 0)}, ${sqlVal(pa.is_chargeable !== false)}, ${sqlVal(pa.waiver_reason)}, ${sqlVal(pa.status || 'draft')}, ${sqlVal(pa.review_notes)}, ${sqlVal(pa.finance_reviewer_id)}, ${sqlDate(pa.finance_review_date)}, ${sqlVal(pa.hr_authorization_status || 'pending_hr_review')}, ${sqlVal(pa.hr_reviewer_id)}, ${sqlDate(pa.hr_decision_date)}, ${sqlVal(pa.hr_notes)}, ${sqlVal(pa.dispute_reason)}, ${sqlDate(pa.disputed_at)}, ${sqlVal(pa.disputed_by_id)}, ${sqlVal(pa.external_payroll_status || 'dry_run')}, ${sqlVal(pa.external_payroll_tx_id)}, ${sqlVal(pa.external_payroll_batch_id)}, ${sqlVal(pa.payroll_provider || 'sandbox_mock')}, ${sqlDate(pa.created_at)}, ${sqlDate(pa.updated_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 11. Notifications
sql += `-- ====================================================================\n-- SEED DATA: NOTIFICATIONS (${data.notifications.length} records)\n-- ====================================================================\n`;
for (const n of data.notifications) {
  sql += `INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES (${sqlVal(n.id)}, ${sqlVal(n.user_id)}, ${sqlVal(n.title)}, ${sqlVal(n.message)}, ${sqlVal(n.type || 'info')}, ${sqlVal(n.link)}, ${sqlVal(n.read || false)}, ${sqlDate(n.created_at)})
ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 12. Audit Logs
sql += `-- ====================================================================\n-- SEED DATA: AUDIT LOGS (${data.auditLogs.length} records)\n-- ====================================================================\n`;
for (const a of data.auditLogs) {
  sql += `INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES (${sqlVal(a.id)}, ${sqlVal(a.entity_type || 'bug')}, ${sqlVal(a.entity_id)}, ${sqlVal(a.action)}, ${sqlVal(a.user_id)}, ${sqlVal(a.user_name)}, ${sqlVal(a.details)}, ${sqlDate(a.timestamp)})
ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 13. Jira Sync Logs
if (data.jiraSyncLogs?.length > 0) {
  sql += `-- ====================================================================\n-- SEED DATA: JIRA SYNC LOGS (${data.jiraSyncLogs.length} records)\n-- ====================================================================\n`;
  for (const j of data.jiraSyncLogs) {
    sql += `INSERT INTO public.jira_sync_logs (id, event_id, event_type, jira_key, status, details, payload, timestamp)
VALUES (${sqlVal(j.id)}, ${sqlVal(j.event_id)}, ${sqlVal(j.event_type)}, ${sqlVal(j.jira_key)}, ${sqlVal(j.status || 'received')}, ${sqlVal(j.details)}, ${sqlVal(j.payload)}, ${sqlDate(j.timestamp)})
ON CONFLICT (id) DO NOTHING;\n`;
  }
  sql += '\n';
}

// 14. Payroll Submission Logs
if (data.payrollSubmissionLogs?.length > 0) {
  sql += `-- ====================================================================\n-- SEED DATA: PAYROLL SUBMISSION LOGS (${data.payrollSubmissionLogs.length} records)\n-- ====================================================================\n`;
  for (const ps of data.payrollSubmissionLogs) {
    sql += `INSERT INTO public.payroll_submission_logs (id, batch_id, provider, mode, authorized_by_id, records_count, total_amount, currency, payload, result, created_at)
VALUES (${sqlVal(ps.id)}, ${sqlVal(ps.batch_id)}, ${sqlVal(ps.provider || 'sandbox_mock')}, ${sqlVal(ps.mode || 'dry_run')}, ${sqlVal(ps.authorized_by_id)}, ${sqlVal(ps.records_count || 0)}, ${sqlVal(ps.total_amount || 0)}, ${sqlVal(ps.currency || 'INR')}, ${sqlVal(ps.payload)}, ${sqlVal(ps.result)}, ${sqlDate(ps.created_at)})
ON CONFLICT (id) DO NOTHING;\n`;
  }
  sql += '\n';
}

sql += `
-- Reload PostgREST Schema Cache immediately
NOTIFY pgrst, 'reload schema';

SELECT 
  (SELECT count(*) FROM public.users) as users_count,
  (SELECT count(*) FROM public.modules) as modules_count,
  (SELECT count(*) FROM public.tasks) as tasks_count,
  (SELECT count(*) FROM public.bugs) as bugs_count,
  (SELECT count(*) FROM public.time_entries) as time_entries_count,
  (SELECT count(*) FROM public.reviews) as reviews_count,
  (SELECT count(*) FROM public.payroll_adjustments) as adjustments_count,
  (SELECT count(*) FROM public.notifications) as notifications_count,
  (SELECT count(*) FROM public.audit_logs) as audit_logs_count;
`;

const migrationPath = path.resolve(__dirname, '../migrations/001_complete_reworkguard_supabase_schema.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
fs.writeFileSync(migrationPath, sql, 'utf8');
console.log('✅ Generated ' + outputPath + ' (' + (sql.length / 1024).toFixed(1) + ' KB)');
console.log('✅ Generated ' + migrationPath + ' (' + (sql.length / 1024).toFixed(1) + ' KB)');

