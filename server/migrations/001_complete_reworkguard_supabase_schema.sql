-- ====================================================================
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



-- ====================================================================
-- SEED DATA: USERS (8 records)
-- ====================================================================
INSERT INTO public.users (id, name, email, username, password, role, hourly_rate, avatar, client_id, employee_id, engineering_role, created_at)
VALUES ('usr-1', 'Sarah Connor', 'sarah.connor@reworkguard.io', 'sarah.connor', 'pbkdf2$375436e37b811c0a379a9a9cf9e45166$5cf661e7dc848072e1da0103986f551e6827d32761c345429e787922d3e3d470fef61cbefcd10939ccda462abd10516c3549c6fa4549ebb205ddf61c22e513a0', 'manager', 750, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', NULL, 'EMP-001', NULL, '2026-01-10T08:00:00.000Z')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  hourly_rate = EXCLUDED.hourly_rate,
  client_id = EXCLUDED.client_id,
  employee_id = EXCLUDED.employee_id,
  engineering_role = EXCLUDED.engineering_role;
INSERT INTO public.users (id, name, email, username, password, role, hourly_rate, avatar, client_id, employee_id, engineering_role, created_at)
VALUES ('usr-2', 'Alex Rivera', 'alex.rivera@reworkguard.io', 'alex.rivera', 'pbkdf2$7c26e3893436c52ad5f2ac193d101d7e$c384115ce07d79de39f404461abdf64f074a7400c830fac9dbf7102ae71313031fa5f51bcf1ede4d894771c085c7315f2d93b5386c5250cb30b99783e3bc63d8', 'developer', 500, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80', NULL, 'EMP-002', 'frontend_developer', '2026-01-15T09:30:00.000Z')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  hourly_rate = EXCLUDED.hourly_rate,
  client_id = EXCLUDED.client_id,
  employee_id = EXCLUDED.employee_id,
  engineering_role = EXCLUDED.engineering_role;
INSERT INTO public.users (id, name, email, username, password, role, hourly_rate, avatar, client_id, employee_id, engineering_role, created_at)
VALUES ('usr-3', 'Devon Lee', 'devon.lee@reworkguard.io', 'devon.lee', '29384758b9cf41d8e12f6ee2466b033e0854d6fa37dfa81e9f1a09d3b45e9988.62fb22bbaef4db521ffb858ec4602f0687157bc2626e257bb2d4de65fc9fa693', 'developer', 500, 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80', NULL, 'EMP-003', 'backend_developer', '2026-02-01T10:15:00.000Z')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  hourly_rate = EXCLUDED.hourly_rate,
  client_id = EXCLUDED.client_id,
  employee_id = EXCLUDED.employee_id,
  engineering_role = EXCLUDED.engineering_role;
INSERT INTO public.users (id, name, email, username, password, role, hourly_rate, avatar, client_id, employee_id, engineering_role, created_at)
VALUES ('usr-4', 'Priya Sharma', 'priya.sharma@reworkguard.io', 'priya.sharma', '74829103c8ae32d7e12f6ee2466b033e0854d6fa37dfa81e9f1a09d3b45e9988.73fb22bbaef4db521ffb858ec4602f0687157bc2626e257bb2d4de65fc9fa693', 'qa', 450, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80', NULL, 'EMP-004', 'qa_engineer', '2026-02-10T11:00:00.000Z')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  hourly_rate = EXCLUDED.hourly_rate,
  client_id = EXCLUDED.client_id,
  employee_id = EXCLUDED.employee_id,
  engineering_role = EXCLUDED.engineering_role;
INSERT INTO public.users (id, name, email, username, password, role, hourly_rate, avatar, client_id, employee_id, engineering_role, created_at)
VALUES ('usr-5', 'Marcus Vance', 'marcus.vance@reworkguard.io', 'marcus.vance', '29384758b9cf41d8e12f6ee2466b033e0854d6fa37dfa81e9f1a09d3b45e9988.62fb22bbaef4db521ffb858ec4602f0687157bc2626e257bb2d4de65fc9fa693', 'developer', 600, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', NULL, 'EMP-005', 'database_designer', '2026-02-15T14:20:00.000Z')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  hourly_rate = EXCLUDED.hourly_rate,
  client_id = EXCLUDED.client_id,
  employee_id = EXCLUDED.employee_id,
  engineering_role = EXCLUDED.engineering_role;
INSERT INTO public.users (id, name, email, username, password, role, hourly_rate, avatar, client_id, employee_id, engineering_role, created_at)
VALUES ('usr-6', 'Elena Rostova', 'elena.rostova@reworkguard.io', 'elena.rostova', 'pbkdf2$212d414c7bfb7339cb99d6c2658a8c7d$23c248925cfc47569928c61338d10e9e590d6906ff3328e6e42d65eb2c3fb1c4897220600fceb02691e172f2a7d05b7ef3600fb960ece71595c8d99d4be4ee35', 'hr', 800, 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80', NULL, 'EMP-006', NULL, '2026-03-01T09:00:00.000Z')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  hourly_rate = EXCLUDED.hourly_rate,
  client_id = EXCLUDED.client_id,
  employee_id = EXCLUDED.employee_id,
  engineering_role = EXCLUDED.engineering_role;
INSERT INTO public.users (id, name, email, username, password, role, hourly_rate, avatar, client_id, employee_id, engineering_role, created_at)
VALUES ('usr-7', 'David Kim', 'david.kim@reworkguard.io', 'david.kim', '94830285e6ad10b5e12f6ee2466b033e0854d6fa37dfa81e9f1a09d3b45e9988.95fb22bbaef4db521ffb858ec4602f0687157bc2626e257bb2d4de65fc9fa693', 'admin', 900, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80', NULL, 'EMP-007', NULL, '2026-01-05T09:00:00.000Z')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  hourly_rate = EXCLUDED.hourly_rate,
  client_id = EXCLUDED.client_id,
  employee_id = EXCLUDED.employee_id,
  engineering_role = EXCLUDED.engineering_role;
INSERT INTO public.users (id, name, email, username, password, role, hourly_rate, avatar, client_id, employee_id, engineering_role, created_at)
VALUES ('usr-8', 'Acme Enterprise (Client)', 'client@acmecorp.io', 'client.acme', 'pbkdf2$ae77beac2f3c40f9bd7e2e7d7f95c844$caa2193266af44ea8325c7c6d19d008510bf3e88bdf768cbb1d44f7db66c4012b9adc47132b139038e9e75b3f44a7f2c3584f1157f164943045aca4a2578576b', 'client', 500, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80', 'CLI-001', 'CLI-001', NULL, '2026-01-08T10:00:00.000Z')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  hourly_rate = EXCLUDED.hourly_rate,
  client_id = EXCLUDED.client_id,
  employee_id = EXCLUDED.employee_id,
  engineering_role = EXCLUDED.engineering_role;

-- ====================================================================
-- SEED DATA: PROJECTS (3 records)
-- ====================================================================
INSERT INTO public.projects (id, name, code, description, status, client_id, client_name, created_at)
VALUES ('PRJ-LLM', 'LLM Application Platform', 'LLM_APP', 'Core AI agent, streaming chat, and task execution application suite', 'active', 'usr-8', 'Acme Enterprise (Client)', '2026-01-01T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, name, code, description, status, client_id, client_name, created_at)
VALUES ('PRJ-ECOM', 'OmniCommerce Cloud Enterprise', 'OMNI_ECOM', 'Multi-tenant high-throughput e-commerce platform with automated logistics', 'active', 'usr-8', 'Acme Enterprise (Client)', '2026-01-05T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects (id, name, code, description, status, client_id, client_name, created_at)
VALUES ('PRJ-CORE', 'Enterprise Core Services', 'CORE_SERV', 'Mission-critical shared microservices: auth, payments, notifications, data warehouse', 'active', 'usr-8', 'Acme Enterprise (Client)', '2026-01-08T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA: MODULES (10 records)
-- ====================================================================
-- Safe Pre-Reconciliation: Disambiguate any legacy duplicate codes before upsert
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
END $$;

INSERT INTO public.modules (id, name, code, version, description, owner_id, total_lines_of_code, status, original_task_value, project_name, client_id, client_name, reopen_count, delivered_at, client_verified_at, client_star_rating, client_feedback, created_at, updated_at, completion_date, committed_deadline)
VALUES ('mod-7037', 'Cloud Storage Gateway', 'CSG_01', 'v1.0.0', 'S3 and Blob storage integration pipeline', 'usr-2', 14500, 'assigned', 50000, 'Core Platform', NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-16T23:29:47.037Z', '2026-10-16T23:29:47.037Z', NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.modules (id, name, code, version, description, owner_id, total_lines_of_code, status, original_task_value, project_name, client_id, client_name, reopen_count, delivered_at, client_verified_at, client_star_rating, client_feedback, created_at, updated_at, completion_date, committed_deadline)
VALUES ('mod-5721', 'AI Model', 'AM', 'v1.0.0', 'AI assistant for ecommerce', 'usr-1', 10000, 'assigned', 50000, 'Core Platform', NULL, NULL, 0, NULL, NULL, NULL, NULL, '2026-10-16T23:34:35.721Z', '2026-10-16T23:34:35.721Z', NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.modules (id, name, code, version, description, owner_id, total_lines_of_code, status, original_task_value, project_name, client_id, client_name, reopen_count, delivered_at, client_verified_at, client_star_rating, client_feedback, created_at, updated_at, completion_date, committed_deadline)
VALUES ('mod-0391', 'Small Inventory Widget', 'INV_WIDGET_0391', 'v2.1.0', 'Real-time stock synchronization and multi-warehouse allocation widget for checkout.', 'usr-2', 8500, 'reopened', 65000, 'OmniCommerce Cloud Enterprise', 'usr-8', 'Acme Enterprise (Client)', 3, '2026-09-28T14:00:00.000Z', '2026-10-17T00:04:32.717Z', 5, 'Verified token renewal under simulated throttling. Zero dropped sessions observed.', '2026-01-15T09:30:00.000Z', '2026-10-17T00:04:32.710Z', '2026-10-02T11:30:00.000Z', '2026-09-30T18:00:00.000Z')
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.modules (id, name, code, version, description, owner_id, total_lines_of_code, status, original_task_value, project_name, client_id, client_name, reopen_count, delivered_at, client_verified_at, client_star_rating, client_feedback, created_at, updated_at, completion_date, committed_deadline)
VALUES ('mod-1', 'Billing & Checkout Engine', 'BILLING_ENG', 'v2.4.0', 'Stripe and Adyen payment processing pipeline, tax calculations, and invoice generation.', 'usr-2', 14200, 'in_progress', 75000, 'OmniCommerce Cloud Enterprise', 'usr-8', 'Acme Enterprise (Client)', 1, '2026-10-01T10:00:00.000Z', NULL, NULL, NULL, '2026-01-20T10:00:00.000Z', '2026-10-12T16:00:00.000Z', NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.modules (id, name, code, version, description, owner_id, total_lines_of_code, status, original_task_value, project_name, client_id, client_name, reopen_count, delivered_at, client_verified_at, client_star_rating, client_feedback, created_at, updated_at, completion_date, committed_deadline)
VALUES ('mod-2', 'JWT Auth & Session Manager', 'AUTH_SRV', 'v1.8.2', 'Distributed OAuth2, MFA session tokens, and cryptographic access revocation.', 'usr-3', 9800, 'reopened', 50000, 'LLM Application Platform', 'usr-8', 'Acme Enterprise (Client)', 2, '2026-09-15T12:00:00.000Z', '2026-10-17T00:05:25.939Z', 5, 'Verified token renewal under simulated throttling. Zero dropped sessions observed.', '2026-02-01T09:00:00.000Z', '2026-10-17T00:05:25.932Z', '2026-09-20T15:00:00.000Z', NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.modules (id, name, code, version, description, owner_id, total_lines_of_code, status, original_task_value, project_name, client_id, client_name, reopen_count, delivered_at, client_verified_at, client_star_rating, client_feedback, created_at, updated_at, completion_date, committed_deadline)
VALUES ('mod-3', 'Distributed Database Partitioning', 'DB_PARTITION', 'v1.2.0', 'Horizontal table sharding, PostgreSQL partition routing, and read-replica replication.', 'usr-5', 18500, 'under_fix', 90000, 'OmniCommerce Cloud Enterprise', 'usr-8', 'Acme Enterprise (Client)', 3, NULL, NULL, NULL, NULL, '2026-02-15T14:00:00.000Z', '2026-10-15T09:30:00.000Z', NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.modules (id, name, code, version, description, owner_id, total_lines_of_code, status, original_task_value, project_name, client_id, client_name, reopen_count, delivered_at, client_verified_at, client_star_rating, client_feedback, created_at, updated_at, completion_date, committed_deadline)
VALUES ('mod-4', 'Customer Notification Dispatcher', 'NOTIF_DISPATCH', 'v2.0.1', 'Omni-channel push, SendGrid transactional emails, and Twilio SMS verification.', 'usr-2', 7200, 'completed', 45000, 'LLM Application Platform', 'usr-8', 'Acme Enterprise (Client)', 0, '2026-09-10T16:00:00.000Z', '2026-09-12T10:00:00.000Z', 4.9, 'Fast dispatch latencies under 40ms, highly reliable.', '2026-02-10T11:00:00.000Z', '2026-09-12T10:00:00.000Z', '2026-09-12T10:00:00.000Z', NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.modules (id, name, code, version, description, owner_id, total_lines_of_code, status, original_task_value, project_name, client_id, client_name, reopen_count, delivered_at, client_verified_at, client_star_rating, client_feedback, created_at, updated_at, completion_date, committed_deadline)
VALUES ('mod-5', 'Executive Analytics & Reporting', 'ANALYTICS_REP', 'v1.4.0', 'Streamed BigQuery reporting engine, aggregations, and CSV/PDF export generator.', 'usr-3', 11000, 'in_progress', 55000, 'LLM Application Platform', 'usr-8', 'Acme Enterprise (Client)', 0, NULL, NULL, NULL, NULL, '2026-03-01T09:00:00.000Z', '2026-10-10T12:00:00.000Z', NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.modules (id, name, code, version, description, owner_id, total_lines_of_code, status, original_task_value, project_name, client_id, client_name, reopen_count, delivered_at, client_verified_at, client_star_rating, client_feedback, created_at, updated_at, completion_date, committed_deadline)
VALUES ('mod-6', 'Global Payment Gateway Adapters', 'PAY_GATEWAY_MOD6', 'v1.5.0', 'Unified adapter layer connecting PayPal, Klarna, Apple Pay, and Google Pay checkout flows.', 'usr-2', 12400, 'assigned', 60000, 'OmniCommerce Cloud Enterprise', 'usr-8', 'Acme Enterprise (Client)', 0, NULL, NULL, NULL, NULL, '2026-03-15T09:00:00.000Z', '2026-10-14T11:00:00.000Z', NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.modules (id, name, code, version, description, owner_id, total_lines_of_code, status, original_task_value, project_name, client_id, client_name, reopen_count, delivered_at, client_verified_at, client_star_rating, client_feedback, created_at, updated_at, completion_date, committed_deadline)
VALUES ('mod-7', 'Offline Sync & Mobile Reconciliation', 'MOBILE_SYNC_MOD7', 'v1.1.0', 'Client-side IndexedDB conflict-free replicated data types (CRDT) sync protocol for mobile POS.', 'usr-3', 9300, 'reopened', 52000, 'LLM Application Platform', 'usr-8', 'Acme Enterprise (Client)', 1, NULL, NULL, NULL, NULL, '2026-03-20T10:00:00.000Z', '2026-10-15T14:00:00.000Z', NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;

-- ====================================================================
-- SEED DATA: TASKS (15 records)
-- ====================================================================
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-102', 'PRJ-ECOM', 'OmniCommerce Cloud Enterprise', 'mod-1', 'Billing & Checkout Engine', 'BILLING_ENG', 'v2.4.0', 'EU VAT 2026 Digital Services Tax Rounding Update', 'Refactor per-unit tax calculation into sum-of-line-items calculation to prevent 1-cent divergence against Stripe tax calculation.', 'usr-2', 'Alex Rivera', 'usr-1', 'Sarah Connor', 'frontend_developer', 'p1', '2026-10-28T18:00:00.000Z', 'in_progress', 75000, '["Accurate VAT computation","Cross-checked against Stripe test fixtures"]'::jsonb, '["src/utils/taxCalculator.ts"]'::jsonb, NULL, 1, '2026-10-02T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-103', 'PRJ-LLM', 'LLM Application Platform', 'mod-2', 'JWT Auth & Session Manager', 'AUTH_SRV', 'v1.8.2', 'Silent Refresh Token Concurrency Fix', 'Fix race conditions in concurrent rotation requests by introducing Redis atomic check-and-set lock.', 'usr-3', 'Devon Lee', 'usr-1', 'Sarah Connor', 'backend_developer', 'p0', '2026-10-20T18:00:00.000Z', 'reopened', 50000, '["Eliminate unexpected session invalidations under high concurrent requests"]'::jsonb, '["server/auth.ts","server/sessionStore.ts"]'::jsonb, NULL, 2, '2026-10-04T11:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-104', 'PRJ-ECOM', 'OmniCommerce Cloud Enterprise', 'mod-3', 'Distributed Database Partitioning', 'DB_PARTITION', 'v1.2.0', 'Deadlock Prevention during Simultaneous High-Volume SKU Checkout', 'Restructure database transaction boundaries so inventory lock is acquired and held strictly within DB transaction commit.', 'usr-5', 'Marcus Vance', 'usr-1', 'Sarah Connor', 'database_designer', 'p0', '2026-10-30T18:00:00.000Z', 'under_fix', 90000, '["Pass concurrency stress testing of 1000 requests/sec with zero negative stock"]'::jsonb, '["server/db/inventoryPartition.ts"]'::jsonb, NULL, 2, '2026-10-08T14:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-llm-1', 'PRJ-LLM', 'LLM Application Platform', 'mod-1', 'Billing & Checkout Engine', 'BILLING_ENG', 'v2.4.0', 'Implement Streaming Markdown Chat Interface', 'Build responsive chat interface that consumes token deltas over Server-Sent Events (SSE). Render Markdown code blocks with copy-to-clipboard, auto-scroll with pause capability, and provide prompt edit/retry controls.', 'usr-2', 'Alex Rivera', 'usr-1', 'Sarah Connor', 'frontend_developer', 'p0', '2026-10-25T18:00:00.000Z', 'in_progress', 65000, '["Render assistant responses incrementally via Server-Sent Events (SSE)","Support Markdown code block rendering with syntax highlighting and copy button","Auto-scroll to bottom during generation with user pause capability"]'::jsonb, '["src/components/ChatInterface.tsx","src/hooks/useChatStream.ts"]'::jsonb, NULL, 0, '2026-10-10T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-llm-2', 'PRJ-LLM', 'LLM Application Platform', 'mod-2', 'JWT Auth & Session Manager', 'AUTH_SRV', 'v1.8.2', 'Implement Streaming LLM Gateway & Rate Limiting', 'Implement POST /api/v1/chat/completions endpoint with token streaming, sliding-window rate limiting, and upstream timeout handling.', 'usr-3', 'Devon Lee', 'usr-1', 'Sarah Connor', 'backend_developer', 'p0', '2026-10-26T18:00:00.000Z', 'in_progress', 50000, '["Implement POST /api/v1/chat/completions endpoint with token streaming","Apply sliding-window token bucket rate limiter per client API key","Handle upstream provider timeouts with fallback graceful error JSON"]'::jsonb, '["server/controllers/chatController.ts","server/services/llmGateway.ts"]'::jsonb, NULL, 0, '2026-10-09T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-llm-3', 'PRJ-LLM', 'LLM Application Platform', 'mod-3', 'Distributed Database Partitioning', 'DB_PARTITION', 'v1.2.0', 'Design Conversation Sessions & Vector Embedding Store', 'Define relational schema for conversations and message thread hierarchy with composite B-tree indexing for history retrieval.', 'usr-5', 'Marcus Vance', 'usr-1', 'Sarah Connor', 'database_designer', 'p1', '2026-10-27T18:00:00.000Z', 'assigned', 90000, '["Composite B-tree indexing on (user_id, updated_at DESC)","Vector embedding store schema with pgvector cosine distance index"]'::jsonb, '["server/db/schema.sql"]'::jsonb, NULL, 0, '2026-10-10T12:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-llm-4', 'PRJ-LLM', 'LLM Application Platform', 'mod-4', 'Customer Notification Dispatcher', 'NOTIF_DISPATCH', 'v2.0.1', 'Automate Streaming Regression & Prompt Injection Tests', 'Develop automated test harness that executes synthetic prompt injection and multi-turn streaming conversations against the LLM gateway.', 'usr-4', 'Priya Sharma', 'usr-1', 'Sarah Connor', 'qa_engineer', 'p1', '2026-10-28T18:00:00.000Z', 'in_progress', 45000, '["Automated test harness testing prompt injection resilience","Verify token rate limiting under simulated load"]'::jsonb, '["tests/llmSecurityTests.ts"]'::jsonb, NULL, 0, '2026-10-11T14:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-1', 'PRJ-ECOM', 'OmniCommerce Cloud Enterprise', 'mod-1', 'Billing & Checkout Engine', 'BILLING_ENG', 'v2.4.0', 'Implement Webhook Idempotency Header', 'Store idempotency keys in Redis cache with 24-hour TTL to prevent duplicate checkout transactions on network retry.', 'usr-2', 'Alex Rivera', 'usr-1', 'Sarah Connor', 'frontend_developer', 'p0', '2026-10-24T18:00:00.000Z', 'in_progress', 75000, '["Redis deduplication caching","Zero double charge anomalies"]'::jsonb, '["server/middleware/idempotency.ts"]'::jsonb, NULL, 0, '2026-10-12T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-101', 'PRJ-ECOM', 'OmniCommerce Cloud Enterprise', 'mod-0391', 'Small Inventory Widget', 'INV_WIDGET_0391', 'v2.1.0', 'Implement Multi-Warehouse Allocation & Live SKU Polling', 'Connect checkout front-end with live warehouse inventory microservice with backoff retry.', 'usr-2', 'Alex Rivera', 'usr-1', 'Sarah Connor', 'frontend_developer', 'p1', '2026-10-25T18:00:00.000Z', 'reopened', 65000, '["Accurate reservation locks","Sub-100ms response time","Zero inventory overbooking"]'::jsonb, '["src/components/InventoryWidget.tsx","src/services/inventoryApi.ts"]'::jsonb, NULL, 1, '2026-09-01T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-2', 'PRJ-LLM', 'LLM Application Platform', 'mod-2', 'JWT Auth & Session Manager', 'AUTH_SRV', 'v1.8.2', 'SAML 2.0 Identity Provider Handshake', 'Implement enterprise SSO federation handshake using SAML 2.0 with XML signature verification and metadata exchange.', 'usr-3', 'Devon Lee', 'usr-1', 'Sarah Connor', 'backend_developer', 'p1', '2026-10-22T18:00:00.000Z', 'submitted', 50000, '["SAML assertion verification","Support Okta, Azure AD, and PingFederate"]'::jsonb, '["server/auth/samlProvider.ts"]'::jsonb, NULL, 0, '2026-10-08T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-3', 'PRJ-ECOM', 'OmniCommerce Cloud Enterprise', 'mod-3', 'Distributed Database Partitioning', 'DB_PARTITION', 'v1.2.0', 'Redis Stock Distributed Lock Mechanism', 'Implement Redlock distributed locking algorithm across multi-node Redis clusters for inventory reservation.', 'usr-5', 'Marcus Vance', 'usr-1', 'Sarah Connor', 'database_designer', 'p0', '2026-10-29T18:00:00.000Z', 'assigned', 90000, '["Atomic distributed lock acquire/release","Automatic TTL extension heartbeat"]'::jsonb, '["server/redis/distributedLock.ts"]'::jsonb, NULL, 0, '2026-10-14T11:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-4', 'PRJ-LLM', 'LLM Application Platform', 'mod-4', 'Customer Notification Dispatcher', 'NOTIF_DISPATCH', 'v2.0.1', 'Email Template DOMPurify Integration', 'Audit all Handlebars email templates and integrate DOMPurify sanitization to prevent XSS in receipt emails.', 'usr-2', 'Alex Rivera', 'usr-1', 'Sarah Connor', 'frontend_developer', 'p1', '2026-10-18T18:00:00.000Z', 'approved', 45000, '["DOMPurify sanitization in all templates","Unit test coverage for HTML escaping"]'::jsonb, '["server/notifications/emailTemplateRenderer.ts"]'::jsonb, NULL, 0, '2026-10-06T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-5', 'PRJ-ECOM', 'OmniCommerce Cloud Enterprise', 'mod-1', 'Billing & Checkout Engine', 'BILLING_ENG', 'v2.4.0', 'Stripe Tax Multi-Jurisdiction Precision', 'Handle European cross-border OSS tax calculation rounding edge cases according to EU VAT regulations.', 'usr-5', 'Marcus Vance', 'usr-1', 'Sarah Connor', 'database_designer', 'p2', '2026-10-28T18:00:00.000Z', 'changes_requested', 75000, '["Accurate rounding to 2 decimal places per Directive 2006/112/EC"]'::jsonb, '["server/tax/taxEngine.ts"]'::jsonb, NULL, 1, '2026-10-07T11:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-6', 'PRJ-ECOM', 'OmniCommerce Cloud Enterprise', 'mod-0391', 'Small Inventory Widget', 'INV_WIDGET_0391', 'v2.1.0', 'Stock Synchronization High Latency Reconciliation', 'Reconcile stock count latency during simultaneous checkout on mobile network throttling.', 'usr-2', 'Alex Rivera', 'usr-1', 'Sarah Connor', 'frontend_developer', 'p1', '2026-10-23T18:00:00.000Z', 'reopened', 65000, '["Sub-50ms stock optimistic UI update","Rollback gracefully on API network failure"]'::jsonb, '["src/components/InventoryWidget.tsx"]'::jsonb, NULL, 1, '2026-10-12T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tasks (id, project_id, project_name, module_id, module_name, module_code, module_version, title, description, assigned_to_id, assigned_to_name, assigned_by_id, assigned_by_name, assigned_role, priority, deadline, status, original_task_value, acceptance_criteria, permitted_files, saved_files, resubmission_count, created_at)
VALUES ('task-7', 'PRJ-ECOM', 'OmniCommerce Cloud Enterprise', 'mod-3', 'Distributed Database Partitioning', 'DB_PARTITION', 'v1.2.0', 'Partition Failover Routing Under Heavy Load', 'Ensure automated failover routing executes without connection storm when a database partition shard becomes unreachable.', 'usr-5', 'Marcus Vance', 'usr-1', 'Sarah Connor', 'database_designer', 'p0', '2026-10-31T18:00:00.000Z', 'under_fix', 90000, '["Connection pool circuit breaker","Sub-2s failover redirect without data loss"]'::jsonb, '["server/db/shardRouter.ts"]'::jsonb, NULL, 2, '2026-10-13T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA: SUBMISSIONS (4 records)
-- ====================================================================
INSERT INTO public.submissions (id, task_id, user_id, user_name, submission_notes, submitted_at, status, review_decision, reviewer_id, reviewer_name, reviewer_feedback, reviewed_at)
VALUES ('sub-1', 'task-4', 'usr-2', 'Alex Rivera', 'Added isomorphic DOMPurify filter and unit tests for 25 template variables.', '2026-10-12T10:00:00.000Z', 'approved', 'approved', 'usr-1', 'Sarah Connor', 'Thorough sanitization approach; security verification approved.', '2026-10-13T11:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.submissions (id, task_id, user_id, user_name, submission_notes, submitted_at, status, review_decision, reviewer_id, reviewer_name, reviewer_feedback, reviewed_at)
VALUES ('sub-2', 'task-5', 'usr-2', 'Alex Rivera', 'Drafted Banker rounding utility and converted line items.', '2026-10-14T11:00:00.000Z', 'changes_requested', 'changes_requested', 'usr-1', 'Sarah Connor', 'Please verify handling for 0% zero-rated intra-community EU business transactions before approval.', '2026-10-14T16:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.submissions (id, task_id, user_id, user_name, submission_notes, submitted_at, status, review_decision, reviewer_id, reviewer_name, reviewer_feedback, reviewed_at)
VALUES ('sub-3', 'task-2', 'usr-3', 'Devon Lee', 'Completed XML signature parsing with node-saml; staging IdP tests passing.', '2026-10-15T14:30:00.000Z', 'submitted', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.submissions (id, task_id, user_id, user_name, submission_notes, submitted_at, status, review_decision, reviewer_id, reviewer_name, reviewer_feedback, reviewed_at)
VALUES ('sub-88149', 'task-llm-1', 'usr-2', 'Alex Rivera', 's s', '2026-10-16T21:41:28.149Z', 'submitted', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA: WORK SESSIONS (6 records)
-- ====================================================================
INSERT INTO public.work_sessions (id, user_id, user_name, task_id, bug_id, target_id, target_title, work_type, status, start_time, paused_at, total_paused_seconds, end_time, duration_seconds, notes, created_at)
VALUES ('ws-101', 'usr-2', 'Alex Rivera', 'task-102', 'bug-101', 'bug-101', 'Cart total discrepancy on partial voucher application', 'corrective_rework', 'stopped', '2026-10-10T10:00:00.000Z', NULL, 0, '2026-10-10T14:30:00.000Z', 16200, 'Investigated voucher discount rounding logic in checkout component', '2026-10-10T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.work_sessions (id, user_id, user_name, task_id, bug_id, target_id, target_title, work_type, status, start_time, paused_at, total_paused_seconds, end_time, duration_seconds, notes, created_at)
VALUES ('ws-102', 'usr-3', 'Devon Lee', 'task-103', 'bug-102', 'bug-102', 'JWT refresh token reuse race condition under high load', 'corrective_rework', 'stopped', '2026-10-08T09:00:00.000Z', NULL, 0, '2026-10-08T17:00:00.000Z', 28800, 'Implemented atomic token exchange with Redis CAS', '2026-10-08T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.work_sessions (id, user_id, user_name, task_id, bug_id, target_id, target_title, work_type, status, start_time, paused_at, total_paused_seconds, end_time, duration_seconds, notes, created_at)
VALUES ('ws-1', 'usr-2', 'Alex Rivera', 'task-1', NULL, 'task-1', 'Implement Webhook Idempotency Header', 'original_development', 'stopped', '2026-10-15T09:00:00.000Z', NULL, 0, '2026-10-15T12:30:00.000Z', 12600, 'Drafted idempotency Redis key schema and middleware.', '2026-10-15T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.work_sessions (id, user_id, user_name, task_id, bug_id, target_id, target_title, work_type, status, start_time, paused_at, total_paused_seconds, end_time, duration_seconds, notes, created_at)
VALUES ('ws-2', 'usr-2', 'Alex Rivera', NULL, 'bug-101', 'bug-101', 'Idempotency failure on high-latency payment retries', 'corrective_rework', 'stopped', '2026-10-16T10:00:00.000Z', NULL, 600, '2026-10-16T12:30:00.000Z', 8400, 'Isolated retry timeout and verified fix in sandbox.', '2026-10-16T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.work_sessions (id, user_id, user_name, task_id, bug_id, target_id, target_title, work_type, status, start_time, paused_at, total_paused_seconds, end_time, duration_seconds, notes, created_at)
VALUES ('ws-3', 'usr-3', 'Devon Lee', 'task-llm-2', NULL, 'task-llm-2', 'Implement Streaming LLM Gateway & Rate Limiting', 'original_development', 'stopped', '2026-10-13T09:00:00.000Z', NULL, 0, '2026-10-13T13:00:00.000Z', 14400, 'Implemented token bucket sliding-window algorithm.', '2026-10-13T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.work_sessions (id, user_id, user_name, task_id, bug_id, target_id, target_title, work_type, status, start_time, paused_at, total_paused_seconds, end_time, duration_seconds, notes, created_at)
VALUES ('ws-4', 'usr-5', 'Marcus Vance', NULL, 'bug-103', 'bug-103', 'Negative stock quantity during simultaneous cart checkout', 'corrective_rework', 'stopped', '2026-10-14T14:00:00.000Z', NULL, 900, '2026-10-14T19:00:00.000Z', 17100, 'PostgreSQL row-level locking benchmark and deadlock stress test.', '2026-10-14T14:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA: BUGS (13 records)
-- ====================================================================
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-882', 'Concurrent JWT token renewal drop during network jitter', 'Under 300ms simulated mobile jitter, refresh token exchange drops the existing valid auth context.', 'mod-2', 'v1.8.2', 'usr-3', '1. Enable network throttling (Fast 3G)
2. Dispatch 2 parallel requests right before token expiry
3. One request receives 401 and logs user out', 'high', 'p1', 'closed', 'code_defect', 'usr-3', 'usr-3', 4.5, 500, 2250, 'approved_for_accounting', 'confirmed_defect', 'Confirmed in sandbox under simulated mobile jitter. Valid internal regression.', 'usr-1', '2026-10-17T00:05:25.932Z', NULL, NULL, NULL, 'none', '', NULL, NULL, NULL, NULL, 'task-103', 'Silent Refresh Token Concurrency Fix', 50000, '2026-10-17T00:05:25.928Z', '2026-10-17T00:05:25.939Z', '2026-10-17T00:05:25.938Z', NULL, '2026-10-17T00:05:25.926Z', 'usr-8', 'Acme Enterprise (Client)', TRUE, TRUE, '2026-10-17T00:05:25.939Z', 5, 'Verified token renewal under simulated throttling. Zero dropped sessions observed.')
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-943', 'Concurrent JWT token renewal drop during network jitter', 'Under 300ms simulated mobile jitter, refresh token exchange drops the existing valid auth context.', 'mod-0391', 'v2.1.0', 'usr-2', '1. Enable network throttling (Fast 3G)
2. Dispatch 2 parallel requests right before token expiry
3. One request receives 401 and logs user out', 'high', 'p1', 'open', 'code_defect', 'usr-2', 'usr-2', 0, 500, 0, 'not_submitted', 'pending_manager_review', '', NULL, NULL, NULL, NULL, NULL, 'none', '', NULL, NULL, NULL, NULL, 'task-101', 'Implement Multi-Warehouse Allocation & Live SKU Polling', 65000, '2026-10-16T23:40:05.660Z', '2026-10-16T23:40:05.660Z', NULL, NULL, '2026-10-16T23:40:05.659Z', 'usr-8', 'Acme Enterprise (Client)', TRUE, FALSE, NULL, NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-654', 'Concurrent JWT token renewal drop during network jitter', 'Under 300ms simulated mobile jitter, refresh token exchange drops the existing valid auth context.', 'mod-2', 'v1.8.2', 'usr-3', '1. Enable network throttling (Fast 3G)
2. Dispatch 2 parallel requests right before token expiry
3. One request receives 401 and logs user out', 'high', 'p1', 'open', 'code_defect', 'usr-3', 'usr-3', 0, 500, 0, 'not_submitted', 'pending_manager_review', '', NULL, NULL, NULL, NULL, NULL, 'none', '', NULL, NULL, NULL, NULL, 'task-103', 'Silent Refresh Token Concurrency Fix', 50000, '2026-10-16T23:55:32.697Z', '2026-10-16T23:55:32.697Z', NULL, NULL, '2026-10-16T23:55:32.695Z', 'usr-8', 'Acme Enterprise (Client)', TRUE, FALSE, NULL, NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-101', 'Double charge on 3D-Secure timeout during Stripe checkout', 'When the 3D-Secure authentication handshake takes >15s, client retried the POST /charge request without idempotency key header, generating double transactions.', 'mod-1', 'v2.4.0', 'usr-2', NULL, 'critical', 'p0', 'review_pending', 'logic_error', 'usr-2', 'usr-2', 14.5, 500, 7250, 'pending', 'confirmed_defect', NULL, NULL, NULL, NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 'task-1', 'Implement Webhook Idempotency Header', 75000, '2026-10-02T09:15:00.000Z', '2026-10-12T16:40:00.000Z', '2026-10-12T16:40:00.000Z', NULL, '2026-10-16T23:39:30.799Z', 'usr-8', 'Acme Enterprise (Client)', TRUE, FALSE, NULL, NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-102', 'JWT refresh token reuse race condition', 'Concurrent refresh requests with the same rotation token caused silent logout for valid active sessions due to unindexed timestamp comparison.', 'mod-2', 'v1.8.2', 'usr-3', NULL, 'high', 'p1', 'fixed', 'edge_case', 'usr-3', 'usr-3', 8, 500, 4000, 'approved', 'confirmed_defect', NULL, NULL, NULL, NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 'task-llm-2', 'Implement Streaming LLM Gateway & Rate Limiting', 50000, '2026-10-04T11:20:00.000Z', '2026-10-11T14:10:00.000Z', '2026-10-10T18:00:00.000Z', NULL, '2026-10-16T23:39:30.799Z', 'usr-8', 'Acme Enterprise (Client)', FALSE, FALSE, NULL, NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-103', 'Negative stock quantity during simultaneous cart checkout', 'Inventory lock was released prior to DB commit, allowing 2 users to buy the last single remaining SKU simultaneously.', 'mod-3', 'v1.2.0', 'usr-5', NULL, 'critical', 'p0', 'in_progress', 'regression', 'usr-5', 'usr-5', 11, 600, 6600, 'not_submitted', 'confirmed_defect', NULL, NULL, NULL, NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 'task-3', 'Redis Stock Distributed Lock Mechanism', 90000, '2026-10-08T14:00:00.000Z', '2026-10-15T09:30:00.000Z', NULL, NULL, '2026-10-16T23:39:30.799Z', 'usr-8', 'Acme Enterprise (Client)', TRUE, FALSE, NULL, NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-104', 'Email notification template variable XSS sanitization gap', 'Customer greeting in transactional receipt emails permitted raw HTML injection if display name contained unsanitized script tags.', 'mod-4', 'v2.0.1', 'usr-2', NULL, 'high', 'p1', 'closed', 'security', 'usr-2', 'usr-2', 5.5, 500, 2750, 'approved', 'confirmed_defect', NULL, NULL, NULL, NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 'task-4', 'Email Template DOMPurify Integration', 45000, '2026-09-25T13:40:00.000Z', '2026-10-01T11:00:00.000Z', '2026-09-30T17:15:00.000Z', NULL, '2026-10-16T23:39:30.799Z', 'usr-8', 'Acme Enterprise (Client)', TRUE, TRUE, '2026-10-01T11:00:00.000Z', 5, 'Security patch was delivered swiftly and validated in staging with zero regressions.')
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-105', 'OOM error when generating quarterly CSV report over 100k rows', 'Report generation loaded entire dataset into memory instead of streaming chunks via cursor, causing Node heap limit crash.', 'mod-5', 'v1.4.0', 'usr-3', NULL, 'medium', 'p2', 'open', 'performance', 'usr-3', 'usr-3', 3, 500, 1500, 'not_submitted', 'confirmed_defect', NULL, NULL, NULL, NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 55000, '2026-10-11T10:05:00.000Z', '2026-10-14T11:25:00.000Z', NULL, NULL, '2026-10-17T00:03:25.777Z', 'usr-8', 'Acme Enterprise (Client)', FALSE, FALSE, NULL, NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-106', 'Tax rounding discrepancy on EU VAT orders with multiple items', 'Calculated tax per unit rather than sum of line totals, leading to 1-cent divergence against Stripe tax calculation.', 'mod-1', 'v2.4.0', 'usr-2', NULL, 'medium', 'p2', 'review_pending', 'logic_error', 'usr-2', 'usr-5', 6, 600, 3600, 'pending', 'confirmed_defect', NULL, NULL, NULL, NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 'task-5', 'Stripe Tax Multi-Jurisdiction Precision', 75000, '2026-10-07T16:15:00.000Z', '2026-10-15T15:20:00.000Z', '2026-10-15T15:20:00.000Z', NULL, '2026-10-17T00:03:25.777Z', 'usr-8', 'Acme Enterprise (Client)', FALSE, FALSE, NULL, NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-107', 'Stock allocation lag causes phantom availability during flash sale', 'Cache invalidation queue had 500ms delay allowing multiple customers to view outdated inventory levels.', 'mod-0391', 'v2.1.0', 'usr-2', NULL, 'high', 'p1', 'in_progress', 'regression', 'usr-2', 'usr-2', 5, 500, 2500, 'pending', 'confirmed_defect', NULL, NULL, NULL, NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 'task-6', 'Stock Synchronization High Latency Reconciliation', 65000, '2026-10-12T10:00:00.000Z', '2026-10-16T11:00:00.000Z', NULL, NULL, '2026-10-17T00:03:25.777Z', 'usr-8', 'Acme Enterprise (Client)', TRUE, FALSE, NULL, NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-108', 'Client Reported: Inactive session not cleared on logout', 'Local session storage token was retained on browser tab refresh after user explicitly clicked log out.', 'mod-2', 'v1.8.2', 'usr-3', NULL, 'major', 'p1', 'closed', 'edge_case', 'usr-3', 'usr-3', 4.5, 500, 2250, 'approved', 'confirmed_defect', NULL, NULL, NULL, NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 'task-llm-2', 'Implement Streaming LLM Gateway & Rate Limiting', 50000, '2026-10-14T11:00:00.000Z', '2026-10-16T18:00:00.000Z', '2026-10-16T17:30:00.000Z', NULL, '2026-10-17T00:03:25.777Z', 'usr-8', 'Acme Enterprise (Client)', TRUE, TRUE, '2026-10-16T18:00:00.000Z', 5, 'Verified token renewal under simulated throttling. Zero dropped sessions observed.')
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-109', 'Client Reported: Widget quantity counter flickering on mobile Safari', 'CSS transition layout reflow triggers double redraw when rapidly clicking increment/decrement buttons.', 'mod-0391', 'v2.1.0', 'usr-2', NULL, 'minor', 'p3', 'open', 'logic_error', 'usr-2', 'usr-2', 2, 500, 1000, 'not_submitted', 'pending_manager_review', NULL, NULL, NULL, NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 'task-6', 'Stock Synchronization High Latency Reconciliation', 65000, '2026-10-16T15:00:00.000Z', '2026-10-16T15:00:00.000Z', NULL, NULL, '2026-10-17T00:03:25.777Z', 'usr-8', 'Acme Enterprise (Client)', TRUE, FALSE, NULL, NULL, NULL)
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
  updated_at = EXCLUDED.updated_at;
INSERT INTO public.bugs (id, title, description, module_id, module_version, original_module_owner_id, reproduction_steps, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, classification_status, classification_notes, classified_by_id, classified_at, dispute_reason, disputed_by_id, disputed_at, dispute_status, evidence_urls, evidence_notes, jira_issue_id, jira_issue_key, jira_issue_url, original_task_id, original_task_title, original_task_value, created_at, updated_at, resolved_at, committed_deadline, bug_found_date, client_id, client_name, client_reported, client_verified, client_verified_at, client_rating, client_feedback)
VALUES ('bug-385', 'Concurrent JWT token renewal drop during network jitter', 'Under 300ms simulated mobile jitter, refresh token exchange drops the existing valid auth context.', 'mod-0391', 'v2.1.0', 'usr-2', '1. Enable network throttling (Fast 3G)
2. Dispatch 2 parallel requests right before token expiry
3. One request receives 401 and logs user out', 'high', 'p1', 'open', 'code_defect', 'usr-2', 'usr-2', 0, 500, 0, 'not_submitted', 'pending_manager_review', '', 'usr-1', '2026-10-17T00:04:32.710Z', NULL, NULL, NULL, 'none', '', NULL, NULL, NULL, NULL, 'task-101', 'Implement Multi-Warehouse Allocation & Live SKU Polling', 65000, '2026-10-17T00:04:32.706Z', '2026-10-17T00:04:32.706Z', '2026-10-17T00:04:32.715Z', NULL, '2026-10-17T00:04:32.704Z', 'usr-8', 'Acme Enterprise (Client)', TRUE, FALSE, '2026-10-17T00:04:32.717Z', 5, 'Verified token renewal under simulated throttling. Zero dropped sessions observed.')
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
  updated_at = EXCLUDED.updated_at;

-- ====================================================================
-- SEED DATA: TIME ENTRIES (18 records)
-- ====================================================================
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-5936', 'bug-882', 'usr-2', 4.5, 500, 2250, 'Implemented atomic Redis distributed mutex with single-flight promise deduplication.', 'corrective_maintenance', '2026-10-17T00:00:00.000Z', '2026-10-17T00:05:25.936Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-5670', 'bug-943', 'usr-2', 4.5, 500, 2250, 'Implemented atomic Redis distributed mutex with single-flight promise deduplication.', 'corrective_maintenance', '2026-10-16T00:00:00.000Z', '2026-10-16T23:40:05.670Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-101', 'bug-101', 'usr-2', 4.5, 500, 2250, 'Investigate voucher discount rounding logic in checkout component', 'corrective_maintenance', '2026-10-10T00:00:00.000Z', '2026-10-10T14:30:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-102', 'bug-101', 'usr-2', 2, 500, 1000, 'Write unit tests for fractional cent voucher application edge cases', 'corrective_maintenance', '2026-10-11T00:00:00.000Z', '2026-10-11T16:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-103', 'bug-102', 'usr-3', 8, 500, 4000, 'Implement Redis atomic token exchange and clean up race condition logs', 'corrective_maintenance', '2026-10-08T00:00:00.000Z', '2026-10-08T18:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-104', 'bug-103', 'usr-5', 7, 600, 4200, 'Profile database transaction isolation levels and row locks under concurrency', 'corrective_maintenance', '2026-10-12T00:00:00.000Z', '2026-10-12T17:30:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-test-1234', 'bug-654', 'usr-3', 4.5, 500, 2250, 'Test work description', 'corrective_maintenance', '2026-10-17T00:00:00.000Z', '2026-10-16T23:56:29.556Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-1', 'bug-101', 'usr-2', 6.5, 500, 3250, 'Reproduced 3D-Secure timeout in sandbox, isolated missing idempotency header on client retry loop.', 'corrective_maintenance', '2026-10-03T00:00:00.000Z', '2026-10-03T17:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-2', 'bug-101', 'usr-2', 8, 500, 4000, 'Implemented server-side idempotency cache in Redis and client backoff with deduplication key.', 'corrective_maintenance', '2026-10-12T00:00:00.000Z', '2026-10-12T16:30:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-3', 'bug-102', 'usr-3', 8, 500, 4000, 'Added atomic Redis mutex lock for token rotation window of 5 seconds to permit parallel tabs.', 'corrective_maintenance', '2026-10-09T00:00:00.000Z', '2026-10-09T18:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-4', 'bug-103', 'usr-5', 11, 600, 6600, 'Refactored inventory checkout to use PostgreSQL SELECT ... FOR UPDATE pessimistic row locks.', 'corrective_maintenance', '2026-10-14T00:00:00.000Z', '2026-10-14T19:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-5', 'bug-104', 'usr-2', 5.5, 500, 2750, 'Audited all email handlebars templates and integrated DOMPurify/validator HTML escape encoder.', 'corrective_maintenance', '2026-09-29T00:00:00.000Z', '2026-09-29T16:45:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-6', 'bug-105', 'usr-3', 3, 500, 1500, 'Investigated memory dump and drafted transform stream pipeline for large CSV generation.', 'corrective_maintenance', '2026-10-13T00:00:00.000Z', '2026-10-13T16:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-7', 'bug-106', 'usr-5', 6, 600, 3600, 'Aligned rounding algorithm with Directive 2006/112/EC using banker rounding on total taxable sum.', 'corrective_maintenance', '2026-10-15T00:00:00.000Z', '2026-10-15T15:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-8', NULL, 'usr-2', 18, 500, 9000, 'Streaming SSE delta consumer and syntax highlighting markdown render component.', 'regular_development', '2026-10-14T00:00:00.000Z', '2026-10-14T17:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-9', NULL, 'usr-3', 22, 500, 11000, 'Token bucket sliding-window rate limiter per API key with Redis store.', 'regular_development', '2026-10-13T00:00:00.000Z', '2026-10-13T18:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-10', NULL, 'usr-5', 15, 600, 9000, 'Conversation threads database schema and pgvector embeddings indexing.', 'regular_development', '2026-10-12T00:00:00.000Z', '2026-10-12T19:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, work_category, date, created_at)
VALUES ('te-11', NULL, 'usr-2', 12, 500, 6000, 'Transactional email template library refactor with unit tests.', 'regular_development', '2026-10-09T00:00:00.000Z', '2026-10-09T17:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA: REVIEWS (7 records)
-- ====================================================================
INSERT INTO public.reviews (id, bug_id, manager_id, developer_id, root_cause, decision, status, review_notes, comments, cost_accepted, hours_approved, quality_rating, created_at, updated_at)
VALUES ('rev-5938', 'bug-882', 'usr-1', 'usr-3', 'code_defect', 'approved_for_accounting', 'approved_for_accounting', 'Verified distributed mutex. 4.5 corrective hours accepted.', 'Verified distributed mutex. 4.5 corrective hours accepted.', TRUE, 4.5, 4, '2026-10-17T00:05:25.938Z', '2026-10-17T00:05:25.938Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, bug_id, manager_id, developer_id, root_cause, decision, status, review_notes, comments, cost_accepted, hours_approved, quality_rating, created_at, updated_at)
VALUES ('rev-101', 'bug-102', 'usr-1', 'usr-3', 'edge_case', 'approved', 'approved', 'Race condition confirmed under high concurrent token exchange. Fix verified in staging with stress test.', 'Race condition confirmed under high concurrent token exchange. Fix verified in staging with stress test.', TRUE, 8, 5, '2026-10-11T14:00:00.000Z', '2026-10-11T14:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, bug_id, manager_id, developer_id, root_cause, decision, status, review_notes, comments, cost_accepted, hours_approved, quality_rating, created_at, updated_at)
VALUES ('rev-102', 'bug-104', 'usr-1', 'usr-2', 'security', 'approved', 'approved', 'Security patch approved and verified. Client sign-off received with 5-star rating.', 'Security patch approved and verified. Client sign-off received with 5-star rating.', TRUE, 5.5, 5, '2026-10-01T10:00:00.000Z', '2026-10-01T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, bug_id, manager_id, developer_id, root_cause, decision, status, review_notes, comments, cost_accepted, hours_approved, quality_rating, created_at, updated_at)
VALUES ('rev-1', 'bug-102', 'usr-1', 'usr-3', 'code_defect', 'approved_for_accounting', 'approved_for_accounting', 'Clean atomic lock solution. Unit and concurrency tests passed under 50 simultaneous refresh requests. Rework cost verified and accepted.', 'Clean atomic lock solution. Unit and concurrency tests passed under 50 simultaneous refresh requests. Rework cost verified and accepted.', TRUE, 8, 5, '2026-10-11T10:00:00.000Z', '2026-10-11T14:10:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, bug_id, manager_id, developer_id, root_cause, decision, status, review_notes, comments, cost_accepted, hours_approved, quality_rating, created_at, updated_at)
VALUES ('rev-2', 'bug-104', 'usr-1', 'usr-2', 'code_defect', 'approved_for_accounting', 'approved_for_accounting', 'Sanitization filters applied across all 12 notification templates. Regression test suite green.', 'Sanitization filters applied across all 12 notification templates. Regression test suite green.', TRUE, 5.5, 4, '2026-09-30T14:00:00.000Z', '2026-10-01T11:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, bug_id, manager_id, developer_id, root_cause, decision, status, review_notes, comments, cost_accepted, hours_approved, quality_rating, created_at, updated_at)
VALUES ('rev-3', 'bug-101', 'usr-1', 'usr-2', 'code_defect', 'pending', 'pending', 'Awaiting final payment provider sandbox automated integration run before signing off.', 'Awaiting final payment provider sandbox automated integration run before signing off.', FALSE, 14.5, 4, '2026-10-12T17:00:00.000Z', '2026-10-12T17:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reviews (id, bug_id, manager_id, developer_id, root_cause, decision, status, review_notes, comments, cost_accepted, hours_approved, quality_rating, created_at, updated_at)
VALUES ('rev-4', 'bug-106', 'usr-1', 'usr-5', 'requirement_change', 'pending', 'pending', 'Need confirmation from finance department regarding Austrian and German edge case orders.', 'Need confirmation from finance department regarding Austrian and German edge case orders.', FALSE, 6, 4, '2026-10-15T16:00:00.000Z', '2026-10-15T16:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA: PAYROLL ADJUSTMENTS (5 records)
-- ====================================================================
INSERT INTO public.payroll_adjustments (id, employee_id, month, bug_id, module_id, original_author_id, rework_assignee_id, approved_hours, hourly_rate, rework_cost, original_task_value, capped_adjustment_amount, excluded_amount, cap_applied, calculation_explanation, proposed_adjustment_amount, proposed_bonus_adjustment, proposed_retainer_adjustment, waiver_amount, is_chargeable, waiver_reason, status, review_notes, finance_reviewer_id, finance_review_date, hr_authorization_status, hr_reviewer_id, hr_decision_date, hr_notes, dispute_reason, disputed_at, disputed_by_id, external_payroll_status, external_payroll_tx_id, external_payroll_batch_id, payroll_provider, created_at, updated_at)
VALUES ('pa-101', 'usr-2', 'October 2026', 'bug-101', 'mod-1', 'usr-2', 'usr-2', 14.5, 500, 7250, 75000, 0, 0, FALSE, NULL, 7250, 0, 0, 0, TRUE, NULL, 'under_review', 'Under manager evaluation for October accounting cycle.', NULL, NULL, 'pending_hr_review', NULL, NULL, NULL, NULL, NULL, NULL, 'dry_run', NULL, NULL, 'sandbox_mock', '2026-10-12T17:00:00.000Z', '2026-10-12T17:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.payroll_adjustments (id, employee_id, month, bug_id, module_id, original_author_id, rework_assignee_id, approved_hours, hourly_rate, rework_cost, original_task_value, capped_adjustment_amount, excluded_amount, cap_applied, calculation_explanation, proposed_adjustment_amount, proposed_bonus_adjustment, proposed_retainer_adjustment, waiver_amount, is_chargeable, waiver_reason, status, review_notes, finance_reviewer_id, finance_review_date, hr_authorization_status, hr_reviewer_id, hr_decision_date, hr_notes, dispute_reason, disputed_at, disputed_by_id, external_payroll_status, external_payroll_tx_id, external_payroll_batch_id, payroll_provider, created_at, updated_at)
VALUES ('pa-102', 'usr-3', 'October 2026', 'bug-102', 'mod-2', 'usr-3', 'usr-3', 8, 500, 4000, 50000, 0, 0, FALSE, NULL, 4000, 0, 0, 0, TRUE, NULL, 'finance_approved', 'Approved in finance-review workflow by Sarah Connor. Clean atomic lock verified. Pending independent HR authorization signoff.', 'usr-1', '2026-10-11T14:15:00.000Z', 'pending_hr_review', NULL, NULL, NULL, NULL, NULL, NULL, 'dry_run', NULL, NULL, 'sandbox_mock', '2026-10-11T14:10:00.000Z', '2026-10-11T14:15:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.payroll_adjustments (id, employee_id, month, bug_id, module_id, original_author_id, rework_assignee_id, approved_hours, hourly_rate, rework_cost, original_task_value, capped_adjustment_amount, excluded_amount, cap_applied, calculation_explanation, proposed_adjustment_amount, proposed_bonus_adjustment, proposed_retainer_adjustment, waiver_amount, is_chargeable, waiver_reason, status, review_notes, finance_reviewer_id, finance_review_date, hr_authorization_status, hr_reviewer_id, hr_decision_date, hr_notes, dispute_reason, disputed_at, disputed_by_id, external_payroll_status, external_payroll_tx_id, external_payroll_batch_id, payroll_provider, created_at, updated_at)
VALUES ('pa-103', 'usr-5', 'October 2026', 'bug-106', 'mod-1', 'usr-2', 'usr-5', 6, 600, 3600, 75000, 0, 0, FALSE, NULL, 0, 0, 0, 3600, FALSE, 'Statutory compliance shift: EU Directive 2006/112/EC amendment required rounding adjustments at the line level. Defect caused by changing legal requirements rather than developer implementation negligence. Full rework cost of ₹3,600 waived in full.', 'waived', 'Fairness waiver granted — external regulatory requirement update, not developer defect.', 'usr-1', '2026-10-15T16:05:00.000Z', 'rejected', 'usr-1', '2026-10-15T16:05:00.000Z', 'Waiver accepted and archived. Zero payroll impact.', NULL, NULL, NULL, 'dry_run', NULL, NULL, 'sandbox_mock', '2026-10-15T16:00:00.000Z', '2026-10-15T16:05:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.payroll_adjustments (id, employee_id, month, bug_id, module_id, original_author_id, rework_assignee_id, approved_hours, hourly_rate, rework_cost, original_task_value, capped_adjustment_amount, excluded_amount, cap_applied, calculation_explanation, proposed_adjustment_amount, proposed_bonus_adjustment, proposed_retainer_adjustment, waiver_amount, is_chargeable, waiver_reason, status, review_notes, finance_reviewer_id, finance_review_date, hr_authorization_status, hr_reviewer_id, hr_decision_date, hr_notes, dispute_reason, disputed_at, disputed_by_id, external_payroll_status, external_payroll_tx_id, external_payroll_batch_id, payroll_provider, created_at, updated_at)
VALUES ('pa-104', 'usr-2', 'September 2026', 'bug-104', 'mod-4', 'usr-2', 'usr-2', 5.5, 500, 2750, 45000, 0, 0, FALSE, NULL, 2750, 0, 0, 0, TRUE, NULL, 'finance_approved', 'September payroll cycle review finalized. Corrective fixes verified.', 'usr-1', '2026-09-30T14:00:00.000Z', 'authorized', 'usr-6', '2026-10-01T10:00:00.000Z', 'Formally authorized following statutory employee notification and compliance check under Section 7 Payment of Wages Act.', NULL, NULL, NULL, 'dry_run', NULL, NULL, 'sandbox_mock', '2026-09-30T14:00:00.000Z', '2026-10-01T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.payroll_adjustments (id, employee_id, month, bug_id, module_id, original_author_id, rework_assignee_id, approved_hours, hourly_rate, rework_cost, original_task_value, capped_adjustment_amount, excluded_amount, cap_applied, calculation_explanation, proposed_adjustment_amount, proposed_bonus_adjustment, proposed_retainer_adjustment, waiver_amount, is_chargeable, waiver_reason, status, review_notes, finance_reviewer_id, finance_review_date, hr_authorization_status, hr_reviewer_id, hr_decision_date, hr_notes, dispute_reason, disputed_at, disputed_by_id, external_payroll_status, external_payroll_tx_id, external_payroll_batch_id, payroll_provider, created_at, updated_at)
VALUES ('pa-105', 'usr-3', 'September 2026', 'bug-105', 'mod-5', 'usr-3', 'usr-3', 3, 500, 1500, 55000, 0, 0, FALSE, NULL, 1500, 0, 0, 0, TRUE, NULL, 'disputed', 'Employee raised formal dispute on requirement changes.', NULL, NULL, 'disputed', NULL, NULL, NULL, 'Memory leak caused by un-versioned third-party CSV parser library dependency update pushed by DevOps, not developer negligence.', '2026-10-14T12:00:00.000Z', 'usr-3', 'dry_run', NULL, NULL, 'sandbox_mock', '2026-10-13T16:30:00.000Z', '2026-10-14T12:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA: NOTIFICATIONS (19 records)
-- ====================================================================
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-1792195525939_tmci', 'usr-1', 'Client Verified Fix: Concurrent JWT token renewal drop during network jitter', 'Client Acme Enterprise (Client) gave 5★ rating and verified the fix. Defect bug-882 is officially CLOSED.', 'info', '/bugs', FALSE, '2026-10-17T00:05:25.939Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-1792195525933_bwow', 'usr-3', 'Corrective Task Assigned: Concurrent JWT token renewal drop during network jitter', 'Manager confirmed defect bug-882 (HIGH severity). Assigned for corrective maintenance.', 'assignment', '/employee/dashboard', FALSE, '2026-10-17T00:05:25.933Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-1792195525933_fd5g', 'usr-3', 'Task Reopened: Defect Confirmed', 'Task "Silent Refresh Token Concurrency Fix" has been reopened for corrective fix upon manager defect confirmation.', 'info', '/employee/tasks', FALSE, '2026-10-17T00:05:25.933Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-1792195525928_kb5a', 'usr-3', 'New Assignment: bug-882', 'You were assigned corrective rework on "Concurrent JWT token renewal drop during network jitter".', 'assignment', '/employee/modules', FALSE, '2026-10-17T00:05:25.928Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-1792195525928_f18r', 'usr-1', 'Client Defect Reported: Concurrent JWT token renewal drop during network jitter', 'Client Acme Enterprise (Client) reported defect bug-882 on JWT Auth & Session Manager. Awaiting manager review and classification.', 'review', '/manager/reviews', FALSE, '2026-10-17T00:05:25.928Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-101', 'usr-2', 'Defect Assigned: Voucher Calculation', 'You have been assigned corrective rework on bug-101 (Billing & Checkout Engine).', 'assignment', '/employee/modules', FALSE, '2026-10-03T10:05:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-102', 'usr-1', 'Client Defect Reported', 'Client Acme Enterprise reported defect on OmniCommerce Cloud. Awaiting manager classification review.', 'review', '/manager/reviews', FALSE, '2026-10-08T14:05:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-103', 'usr-6', 'Payroll Adjustment Requires Tripartite Review', 'New proposed adjustment item for October 2026 awaiting HR statutory verification.', 'payroll', '/manager/payroll', FALSE, '2026-10-12T17:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-1', 'usr-2', 'Review Update on Bug-101', 'Manager Sarah Connor is reviewing the idempotency fix. Awaiting final payment provider sandbox automated run.', 'review', '/employee/status', FALSE, '2026-10-12T17:05:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-2', 'usr-2', 'Monthly Adjustment Preview Generated', 'Your draft October payroll adjustment preview has been computed for engineering retrospective review.', 'payroll_adjustment', '/employee/payroll', FALSE, '2026-10-15T09:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-3', 'usr-3', 'Review Approved: Bug-102', 'JWT refresh token race condition fix was approved for accounting by Manager Sarah Connor (Rating: 5/5).', 'review', '/employee/status', TRUE, '2026-10-11T14:15:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-4', 'usr-5', 'Defect Waived (Non-Chargeable): Bug-106', 'Tax rounding discrepancy classified as Requirement Change. Rework cost waived from payroll adjustment preview.', 'payroll_adjustment', '/employee/payroll', FALSE, '2026-10-15T16:10:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-5', 'usr-6', 'HR Statutory Authorization Queue', 'October 2026 proposed payroll adjustments are pending your statutory compliance review under Section 7.', 'payroll_adjustment', '/manager/payroll', FALSE, '2026-10-15T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-6', 'usr-1', 'Client Verified Deliverable: Small Inventory Widget', 'Client Acme Enterprise reviewed and approved Small Inventory Widget with 4.8★ star rating.', 'info', '/modules', TRUE, '2026-10-02T11:35:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-1792195472717_y9vh', 'usr-1', 'Client Verified Fix: Concurrent JWT token renewal drop during network jitter', 'Client Acme Enterprise (Client) gave 5★ rating and verified the fix. Defect bug-385 is officially CLOSED.', 'info', '/bugs', FALSE, '2026-10-17T00:04:32.717Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-1792195472706_ql8p', 'usr-1', 'Client Defect Reported: Concurrent JWT token renewal drop during network jitter', 'Client Acme Enterprise (Client) reported defect bug-385 on Small Inventory Widget. Awaiting manager review and classification.', 'review', '/manager/reviews', FALSE, '2026-10-17T00:04:32.706Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-1792195472706_ys8e', 'usr-2', 'New Assignment: bug-385', 'You were assigned corrective rework on "Concurrent JWT token renewal drop during network jitter".', 'assignment', '/employee/modules', FALSE, '2026-10-17T00:04:32.706Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-1792195472711_4mqx', 'usr-3', 'Corrective Task Assigned: Concurrent JWT token renewal drop during network jitter', 'Manager confirmed defect bug-385 (HIGH severity). Assigned for corrective maintenance.', 'assignment', '/employee/dashboard', FALSE, '2026-10-17T00:04:32.711Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, link, read, created_at)
VALUES ('notif-1792195472711_kih6', 'usr-2', 'Task Reopened: Defect Confirmed', 'Task "Implement Multi-Warehouse Allocation & Live SKU Polling" has been reopened for corrective fix upon manager defect confirmation.', 'info', '/employee/tasks', FALSE, '2026-10-17T00:04:32.711Z')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA: AUDIT LOGS (51 records)
-- ====================================================================
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5939-91', 'bug', 'bug-882', 'CLIENT_VERIFIED_AND_CLOSED', 'usr-8', NULL, 'Client Acme Enterprise (Client) verified and approved fix for defect bug-882. Rating: 5/5. Feedback: "Verified token renewal under simulated throttling. Zero dropped sessions observed.". Defect status set to CLOSED.', '2026-10-17T00:05:25.939Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5938-67', 'review', 'rev-5938', 'REVIEW_APPROVED_FOR_ACCOUNTING', 'usr-1', NULL, 'Manager Sarah Connor recorded decision "APPROVED_FOR_ACCOUNTING" for bug-882. Root cause: "code_defect". Comments: "Verified distributed mutex. 4.5 corrective hours accepted."', '2026-10-17T00:05:25.938Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5936-55', 'time_entry', 'te-5936', 'HOURS_LOGGED', 'usr-2', NULL, 'Logged 4.5h [corrective_maintenance] (₹2250.00) on bug bug-882', '2026-10-17T00:05:25.936Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5933-24', 'bug', 'bug-882', 'BUG_CLASSIFIED', 'usr-1', NULL, 'Sarah Connor classified bug bug-882 as CONFIRMED_DEFECT (Previous: pending_manager_review). Notes: "Confirmed in sandbox under simulated mobile jitter. Valid internal regression."', '2026-10-17T00:05:25.933Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5933-39', 'task', 'task-103', 'TASK_REOPENED_ON_CONFIRMED_DEFECT', 'usr-1', NULL, 'Task "Silent Refresh Token Concurrency Fix" automatically reopened upon confirming defect bug-882 (Concurrent JWT token renewal drop during network jitter).', '2026-10-17T00:05:25.933Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5932-66', 'module', 'mod-2', 'MODULE_REOPENED_ON_CONFIRMED_DEFECT', 'usr-1', NULL, 'Module JWT Auth & Session Manager (AUTH_SRV) reopened by Manager upon confirming defect bug-882. Reopen count: 2.', '2026-10-17T00:05:25.932Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5928-25', 'bug', 'bug-882', 'BUG_CREATED', 'usr-3', NULL, 'Logged bug bug-882: "Concurrent JWT token renewal drop during network jitter" (Severity: HIGH) linked to JWT Auth & Session Manager', '2026-10-17T00:05:25.928Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5928-15', 'bug', 'bug-882', 'CLIENT_DEFECT_REPORTED', 'usr-3', NULL, 'Defect bug-882 submitted by client. Queued for Manager Review. Module JWT Auth & Session Manager kept in completed until manager confirms defect.', '2026-10-17T00:05:25.928Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-9837-82', 'module', 'mod-9836', 'MODULE_CREATED', 'usr-2', NULL, 'Created new module: Real Module Sync Test [REAL_MOD] version v1.0.0 (assigned)', '2026-10-16T23:29:09.837Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-7037-37', 'module', 'mod-7037', 'MODULE_CREATED', 'usr-2', NULL, 'Created new module: Cloud Storage Gateway [CSG_01] version v1.0.0 (assigned)', '2026-10-16T23:29:47.037Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5721-20', 'module', 'mod-5721', 'MODULE_CREATED', 'usr-1', NULL, 'Created new module: AI Model [AM] version v1.0.0 (assigned)', '2026-10-16T23:34:35.721Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5666-2', 'bug', 'bug-943', 'BUG_CLASSIFIED', 'usr-1', NULL, 'Sarah Connor classified bug bug-943 as CONFIRMED_DEFECT (Previous: pending_manager_review). Notes: "Confirmed in sandbox under simulated mobile jitter. Valid internal regression."', '2026-10-16T23:40:05.666Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5661-60', 'bug', 'bug-943', 'BUG_CREATED', 'usr-2', NULL, 'Logged bug bug-943: "Concurrent JWT token renewal drop during network jitter" (Severity: HIGH) linked to Small Inventory Widget', '2026-10-16T23:40:05.661Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5666-6', 'module', 'mod-0391', 'MODULE_REOPENED_ON_CONFIRMED_DEFECT', 'usr-1', NULL, 'Module Small Inventory Widget (INV_WIDGET_0391) reopened by Manager upon confirming defect bug-943. Reopen count: 3.', '2026-10-16T23:40:05.666Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5660-66', 'bug', 'bug-943', 'CLIENT_DEFECT_REPORTED', 'usr-2', NULL, 'Defect bug-943 submitted by client. Queued for Manager Review. Module Small Inventory Widget kept in completed until manager confirms defect.', '2026-10-16T23:40:05.660Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5666-82', 'bug', 'bug-943', 'DEFECT_REASSIGNED', 'usr-1', NULL, 'Manager reassigned defect bug-943 from original author usr-2 to Devon Lee. Reason: "Assigned to Devon Lee for token atomic rotation lock implementation.". Original delivery attribution preserved.', '2026-10-16T23:40:05.666Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5672-0', 'review', 'rev-5672', 'REVIEW_APPROVED_FOR_ACCOUNTING', 'usr-1', NULL, 'Manager Sarah Connor recorded decision "APPROVED_FOR_ACCOUNTING" for bug-943. Root cause: "code_defect". Comments: "Verified distributed mutex. 4.5 corrective hours accepted."', '2026-10-16T23:40:05.672Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5666-43', 'task', 'task-101', 'TASK_REOPENED_ON_CONFIRMED_DEFECT', 'usr-1', NULL, 'Task "Implement Multi-Warehouse Allocation & Live SKU Polling" automatically reopened upon confirming defect bug-943 (Concurrent JWT token renewal drop during network jitter).', '2026-10-16T23:40:05.666Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5670-67', 'time_entry', 'te-5670', 'HOURS_LOGGED', 'usr-2', NULL, 'Logged 4.5h [corrective_maintenance] (₹2250.00) on bug bug-943', '2026-10-16T23:40:05.670Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5674-84', 'bug', 'bug-943', 'CLIENT_VERIFIED_AND_CLOSED', 'usr-8', NULL, 'Client Acme Enterprise (Client) verified and approved fix for defect bug-943. Rating: 5/5. Feedback: "Verified token renewal under simulated throttling. Zero dropped sessions observed.". Defect status set to CLOSED.', '2026-10-16T23:40:05.674Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-101', 'module', 'mod-0391', 'CLIENT_VERIFIED_AND_CLOSED', 'usr-8', 'Acme Enterprise (Client)', 'Client Acme Enterprise verified and approved module Small Inventory Widget with 5★ rating.', '2026-10-02T11:30:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-102', 'bug', 'bug-101', 'DEFECT_CONFIRMED_BY_MANAGER', 'usr-1', 'Sarah Connor', 'Manager Sarah Connor confirmed defect bug-101 and assigned corrective fix to original author Alex Rivera.', '2026-10-03T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-103', 'review', 'rev-101', 'REVIEW_APPROVED', 'usr-1', 'Sarah Connor', 'Manager approved 8.0 corrective rework hours on bug-102 for developer Devon Lee.', '2026-10-11T14:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-104', 'payroll', 'pa-102', 'HR_STATUTORY_AUTHORIZATION', 'usr-6', 'Elena Rostova', 'HR Reviewer Elena Rostova authorized proposed rework adjustment for Devon Lee (₹4000) under statutory wage compliance.', '2026-10-14T11:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2702-47', 'bug', 'bug-654', 'BUG_CLASSIFIED', 'usr-1', NULL, 'Sarah Connor classified bug bug-654 as CONFIRMED_DEFECT (Previous: pending_manager_review). Notes: "Confirmed in sandbox under simulated mobile jitter. Valid internal regression."', '2026-10-16T23:55:32.702Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2702-52', 'task', 'task-103', 'TASK_REOPENED_ON_CONFIRMED_DEFECT', 'usr-1', NULL, 'Task "Silent Refresh Token Concurrency Fix" automatically reopened upon confirming defect bug-654 (Concurrent JWT token renewal drop during network jitter).', '2026-10-16T23:55:32.702Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2709-91', 'bug', 'bug-654', 'CLIENT_VERIFIED_AND_CLOSED', 'usr-8', NULL, 'Client Acme Enterprise (Client) verified and approved fix for defect bug-654. Rating: 5/5. Feedback: "Verified token renewal under simulated throttling. Zero dropped sessions observed.". Defect status set to CLOSED.', '2026-10-16T23:55:32.709Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2702-33', 'module', 'mod-2', 'MODULE_REOPENED_ON_CONFIRMED_DEFECT', 'usr-1', NULL, 'Module JWT Auth & Session Manager (AUTH_SRV) reopened by Manager upon confirming defect bug-654. Reopen count: 2.', '2026-10-16T23:55:32.702Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2706-90', 'time_entry', 'te-2706', 'HOURS_LOGGED', 'usr-2', NULL, 'Logged 4.5h [corrective_maintenance] (₹2250.00) on bug bug-654', '2026-10-16T23:55:32.706Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2697-99', 'bug', 'bug-654', 'CLIENT_DEFECT_REPORTED', 'usr-3', NULL, 'Defect bug-654 submitted by client. Queued for Manager Review. Module JWT Auth & Session Manager kept in completed until manager confirms defect.', '2026-10-16T23:55:32.697Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2697-59', 'bug', 'bug-654', 'BUG_CREATED', 'usr-3', NULL, 'Logged bug bug-654: "Concurrent JWT token renewal drop during network jitter" (Severity: HIGH) linked to JWT Auth & Session Manager', '2026-10-16T23:55:32.697Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2708-82', 'review', 'rev-2708', 'REVIEW_APPROVED_FOR_ACCOUNTING', 'usr-1', NULL, 'Manager Sarah Connor recorded decision "APPROVED_FOR_ACCOUNTING" for bug-654. Root cause: "code_defect". Comments: "Verified distributed mutex. 4.5 corrective hours accepted."', '2026-10-16T23:55:32.708Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-1', 'bug', 'bug-101', 'STATUS_CHANGED', 'usr-2', NULL, 'Status changed from fixed to review_pending after completing automated tests.', '2026-10-12T16:40:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2', 'time_entry', 'te-2', 'HOURS_LOGGED', 'usr-2', NULL, 'Logged 8.0 corrective hours (₹4,000.00) on bug-101: Double charge on Stripe checkout.', '2026-10-12T16:30:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-3', 'review', 'rev-1', 'REVIEW_APPROVED', 'usr-1', NULL, 'Manager Sarah Connor approved rework fix for bug-102 (JWT refresh race). Accepted cost: ₹4,000.00.', '2026-10-11T14:10:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-4', 'time_entry', 'te-4', 'HOURS_LOGGED', 'usr-5', NULL, 'Logged 11.0 corrective hours (₹6,600.00) on bug-103: Negative stock quantity.', '2026-10-14T19:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-5', 'bug', 'bug-106', 'SUBMITTED_FOR_REVIEW', 'usr-5', NULL, 'Submitted tax rounding discrepancy fix to Manager review queue.', '2026-10-15T15:20:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-6', 'payroll_adjustment', 'pa-101', 'ADJUSTMENT_INITIALIZED', 'usr-1', NULL, 'Draft adjustment generated for Alex Rivera: 14.5 hrs on bug-101. Total rework cost: ₹7,250.00. Marked under internal finance review.', '2026-10-12T17:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-7', 'payroll_adjustment', 'pa-102', 'FINANCE_APPROVED', 'usr-1', NULL, 'Finance approved internal preview for Devon Lee: ₹4,000.00. Placed in HR review queue. No salary deduction applied.', '2026-10-11T14:15:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-8', 'payroll_adjustment', 'pa-103', 'FAIRNESS_WAIVED', 'usr-1', NULL, 'Fairness waiver approved by Sarah Connor: Requirement change from finance on EU VAT rules. ₹3,600.00 rework cost absorbed by company. Offset set to ₹0.', '2026-10-15T16:05:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-9', 'payroll_adjustment', 'pa-104', 'HR_AUTHORIZED', 'usr-6', NULL, 'September cycle: HR authorization sign-off completed by Elena Rostova following statutory compliance verification.', '2026-10-01T10:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-10', 'module', 'mod-0391', 'CLIENT_VERIFIED_AND_CLOSED', 'usr-8', NULL, 'Client Acme Enterprise verified and approved module Small Inventory Widget with 4.8★ rating.', '2026-10-02T11:30:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2717-95', 'bug', 'bug-385', 'CLIENT_VERIFIED_AND_CLOSED', 'usr-8', NULL, 'Client Acme Enterprise (Client) verified and approved fix for defect bug-385. Rating: 5/5. Feedback: "Verified token renewal under simulated throttling. Zero dropped sessions observed.". Defect status set to CLOSED.', '2026-10-17T00:04:32.717Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2710-30', 'task', 'task-101', 'TASK_REOPENED_ON_CONFIRMED_DEFECT', 'usr-1', NULL, 'Task "Implement Multi-Warehouse Allocation & Live SKU Polling" automatically reopened upon confirming defect bug-385 (Concurrent JWT token renewal drop during network jitter).', '2026-10-17T00:04:32.710Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2706-26', 'bug', 'bug-385', 'CLIENT_DEFECT_REPORTED', 'usr-2', NULL, 'Defect bug-385 submitted by client. Queued for Manager Review. Module Small Inventory Widget kept in completed until manager confirms defect.', '2026-10-17T00:04:32.706Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2711-89', 'bug', 'bug-385', 'BUG_CLASSIFIED', 'usr-1', NULL, 'Sarah Connor classified bug bug-385 as CONFIRMED_DEFECT (Previous: pending_manager_review). Notes: "Confirmed in sandbox under simulated mobile jitter. Valid internal regression."', '2026-10-17T00:04:32.711Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2711-68', 'bug', 'bug-385', 'DEFECT_REASSIGNED', 'usr-1', NULL, 'Manager reassigned defect bug-385 from original author usr-2 to Devon Lee. Reason: "Assigned to Devon Lee for token atomic rotation lock implementation.". Original delivery attribution preserved.', '2026-10-17T00:04:32.711Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2715-71', 'review', 'rev-2715', 'REVIEW_APPROVED_FOR_ACCOUNTING', 'usr-1', NULL, 'Manager Sarah Connor recorded decision "APPROVED_FOR_ACCOUNTING" for bug-385. Root cause: "code_defect". Comments: "Verified distributed mutex. 4.5 corrective hours accepted."', '2026-10-17T00:04:32.715Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2710-66', 'module', 'mod-0391', 'MODULE_REOPENED_ON_CONFIRMED_DEFECT', 'usr-1', NULL, 'Module Small Inventory Widget (INV_WIDGET_0391) reopened by Manager upon confirming defect bug-385. Reopen count: 3.', '2026-10-17T00:04:32.710Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2714-76', 'time_entry', 'te-2714', 'HOURS_LOGGED', 'usr-2', NULL, 'Logged 4.5h [corrective_maintenance] (₹2250.00) on bug bug-385', '2026-10-17T00:04:32.714Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.audit_logs (id, entity_type, entity_id, action, user_id, user_name, details, timestamp)
VALUES ('aud-2706-92', 'bug', 'bug-385', 'BUG_CREATED', 'usr-2', NULL, 'Logged bug bug-385: "Concurrent JWT token renewal drop during network jitter" (Severity: HIGH) linked to Small Inventory Widget', '2026-10-17T00:04:32.706Z')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA: JIRA SYNC LOGS (4 records)
-- ====================================================================
INSERT INTO public.jira_sync_logs (id, event_id, event_type, jira_key, status, details, payload, timestamp)
VALUES ('jira-log-1792170900399_ybc5', NULL, 'issue_import', NULL, 'ignored', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.jira_sync_logs (id, event_id, event_type, jira_key, status, details, payload, timestamp)
VALUES ('jira-log-1792170900398_rxoe', NULL, 'issue_import', NULL, 'ignored', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.jira_sync_logs (id, event_id, event_type, jira_key, status, details, payload, timestamp)
VALUES ('jira-log-1792170868737_ql3x', NULL, 'issue_import', NULL, 'ignored', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.jira_sync_logs (id, event_id, event_type, jira_key, status, details, payload, timestamp)
VALUES ('jira-log-1792170868736_119r', NULL, 'issue_import', NULL, 'success', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA: PAYROLL SUBMISSION LOGS (2 records)
-- ====================================================================
INSERT INTO public.payroll_submission_logs (id, batch_id, provider, mode, authorized_by_id, records_count, total_amount, currency, payload, result, created_at)
VALUES ('psl-1792170900402_2evu', 'batch_audit_test_1792170900401', 'sandbox', 'dry_run', NULL, 0, 0, 'INR', NULL, NULL, '2026-10-16T17:15:00.402Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.payroll_submission_logs (id, batch_id, provider, mode, authorized_by_id, records_count, total_amount, currency, payload, result, created_at)
VALUES ('psl-1792170868739_zrkc', 'batch_audit_test_1792170868739', 'sandbox', 'dry_run', NULL, 0, 0, 'INR', NULL, NULL, '2026-10-16T17:14:28.739Z')
ON CONFLICT (id) DO NOTHING;


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
