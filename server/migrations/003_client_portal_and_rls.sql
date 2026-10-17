-- ====================================================================
-- Migration: 003_client_portal_and_rls.sql
-- Description: Client Portal entities, delivery tracking, reopen count,
-- role check updates ('client'), and Row Level Security (RLS) policies.
-- ====================================================================

-- 1. Users Table: Add 'client' role and client_id
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('developer', 'manager', 'qa', 'admin', 'hr', 'client'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id VARCHAR(64);

-- 2. Projects Table: Ensure existence and client association
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'planning')),
  client_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  client_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Modules Table: Client delivery & reopen count tracking
ALTER TABLE modules ADD COLUMN IF NOT EXISTS client_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS reopen_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS client_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS client_star_rating NUMERIC(3, 1);
ALTER TABLE modules ADD COLUMN IF NOT EXISTS client_feedback TEXT;

-- 4. Bugs Table: Client submission & verification fields
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS client_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS client_reported BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS client_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS client_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS client_rating NUMERIC(3, 1);
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS client_feedback TEXT;

-- 5. Indexes for fast client queries
CREATE INDEX IF NOT EXISTS idx_modules_client_id ON modules(client_id);
CREATE INDEX IF NOT EXISTS idx_modules_reopen_count ON modules(reopen_count);
CREATE INDEX IF NOT EXISTS idx_bugs_client_id ON bugs(client_id);
CREATE INDEX IF NOT EXISTS idx_bugs_classification ON bugs(classification_status);

-- 6. Seed Client User & Link Delivered Modules
INSERT INTO users (id, name, email, username, password, role, hourly_rate, avatar, client_id)
VALUES ('usr-8', 'Acme Enterprise (Client)', 'client@acmecorp.io', 'client.acme', 'password123', 'client', 0.00, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120', 'CLI-001')
ON CONFLICT (id) DO UPDATE SET role = 'client', client_id = 'CLI-001';

UPDATE modules SET 
  client_id = 'usr-8',
  client_name = 'Acme Enterprise',
  delivered_at = '2026-10-10T18:00:00Z',
  committed_deadline = '2026-10-10T00:00:00Z'
WHERE id = 'mod-2' AND (client_id IS NULL OR client_id = '');

UPDATE modules SET 
  client_id = 'usr-8',
  client_name = 'Acme Enterprise',
  delivered_at = '2026-09-30T10:10:00Z',
  committed_deadline = '2026-09-30T00:00:00Z'
WHERE id = 'mod-4' AND (client_id IS NULL OR client_id = '');

-- ====================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- USERS Table Policies:
-- Authenticated users can read user records for collaboration/assignment displays.
DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS users_modify_policy ON users;
CREATE POLICY users_modify_policy ON users
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- MODULES Table Policies:
-- Clients can only view modules delivered to their client account
DROP POLICY IF EXISTS modules_select_policy ON modules;
CREATE POLICY modules_select_policy ON modules
  FOR SELECT USING (
    (auth.jwt() ->> 'role' IN ('manager', 'developer', 'qa', 'admin', 'hr', 'service_role'))
    OR (auth.jwt() ->> 'role' = 'client' AND (client_id = auth.uid()::text OR client_id = auth.jwt() ->> 'client_id'))
  );

DROP POLICY IF EXISTS modules_modify_policy ON modules;
CREATE POLICY modules_modify_policy ON modules
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'admin', 'service_role'));

-- BUGS Table Policies:
-- Clients can read and submit bugs for their own delivered modules
DROP POLICY IF EXISTS bugs_select_policy ON bugs;
CREATE POLICY bugs_select_policy ON bugs
  FOR SELECT USING (
    (auth.jwt() ->> 'role' IN ('manager', 'developer', 'qa', 'admin', 'hr', 'service_role'))
    OR (auth.jwt() ->> 'role' = 'client' AND (client_id = auth.uid()::text OR client_id = auth.jwt() ->> 'client_id'))
  );

DROP POLICY IF EXISTS bugs_insert_policy ON bugs;
CREATE POLICY bugs_insert_policy ON bugs
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('manager', 'developer', 'qa', 'admin', 'client', 'service_role')
  );

DROP POLICY IF EXISTS bugs_update_policy ON bugs;
CREATE POLICY bugs_update_policy ON bugs
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('manager', 'admin', 'service_role')
    OR (auth.jwt() ->> 'role' = 'developer' AND assigned_to_id = auth.uid()::text)
    OR (auth.jwt() ->> 'role' = 'client' AND client_id = auth.uid()::text)
  );

-- TIME_ENTRIES Table Policies:
-- Clients NEVER have access to engineering time entries
DROP POLICY IF EXISTS time_entries_select_policy ON time_entries;
CREATE POLICY time_entries_select_policy ON time_entries
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'admin', 'hr', 'service_role')
    OR (auth.jwt() ->> 'role' = 'developer' AND user_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS time_entries_modify_policy ON time_entries;
CREATE POLICY time_entries_modify_policy ON time_entries
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'admin', 'service_role')
    OR (auth.jwt() ->> 'role' = 'developer' AND user_id = auth.uid()::text)
  );

-- PAYROLL_ADJUSTMENTS Table Policies:
-- Clients NEVER have access to compensation/payroll records.
-- Employees can ONLY view their own records.
DROP POLICY IF EXISTS payroll_adjustments_select_policy ON payroll_adjustments;
CREATE POLICY payroll_adjustments_select_policy ON payroll_adjustments
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'admin', 'hr', 'service_role')
    OR (auth.jwt() ->> 'role' = 'developer' AND employee_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS payroll_adjustments_modify_policy ON payroll_adjustments;
CREATE POLICY payroll_adjustments_modify_policy ON payroll_adjustments
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'admin', 'hr', 'service_role')
  );

-- NOTIFICATIONS Table Policies:
-- Users can only see and mark read their own notifications
DROP POLICY IF EXISTS notifications_user_policy ON notifications;
CREATE POLICY notifications_user_policy ON notifications
  FOR ALL USING (
    user_id = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'service_role')
  );

-- AUDIT_LOGS Table Policies:
-- Append-only; no updates or deletions allowed
DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'admin', 'hr', 'service_role')
  );

DROP POLICY IF EXISTS audit_logs_insert_policy ON audit_logs;
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT WITH CHECK (true);
