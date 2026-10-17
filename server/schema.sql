-- ====================================================================
-- ReworkGuard — Bug Accountability and Rework Cost Tracker
-- Shared PostgreSQL / Supabase Database Schema & Realistic Seed Data
-- Tables: users, modules, module_status_history, bugs, bug_status_history, time_entries, reviews, audit_logs
-- ====================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(64) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(32) NOT NULL CHECK (role IN ('developer', 'manager', 'qa', 'admin', 'hr', 'client')),
  client_id VARCHAR(64),
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  avatar VARCHAR(512),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. MODULES TABLE
CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64) UNIQUE NOT NULL,
  version VARCHAR(32) NOT NULL DEFAULT 'v1.0.0',
  description TEXT,
  owner_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  total_lines_of_code INTEGER NOT NULL DEFAULT 10000,
  status VARCHAR(32) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'reopened', 'under_fix', 'closed', 'active', 'maintenance', 'deprecated')),
  original_task_value NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
  project_name VARCHAR(255) DEFAULT 'Core Platform',
  client_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
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

-- 2b. MODULE_STATUS_HISTORY TABLE
CREATE TABLE IF NOT EXISTS module_status_history (
  id VARCHAR(64) PRIMARY KEY,
  module_id VARCHAR(64) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  from_status VARCHAR(32) NOT NULL,
  to_status VARCHAR(32) NOT NULL,
  changed_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BUGS TABLE
CREATE TABLE IF NOT EXISTS bugs (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  module_id VARCHAR(64) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  module_version VARCHAR(32),
  original_module_owner_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  reproduction_steps TEXT,
  severity VARCHAR(32) NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'high', 'medium', 'low')),
  priority VARCHAR(32) NOT NULL CHECK (priority IN ('p0', 'p1', 'p2', 'p3')),
  status VARCHAR(32) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fixed', 'closed', 'reopened', 'review_pending')),
  root_cause VARCHAR(64) NOT NULL CHECK (root_cause IN (
    'logic_error', 'requirement_gap', 'regression', 'integration', 
    'edge_case', 'security', 'performance', 'code_defect', 
    'requirement_change', 'external_dependency', 'unclear_specification', 'other'
  )),
  original_author_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  corrective_hours NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  rework_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  review_status VARCHAR(32) NOT NULL DEFAULT 'not_submitted' CHECK (review_status IN (
    'not_submitted', 'pending', 'approved_for_accounting', 'approved', 'waived', 'disputed', 'rejected', 'changes_requested'
  )),
  classification_status VARCHAR(64) NOT NULL DEFAULT 'confirmed_defect',
  classification_notes TEXT,
  classified_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  classified_at TIMESTAMP WITH TIME ZONE,
  dispute_reason TEXT,
  disputed_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
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
  client_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  client_name VARCHAR(255),
  client_reported BOOLEAN NOT NULL DEFAULT FALSE,
  client_verified BOOLEAN NOT NULL DEFAULT FALSE,
  client_verified_at TIMESTAMP WITH TIME ZONE,
  client_rating NUMERIC(3, 1),
  client_feedback TEXT
);

-- 3b. BUG_STATUS_HISTORY TABLE
CREATE TABLE IF NOT EXISTS bug_status_history (
  id VARCHAR(64) PRIMARY KEY,
  bug_id VARCHAR(64) NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  from_status VARCHAR(32) NOT NULL,
  to_status VARCHAR(32) NOT NULL,
  changed_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TIME_ENTRIES TABLE
CREATE TABLE IF NOT EXISTS time_entries (
  id VARCHAR(64) PRIMARY KEY,
  bug_id VARCHAR(64) NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hours_spent NUMERIC(8, 2) NOT NULL CHECK (hours_spent > 0),
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  cost NUMERIC(12, 2) NOT NULL,
  work_description TEXT NOT NULL,
  work_category VARCHAR(32) NOT NULL DEFAULT 'corrective_maintenance',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(64) PRIMARY KEY,
  bug_id VARCHAR(64) NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  manager_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  developer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  root_cause VARCHAR(64) NOT NULL DEFAULT 'code_defect',
  decision VARCHAR(32) NOT NULL DEFAULT 'pending',
  status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved_for_accounting', 'approved', 'waived', 'disputed', 'rejected', 'changes_requested'
  )),
  review_notes TEXT,
  comments TEXT,
  cost_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  hours_approved NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  entity_type VARCHAR(32) NOT NULL CHECK (entity_type IN ('bug', 'module', 'review', 'time_entry', 'payroll_adjustment')),
  entity_id VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ACTIVE_TIME_SESSIONS TABLE (Server-Backed Active Timers)
CREATE TABLE IF NOT EXISTS active_time_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  work_item_id VARCHAR(64) NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  work_description TEXT,
  work_category VARCHAR(32) NOT NULL DEFAULT 'corrective_maintenance',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  last_resume_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_paused_seconds INTEGER NOT NULL DEFAULT 0,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PAYROLL_ADJUSTMENTS TABLE (Monthly Proposed Adjustments & Finance Previews)
CREATE TABLE IF NOT EXISTS payroll_adjustments (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(32) NOT NULL,
  bug_id VARCHAR(64) REFERENCES bugs(id) ON DELETE SET NULL,
  module_id VARCHAR(64) REFERENCES modules(id) ON DELETE SET NULL,
  original_author_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  rework_assignee_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
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
  status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'finance_approved', 'waived', 'disputed')),
  review_notes TEXT,
  finance_reviewer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  finance_review_date TIMESTAMP WITH TIME ZONE,
  hr_authorization_status VARCHAR(32) NOT NULL DEFAULT 'pending_hr_review' CHECK (hr_authorization_status IN ('pending_hr_review', 'authorized', 'rejected', 'disputed')),
  hr_reviewer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  hr_decision_date TIMESTAMP WITH TIME ZONE,
  hr_notes TEXT,
  dispute_reason TEXT,
  disputed_at TIMESTAMP WITH TIME ZONE,
  disputed_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  external_payroll_status VARCHAR(32) DEFAULT 'dry_run',
  external_payroll_tx_id VARCHAR(128),
  external_payroll_batch_id VARCHAR(128),
  payroll_provider VARCHAR(64) DEFAULT 'sandbox_mock',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. NOTIFICATIONS TABLE (Employee & Manager System Notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('assignment', 'review', 'payroll_adjustment', 'info')),
  link VARCHAR(255),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. JIRA_SYNC_LOGS TABLE
CREATE TABLE IF NOT EXISTS jira_sync_logs (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(128) UNIQUE,
  event_type VARCHAR(64) NOT NULL,
  jira_key VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'received',
  details TEXT,
  payload JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. PAYROLL_SUBMISSION_LOGS TABLE
CREATE TABLE IF NOT EXISTS payroll_submission_logs (
  id VARCHAR(64) PRIMARY KEY,
  batch_id VARCHAR(128) NOT NULL,
  provider VARCHAR(64) NOT NULL DEFAULT 'sandbox_mock',
  mode VARCHAR(32) NOT NULL DEFAULT 'dry_run',
  authorized_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  records_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(16) NOT NULL DEFAULT 'INR',
  payload JSONB,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_bugs_module_id ON bugs(module_id);
CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status);
CREATE INDEX IF NOT EXISTS idx_bugs_assigned_to ON bugs(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_bug_id ON time_entries(bug_id);
CREATE INDEX IF NOT EXISTS idx_reviews_bug_id ON reviews(bug_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_active_time_sessions_user_id ON active_time_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_employee_id ON payroll_adjustments(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_month ON payroll_adjustments(month);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_jira_sync_logs_key ON jira_sync_logs(jira_key);
CREATE INDEX IF NOT EXISTS idx_payroll_submission_logs_batch ON payroll_submission_logs(batch_id);

-- ====================================================================
-- SEED DATA (Safe Demo Credentials & Initial Records)
-- ====================================================================

-- 1. Seed Users (All rates in INR ₹)
INSERT INTO users (id, name, email, username, password, role, hourly_rate, avatar, client_id) VALUES
('usr-1', 'Sarah Connor', 'sarah.connor@reworkguard.io', 'sarah.connor', 'manager123', 'manager', 750.00, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', NULL),
('usr-2', 'Alex Rivera', 'alex.rivera@reworkguard.io', 'alex.rivera', 'developer123', 'developer', 500.00, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL),
('usr-3', 'Devon Lee', 'devon.lee@reworkguard.io', 'devon.lee', 'developer123', 'developer', 500.00, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', NULL),
('usr-4', 'Priya Sharma', 'priya.sharma@reworkguard.io', 'priya.sharma', 'qa123', 'qa', 450.00, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', NULL),
('usr-5', 'Marcus Vance', 'marcus.vance@reworkguard.io', 'marcus.vance', 'developer123', 'developer', 600.00, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', NULL),
('usr-6', 'Elena Rostova', 'elena.rostova@reworkguard.io', 'elena.rostova', 'hr123', 'hr', 800.00, 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150', NULL),
('usr-7', 'David Kim', 'david.kim@reworkguard.io', 'david.kim', 'admin123', 'admin', 900.00, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', NULL),
('usr-8', 'Acme Enterprise (Client)', 'client@acmecorp.io', 'client.acme', 'password123', 'client', 0.00, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120', 'CLI-001')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Modules
INSERT INTO modules (id, name, code, version, description, owner_id, total_lines_of_code, status, client_id, client_name, delivered_at, committed_deadline, created_at) VALUES
('mod-1', 'Billing & Checkout Engine', 'CHECKOUT', 'v2.4.0', 'Payment processing, multi-currency conversion, cart calculation, and payment gateway webhooks.', 'usr-2', 28500, 'in_progress', NULL, NULL, NULL, '2026-10-31T00:00:00Z', '2026-08-15T08:00:00Z'),
('mod-2', 'Authentication & OAuth Core', 'AUTH', 'v1.8.2', 'JWT issuance, session token rotation, RBAC permission verification, and SSO SAML connectors.', 'usr-3', 14200, 'completed', 'usr-8', 'Acme Enterprise', '2026-10-10T18:00:00Z', '2026-10-10T00:00:00Z', '2026-08-20T09:30:00Z'),
('mod-3', 'Inventory & Stock Sync', 'STOCK', 'v3.1.0', 'Real-time stock reservation, distributed locking, warehouse ERP syncing, and threshold alerting.', 'usr-5', 22100, 'assigned', NULL, NULL, NULL, '2026-11-15T00:00:00Z', '2026-09-01T11:00:00Z'),
('mod-4', 'Customer Communications', 'NOTIF', 'v1.2.5', 'Transactional emails, SMS dispatch gateway, push notification queues, and template engine.', 'usr-2', 9800, 'completed', 'usr-8', 'Acme Enterprise', '2026-09-30T10:10:00Z', '2026-09-30T00:00:00Z', '2026-09-10T14:15:00Z'),
('mod-5', 'Analytics & Compliance Reports', 'REPORTS', 'v2.0.0', 'Executive dashboard aggregations, financial tax audits, GDPR export routines, and CSV generators.', 'usr-3', 18400, 'in_progress', NULL, NULL, NULL, '2026-11-01T00:00:00Z', '2026-09-18T16:45:00Z')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Bugs
INSERT INTO bugs (id, title, description, module_id, module_version, original_module_owner_id, severity, priority, status, root_cause, original_author_id, assigned_to_id, corrective_hours, hourly_rate, rework_cost, review_status, created_at) VALUES
('bug-101', 'Idempotency failure on high-latency payment retries', 'When 3D-Secure authentication handshake takes >15s, client retried POST /charge without idempotency key header, generating double transactions.', 'mod-1', 'v2.4.0', 'usr-2', 'critical', 'p0', 'review_pending', 'code_defect', 'usr-2', 'usr-2', 14.5, 500.00, 7250.00, 'pending', '2026-10-02T09:15:00Z'),
('bug-102', 'JWT refresh token reuse race condition', 'Concurrent refresh requests with the same rotation token caused silent logout for valid active sessions due to unindexed timestamp comparison.', 'mod-2', 'v1.8.2', 'usr-3', 'major', 'p1', 'closed', 'code_defect', 'usr-3', 'usr-3', 8.0, 500.00, 4000.00, 'approved_for_accounting', '2026-10-04T11:20:00Z'),
('bug-103', 'Negative stock quantity during simultaneous cart checkout', 'Inventory lock was released prior to DB commit, allowing 2 users to buy the last single remaining SKU simultaneously.', 'mod-3', 'v3.1.0', 'usr-5', 'critical', 'p0', 'in_progress', 'code_defect', 'usr-5', 'usr-5', 11.0, 600.00, 6600.00, 'not_submitted', '2026-10-08T14:00:00Z'),
('bug-104', 'Email notification template variable XSS sanitization gap', 'Customer greeting in transactional receipt emails permitted raw HTML injection if display name contained unsanitized script tags.', 'mod-4', 'v1.2.5', 'usr-2', 'major', 'p1', 'closed', 'code_defect', 'usr-2', 'usr-2', 5.5, 500.00, 2750.00, 'approved_for_accounting', '2026-09-25T13:40:00Z'),
('bug-105', 'OOM error when generating quarterly CSV report over 100k rows', 'Report generation loaded entire dataset into memory instead of streaming chunks via cursor, causing Node heap limit crash.', 'mod-5', 'v2.0.0', 'usr-3', 'minor', 'p2', 'open', 'code_defect', 'usr-3', 'usr-3', 3.0, 500.00, 1500.00, 'not_submitted', '2026-10-11T10:05:00Z'),
('bug-106', 'Tax rounding discrepancy on EU VAT orders with multiple items', 'Calculated tax per unit rather than sum of line totals, leading to 1-cent divergence against Stripe tax calculation.', 'mod-1', 'v2.4.0', 'usr-2', 'minor', 'p2', 'review_pending', 'requirement_change', 'usr-2', 'usr-5', 6.0, 600.00, 3600.00, 'pending', '2026-10-07T16:15:00Z')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Time Entries
INSERT INTO time_entries (id, bug_id, user_id, hours_spent, hourly_rate, cost, work_description, date) VALUES
('te-1', 'bug-101', 'usr-2', 6.5, 500.00, 3250.00, 'Isolated idempotency race condition in webhook receiver; drafted unit test suite.', '2026-10-03'),
('te-2', 'bug-101', 'usr-2', 8.0, 500.00, 4000.00, 'Implemented distributed Redis lock with SHA-256 idempotency signature; verified with test mocks.', '2026-10-04'),
('te-3', 'bug-102', 'usr-3', 8.0, 500.00, 4000.00, 'Added atomic token invalidation in PostgreSQL transaction; added concurrency tests.', '2026-10-05'),
('te-4', 'bug-103', 'usr-5', 11.0, 600.00, 6600.00, 'Implemented SELECT FOR UPDATE row-level locking on inventory table.', '2026-10-09'),
('te-5', 'bug-104', 'usr-2', 5.5, 500.00, 2750.00, 'Added DOMPurify sanitizer and escaped mustache template tags across all templates.', '2026-09-26'),
('te-6', 'bug-105', 'usr-3', 3.0, 500.00, 1500.00, 'Refactored report query to use cursor streams piping into gzip compression stream.', '2026-10-12'),
('te-7', 'bug-106', 'usr-5', 6.0, 600.00, 3600.00, 'Recalculated line totals using Banker rounding matching Stripe tax precision.', '2026-10-08')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Reviews
INSERT INTO reviews (id, bug_id, manager_id, developer_id, root_cause, decision, status, review_notes, comments, cost_accepted, hours_approved, quality_rating, created_at) VALUES
('rev-1', 'bug-102', 'usr-1', 'usr-3', 'code_defect', 'approved_for_accounting', 'approved_for_accounting', 'Clean atomic lock solution. Concurrency tests passed. Rework cost approved.', 'Clean atomic lock solution. Concurrency tests passed. Rework cost approved.', true, 8.0, 5, '2026-10-11T10:00:00Z'),
('rev-2', 'bug-104', 'usr-1', 'usr-2', 'code_defect', 'approved_for_accounting', 'approved_for_accounting', 'Sanitization filters applied across all notification templates. Regression suite green.', 'Sanitization filters applied across all notification templates. Regression suite green.', true, 5.5, 4, '2026-09-30T14:00:00Z'),
('rev-3', 'bug-101', 'usr-1', 'usr-2', 'code_defect', 'pending', 'pending', 'Awaiting final payment provider sandbox automated integration run before signing off.', 'Awaiting final payment provider sandbox automated integration run before signing off.', false, 14.5, 4, '2026-10-12T17:00:00Z'),
('rev-4', 'bug-106', 'usr-1', 'usr-5', 'requirement_change', 'pending', 'pending', 'Need confirmation from finance department regarding Austrian and German edge case orders.', 'Need confirmation from finance department regarding Austrian and German edge case orders.', false, 6.0, 4, '2026-10-15T16:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Audit Logs
INSERT INTO audit_logs (id, entity_type, entity_id, action, user_id, details, timestamp) VALUES
('aud-1', 'bug', 'bug-101', 'STATUS_CHANGED', 'usr-2', 'Status changed from in_progress to review_pending after completing tests.', '2026-10-12T16:40:00Z'),
('aud-2', 'time_entry', 'te-2', 'HOURS_LOGGED', 'usr-2', 'Logged 8.0 corrective hours on bug-101 (Rework cost: ₹4,000).', '2026-10-04T18:00:00Z'),
('aud-3', 'review', 'rev-1', 'REVIEW_APPROVED', 'usr-1', 'Manager Sarah Connor approved rework cost for bug-102.', '2026-10-11T10:00:00Z')
ON CONFLICT (id) DO NOTHING;
