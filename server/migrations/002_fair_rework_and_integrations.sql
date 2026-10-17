-- ====================================================================
-- Migration: 002_fair_rework_and_integrations.sql
-- Description: Add task value cap, bug classification workflow,
-- Jira mappings, time categories, and payroll integration tables.
-- ====================================================================

-- 1. Extend Users Role check for HR
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('developer', 'manager', 'qa', 'admin', 'hr'));

-- 2. Modules: original task value and project name
ALTER TABLE modules ADD COLUMN IF NOT EXISTS original_task_value NUMERIC(12, 2) NOT NULL DEFAULT 50000.00;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS project_name VARCHAR(255) DEFAULT 'Core Platform';

-- 3. Bugs: qualification, Jira traceability, evidence & dispute fields
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS classification_status VARCHAR(64) NOT NULL DEFAULT 'confirmed_defect';
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS classification_notes TEXT;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS classified_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS classified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS disputed_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS dispute_status VARCHAR(32) NOT NULL DEFAULT 'none';
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS evidence_urls TEXT;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS evidence_notes TEXT;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS jira_issue_id VARCHAR(128);
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS jira_issue_key VARCHAR(64);
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS jira_issue_url VARCHAR(512);
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS original_task_id VARCHAR(64);
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS original_task_title VARCHAR(255);
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS original_task_value NUMERIC(12, 2) DEFAULT 50000.00;

-- 4. Time Entries & Sessions: work category separation
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS work_category VARCHAR(32) NOT NULL DEFAULT 'corrective_maintenance';
ALTER TABLE active_time_sessions ADD COLUMN IF NOT EXISTS work_category VARCHAR(32) NOT NULL DEFAULT 'corrective_maintenance';

-- 5. Payroll Adjustments: task value cap, compensation categories & provider status
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS original_task_value NUMERIC(12, 2) NOT NULL DEFAULT 50000.00;
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS capped_adjustment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS excluded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS cap_applied BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS calculation_explanation TEXT;
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS proposed_bonus_adjustment NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS proposed_retainer_adjustment NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS external_payroll_status VARCHAR(32) DEFAULT 'dry_run';
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS external_payroll_tx_id VARCHAR(128);
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS external_payroll_batch_id VARCHAR(128);
ALTER TABLE payroll_adjustments ADD COLUMN IF NOT EXISTS payroll_provider VARCHAR(64) DEFAULT 'sandbox_mock';

-- 6. Jira Sync & Webhook Logs
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

CREATE INDEX IF NOT EXISTS idx_jira_sync_logs_key ON jira_sync_logs(jira_key);
CREATE INDEX IF NOT EXISTS idx_jira_sync_logs_timestamp ON jira_sync_logs(timestamp DESC);

-- 7. Payroll Submission Logs (Dry-run & sandbox reconciliation)
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

CREATE INDEX IF NOT EXISTS idx_payroll_submission_logs_batch ON payroll_submission_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_payroll_submission_logs_created ON payroll_submission_logs(created_at DESC);
