export type EngineeringRole = 
  | 'frontend_developer' 
  | 'backend_developer' 
  | 'database_designer' 
  | 'qa_engineer';

export type UserRole = 'developer' | 'manager' | 'qa' | 'admin' | 'hr' | 'client' | EngineeringRole;

export type BugClassificationStatus = 
  | 'reported' 
  | 'pending_manager_review' 
  | 'confirmed_defect' 
  | 'new_feature_request' 
  | 'external_dependency' 
  | 'not_caused_by_original_delivery' 
  | 'disputed' 
  | 'resolved' 
  | 'closed'
  | 'rejected';

export type WorkCategory = 
  | 'regular_development' 
  | 'corrective_maintenance' 
  | 'approved_new_feature';

export interface User {
  id: string;
  employee_id?: string;
  client_id?: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  engineering_role?: EngineeringRole;
  hourly_rate: number; // e.g. 500 (₹/hr)
  avatar?: string;
  password?: string;
  created_at: string;
}

export type ModuleStatus = 
  | 'assigned' 
  | 'in_progress' 
  | 'completed' 
  | 'reopened' 
  | 'under_fix'
  | 'closed'
  | 'active'
  | 'maintenance'
  | 'deprecated';

export interface ModuleStatusHistoryItem {
  id: string;
  from_status: string;
  to_status: string;
  changed_by_id: string;
  changed_by_name?: string;
  timestamp: string;
  notes?: string;
}

export interface Module {
  id: string;
  name: string;
  code: string; // e.g. "AUTH", "PAYMENT", "CHECKOUT"
  version: string; // e.g. "v1.0.0", "v2.1.0"
  description: string;
  owner_id: string;
  owner_name?: string;
  total_lines_of_code: number;
  status: ModuleStatus;
  project_id?: string;
  original_task_value?: number;
  project_name?: string;
  created_at: string;
  updated_at: string;
  completion_date?: string | null;
  committed_deadline?: string | null;
  delivered_at?: string | null;
  client_id?: string;
  client_name?: string;
  reopen_count?: number;
  client_verified_at?: string | null;
  client_star_rating?: number;
  client_feedback?: string;
  status_history?: ModuleStatusHistoryItem[];
  // Computed analytics
  total_bugs?: number;
  open_bugs?: number;
  resolved_bugs?: number;
  rework_hours?: number;
  rework_cost?: number;
  defect_density?: number; // bugs per KLOC
}

export type BugSeverity = 'critical' | 'major' | 'minor' | 'high' | 'medium' | 'low';
export type BugPriority = 'p0' | 'p1' | 'p2' | 'p3';
export type BugStatus = 'open' | 'in_progress' | 'fixed' | 'closed' | 'reopened' | 'review_pending';
export type RootCauseCategory = 
  | 'logic_error' 
  | 'requirement_gap' 
  | 'regression' 
  | 'integration' 
  | 'edge_case' 
  | 'security' 
  | 'performance'
  | 'code_defect'
  | 'requirement_change'
  | 'external_dependency'
  | 'unclear_specification'
  | 'other';

export type ReviewDecision = 'pending' | 'approved_for_accounting' | 'waived' | 'disputed';

export type ReviewStatus = 
  | 'not_submitted' 
  | 'pending' 
  | 'approved_for_accounting'
  | 'approved' 
  | 'waived'
  | 'disputed'
  | 'rejected' 
  | 'changes_requested';

export interface BugStatusHistoryItem {
  id: string;
  from_status: string;
  to_status: string;
  changed_by_id: string;
  changed_by_name?: string;
  timestamp: string;
  notes?: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  module_id: string;
  module_name?: string;
  module_code?: string;
  module_version?: string;
  original_module_owner_id?: string;
  original_module_owner_name?: string;
  reproduction_steps?: string;
  severity: BugSeverity;
  priority: BugPriority;
  status: BugStatus;
  root_cause: RootCauseCategory;
  original_author_id?: string;
  original_author_name?: string;
  assigned_to_id: string;
  assigned_to_name?: string;
  corrective_hours: number;
  hourly_rate: number;
  rework_cost: number; // corrective_hours * hourly_rate
  review_status: ReviewStatus;
  project_id?: string;
  project_name?: string;
  task_id?: string;
  deadline?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  acceptance_criteria?: string[];
  assigned_role?: EngineeringRole | string;
  assigned_to_role?: string;
  manager_instructions?: string;
  permitted_files?: string[];
  saved_files?: Record<string, string>;
  qa_verification_status?: 'pending' | 'passed' | 'failed';
  qa_evidence?: string;
  qa_verified_by_id?: string;
  qa_verified_by_name?: string;
  qa_verified_at?: string;
  classification_status?: BugClassificationStatus;
  classification_notes?: string;
  classified_by_id?: string;
  classified_by_name?: string;
  classified_at?: string;
  initial_review_decision?: 'approve_assign' | 'reject_reopen' | 'request_info';
  manager_review_reason?: string;
  initial_reviewed_at?: string;
  initial_reviewed_by_id?: string;
  initial_reviewed_by_name?: string;
  fix_notes?: string;
  fix_evidence_urls?: string;
  fix_submitted_at?: string;
  dispute_status?: 'none' | 'disputed' | 'resolved' | 'rejected';
  dispute_reason?: string;
  disputed_by_id?: string;
  disputed_by_name?: string;
  disputed_at?: string;
  dispute_resolution_notes?: string;
  dispute_resolved_at?: string;
  dispute_resolved_by?: string;
  evidence_urls?: string;
  evidence_notes?: string;
  jira_issue_id?: string;
  jira_issue_key?: string;
  jira_issue_url?: string;
  original_task_id?: string;
  original_task_title?: string;
  original_task_value?: number;
  is_reopened?: boolean;
  status_history?: BugStatusHistoryItem[];
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  committed_deadline?: string | null;
  bug_found_date?: string | null;
  client_id?: string;
  client_name?: string;
  client_reported?: boolean;
  client_verified?: boolean;
  client_verified_at?: string | null;
  client_rating?: number;
  client_feedback?: string;
  reopen_count?: number;
  reopen_reason?: string;
}

export interface TimeEntry {
  id: string;
  bug_id?: string;
  task_id?: string;
  bug_title?: string;
  target_title?: string;
  work_type?: WorkSessionType;
  user_id: string;
  user_name?: string;
  hours_spent: number;
  hourly_rate: number;
  cost: number;
  work_category?: WorkCategory;
  work_description: string;
  date: string;
  created_at: string;
}

export interface Review {
  id: string;
  bug_id: string;
  bug_title?: string;
  bug_description?: string;
  bug_severity?: BugSeverity;
  module_name?: string;
  module_code?: string;
  module_owner_name?: string;
  manager_id: string;
  manager_name?: string;
  developer_id?: string;
  developer_name?: string;
  root_cause?: RootCauseCategory | string;
  decision?: ReviewDecision | string;
  status: string; // 'pending' | 'approved_for_accounting' | 'approved' | 'waived' | 'disputed' | 'rejected' | 'changes_requested'
  review_notes?: string;
  comments?: string; // required explanation for waiver or dispute
  explanation?: string;
  cost_accepted?: boolean;
  hours_approved?: number;
  quality_rating?: number; // 1 to 5
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  entity_type: 'bug' | 'module' | 'review' | 'time_entry' | 'payroll_adjustment';
  entity_id: string;
  action: string;
  user_id: string;
  user_name?: string;
  details: string;
  timestamp: string;
}

export interface ModuleCostMetric {
  module_id: string;
  module_name: string;
  module_code: string;
  rework_cost: number;
  hours: number;
  bug_count: number;
  defect_density: number;
}

export interface SeverityMetric {
  severity: string;
  count: number;
  cost: number;
}

export interface RootCauseMetric {
  root_cause: string;
  count: number;
  cost: number;
}

export interface MonthlyTrendMetric {
  month: string;
  cost: number;
  hours: number;
  bugs: number;
}

export interface DashboardStats {
  total_bugs: number;
  open_bugs: number;
  in_progress_bugs: number;
  review_pending_bugs: number;
  closed_bugs: number;
  total_corrective_hours: number;
  total_rework_cost: number;
  avg_rework_cost_per_bug: number;
  defect_density_overall: number;
  cost_by_module: ModuleCostMetric[];
  bugs_by_severity: SeverityMetric[];
  bugs_by_root_cause: RootCauseMetric[];
  monthly_trend: MonthlyTrendMetric[];
  recent_activity: AuditLog[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface DashboardSummaryRecentBug {
  id: string;
  title: string;
  module_id: string;
  module_code: string;
  module_name: string;
  severity: BugSeverity;
  status: BugStatus;
  fix_hours: number;
  rework_cost: number;
  created_at: string;
}

export interface DashboardSummary {
  total_modules: number;
  total_bugs: number;
  total_corrective_hours: number;
  total_rework_cost: number;
  reopen_rate: number;
  resolved_bugs_count: number;
  reopened_bugs_count: number;
  manager_waiver_cost: number;
  currency: string;
  recent_bugs: DashboardSummaryRecentBug[];
}

export interface RootCauseDistributionItem {
  category: 'Code Defect' | 'Requirement Change' | 'External Dependency' | 'Other' | string;
  count: number;
  hours: number;
  rework_cost: number;
  percentage: number;
}

export interface MonthlyReworkCostItem {
  month: string;
  rework_cost: number;
  corrective_hours: number;
  bug_count: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ActiveTimeSession {
  id: string;
  user_id: string;
  bug_id: string;
  bug_title?: string;
  module_id: string;
  module_name?: string;
  work_description: string;
  start_time: string;
  last_resume_time: string;
  total_paused_seconds: number;
  is_paused: boolean;
  pause_start_time?: string | null;
  elapsed_active_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeDashboardData {
  assigned_modules_count: number;
  new_assignments_count: number;
  completed_work_count: number;
  pending_reviews_count: number;
  total_active_work_hours: number;
  regular_work_hours: number;
  rework_hours: number;
  daily_work_hours: { date: string; hours: number; rework_hours: number }[];
  recent_activity: {
    id: string;
    date: string;
    work_item_id: string;
    work_item_title: string;
    module_name: string;
    work_description: string;
    hours_logged: number;
    status: string;
  }[];
}

export interface EmployeeAssignedTask {
  id: string;
  title: string;
  module_id: string;
  module_name: string;
  module_code: string;
  description: string;
  priority: BugPriority;
  severity: BugSeverity;
  assignment_date: string;
  due_date?: string;
  status: BugStatus | string;
  review_status: ReviewStatus;
  total_hours_recorded: number;
  is_new?: boolean;
  requires_changes?: boolean;
  review_notes?: string;
}

export interface EmployeeWorkStatusItem {
  work_item_id: string;
  work_item_title: string;
  module_name: string;
  work_description: string;
  submission_date: string;
  recorded_hours: number;
  current_status: string;
  reviewer_name: string;
  review_comments: string;
  last_updated: string;
  review_history?: Review[];
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'assignment' | 'review' | 'payroll_adjustment' | 'info' | 'warning';
  link?: string;
  read: boolean;
  created_at: string;
}

export interface PayrollAdjustmentItem {
  id: string;
  employee_id: string;
  employee_name: string;
  month: string; // e.g. "October 2026"
  bug_id: string;
  bug_title: string;
  module_id: string;
  module_name: string;
  original_author_id?: string;
  original_author_name?: string;
  rework_assignee_id?: string;
  rework_assignee_name?: string;
  approved_hours: number;
  hourly_rate: number;
  rework_cost: number; // total corrective rework cost = approved_hours * hourly_rate
  proposed_adjustment_amount: number; // proposed internal adjustment preview
  waiver_amount?: number;
  is_chargeable: boolean;
  waiver_reason?: string;
  statutory_cap_applied?: boolean;
  capped_adjustment_amount?: number;
  status: 'draft' | 'under_review' | 'finance_approved' | 'waived' | 'disputed';
  review_notes?: string;
  finance_reviewer_id?: string;
  finance_reviewer_name?: string;
  finance_review_date?: string;
  hr_authorization_status: 'pending_hr_review' | 'authorized' | 'rejected' | 'disputed';
  hr_reviewer_id?: string;
  hr_reviewer_name?: string;
  hr_decision_date?: string;
  hr_notes?: string;
  dispute_reason?: string;
  disputed_at?: string;
  disputed_by_id?: string;
  disputed_by_name?: string;
  // Fair Rework & Cap Fields
  contract_task_value?: number;
  actual_rework_cost?: number;
  proposed_bonus_adjustment?: number;
  proposed_retainer_adjustment?: number;
  hr_approved_adjustment?: number;
  actual_adjustment_recorded_by_payroll?: number;
  cap_applied?: boolean;
  original_task_cap?: number;
  cumulative_prior_adjustments?: number;
  remaining_task_cap?: number;
  excluded_amount?: number;
  calculation_explanation?: string;
  created_at: string;
  updated_at?: string;
}

export interface MonthlyPayrollPreview {
  month: string;
  employee_id: string;
  employee_name: string;
  base_salary: number; // monthly gross in INR ₹ (e.g. 85,000)
  hourly_rate: number;
  total_rework_cost: number; // total rework cost calculation (distinct from proposed deduction!)
  total_corrective_hours: number;
  eligible_adjustment_hours: number;
  waived_hours: number;
  proposed_adjustment: number;
  authorized_adjustment: number; // only formally authorized deductions
  estimated_net_salary: number;
  adjustment_items: PayrollAdjustmentItem[];
  compliance_warning: string;
  status: 'draft' | 'under_review' | 'finance_approved';
}

export interface MonthlyFinanceSummary {
  month: string;
  total_rework_cost: number;
  approved_rework_cost: number;
  waived_rework_cost: number;
  disputed_rework_cost: number;
  total_proposed_adjustments: number;
  authorized_adjustments_cost: number;
  total_rework_hours?: number;
  submitted_hours?: number;
  approved_hours?: number;
  pending_hours?: number;
  disputed_hours?: number;
  waived_hours?: number;
  eligible_proposed_rework_cost?: number;
  pending_hr_count: number;
  authorized_hr_count: number;
  affected_employees_count: number;
  finance_status: 'draft' | 'under_review' | 'finance_approved';
  reviews_completed_count: number;
  reviews_pending_count: number;
  items: PayrollAdjustmentItem[];
}

export interface ReopenRateReport {
  project_reopen_rate: number;
  total_modules: number;
  reopened_modules: number;
  modules: Array<{
    id: string;
    name: string;
    code: string;
    owner_name: string;
    status: string;
    is_reopened: boolean;
    reopen_count: number;
  }>;
  employees: Array<{
    employee_id: string;
    employee_name: string;
    total_assigned: number;
    reopened_count: number;
    reopen_rate: number;
  }>;
}

export interface AverageFixTimeReport {
  project_average_fix_hours: number;
  total_resolved_bugs: number;
  by_severity: Record<string, { average_fix_hours: number; count: number }>;
  by_module: Array<{
    module_id: string;
    module_name: string;
    average_fix_hours: number;
    resolved_count: number;
  }>;
  by_developer: Array<{
    developer_id: string;
    developer_name: string;
    average_fix_hours: number;
    resolved_count: number;
  }>;
}

// ====================================================================
// Jira Integration Types
// ====================================================================

export type JiraSyncStatus = 'synced' | 'pending' | 'failed' | 'ignored';

export interface JiraIntegrationStatus {
  connected: boolean;
  webhookUrl: string;
  lastSyncTime?: string;
  totalSyncedIssues: number;
  pendingIssuesCount: number;
  error?: string;
}

export interface JiraIssueMapping {
  jiraKey: string;
  jiraId: string;
  summary: string;
  description: string;
  priority: string;
  status: string;
  assigneeEmail?: string;
  component?: string;
  issueUrl?: string;
}

export interface JiraSyncLogEntry {
  id: string;
  event_type: string;
  jira_issue_key: string;
  action_taken: string;
  status: 'success' | 'ignored' | 'failed';
  payload_summary?: string;
  error_message?: string;
  created_at: string;
}

// ====================================================================
// Payroll Integration Types
// ====================================================================

export type PayrollProvider = 'sandbox' | 'adp' | 'rippling' | 'gusto';

export interface PayrollIntegrationSettings {
  provider: PayrollProvider;
  sandboxMode: boolean; // default true for legal safety
  batchFrequency: 'manual' | 'monthly' | 'biweekly';
  exportFormat: 'json' | 'csv';
  lastSubmissionId?: string;
  lastSubmissionDate?: string;
}

export interface PayrollBatchItem {
  employee_id: string;
  employee_name: string;
  contract_task_value: number;
  actual_rework_cost: number;
  proposed_bonus_adjustment: number;
  proposed_retainer_adjustment: number;
  hr_approved_adjustment: number;
  capped_amount: number;
  hr_approval_reference: string;
  explanation: string;
}

export interface PayrollBatchSubmissionPayload {
  batch_id: string;
  period: string;
  provider: PayrollProvider;
  generated_at: string;
  dry_run: boolean;
  authorized_by_hr_id: string;
  total_records: number;
  total_adjustment_amount: number;
  items: PayrollBatchItem[];
}

export interface PayrollSubmissionResult {
  success: boolean;
  batch_id: string;
  transaction_id: string;
  records_processed: number;
  total_amount: number;
  status: 'completed' | 'dry_run_preview' | 'rejected' | 'failed';
  message: string;
  timestamp: string;
  raw_response?: Record<string, unknown>;
}

export interface PayrollSubmissionLogEntry {
  id: string;
  batch_id: string;
  provider: string;
  dry_run: boolean;
  total_records: number;
  total_amount: number;
  status: string;
  authorized_by_hr_id?: string;
  response_payload?: string;
  created_at: string;
}

// ====================================================================
// Workspace, Projects, Time Sessions & Tasks
// ====================================================================

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'active' | 'completed' | 'planning';
  client_id?: string;
  client_name?: string;
  created_at: string;
}

export interface ProjectFile {
  path: string;
  name: string;
  language: string;
  content: string;
  read_only?: boolean;
}

export type DateFilterOption = 'today' | 'yesterday' | '7days' | '30days';

export type TaskAssignmentStatus = 
  | 'assigned' 
  | 'in_progress' 
  | 'submitted' 
  | 'changes_requested' 
  | 'approved'
  | 'reopened'
  | 'under_fix';

export type TaskPriority = 'p0' | 'p1' | 'p2' | 'p3';

export interface TaskAssignment {
  id: string;
  project_id?: string;
  project_name?: string;
  module_id: string;
  module_name?: string;
  module_code?: string;
  module_version?: string;
  title: string;
  description: string;
  assigned_to_id: string;
  assigned_to_name?: string;
  assigned_by_id: string;
  assigned_by_name?: string;
  assigned_role?: EngineeringRole | string;
  priority: TaskPriority;
  deadline: string;
  status: TaskAssignmentStatus;
  acceptance_criteria?: string[];
  permitted_files?: string[];
  saved_files?: Record<string, string>;
  submission_notes?: string;
  submitted_at?: string | null;
  reviewed_by_id?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  reviewer_feedback?: string | null;
  resubmission_count: number;
  original_task_value?: number;
  status_history?: any[];
  created_at: string;
  updated_at?: string;
}

export interface SubmissionHistoryItem {
  id: string;
  task_id: string;
  user_id: string;
  user_name?: string;
  submission_notes: string;
  submitted_at: string;
  status: TaskAssignmentStatus;
  review_decision?: 'approved' | 'changes_requested';
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_feedback?: string;
  reviewed_at?: string;
}

export type WorkSessionStatus = 'active' | 'paused' | 'stopped';
export type WorkSessionType = 'original_development' | 'corrective_rework' | 'qa_testing';

export interface WorkSession {
  id: string;
  user_id: string;
  user_name?: string;
  task_id?: string;
  bug_id?: string;
  target_id: string;
  target_title: string;
  work_type: WorkSessionType;
  status: WorkSessionStatus;
  start_time: string;
  paused_at?: string | null;
  total_paused_seconds: number;
  end_time?: string | null;
  duration_seconds: number;
  notes?: string;
  created_at: string;
}

export interface WorkSessionEvent {
  id: string;
  session_id: string;
  event_type: 'start' | 'pause' | 'resume' | 'stop';
  user_id: string;
  timestamp: string;
}

export interface TimeCorrectionRequest {
  id: string;
  time_entry_id: string;
  user_id: string;
  user_name?: string;
  target_title?: string;
  original_hours: number;
  requested_hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by_id?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface EmployeeSummary {
  user_id: string;
  user_name: string;
  role: UserRole;
  hourly_rate?: number;
  filter_range: DateFilterOption;
  total_hours: number;
  original_dev_hours: number;
  corrective_hours: number;
  qa_hours?: number;
  completed_tasks: number;
  assigned_tasks_count: number;
  active_rework_count: number;
  estimated_rework_cost?: number;
}

export interface TeamSummary {
  filter_range: DateFilterOption;
  total_logged_hours: number;
  original_dev_hours: number;
  corrective_hours: number;
  total_rework_cost: number;
  assigned_count: number;
  in_progress_count: number;
  overdue_count: number;
  submitted_count: number;
  approved_count: number;
  changes_requested_count: number;
  employee_metrics: {
    user_id: string;
    user_name: string;
    role: string;
    original_hours: number;
    corrective_hours: number;
    rework_cost: number;
    tasks_completed: number;
    pending_tasks: number;
  }[];
  module_metrics: {
    module_id: string;
    module_name: string;
    module_code: string;
    original_hours: number;
    corrective_hours: number;
    rework_cost: number;
    bug_count: number;
  }[];
}

export interface PayrollReworkDetail {
  bug_id: string;
  bug_title: string;
  module_name: string;
  hours: number;
  cost: number;
  review_status: string;
  is_deducted: boolean;
}

export interface PayrollReportItem {
  user_id: string;
  user_name: string;
  role: string;
  hourly_rate: number;
  gross_salary: number;
  total_corrective_hours: number;
  waived_hours: number;
  deductible_hours: number;
  rework_deduction: number;
  net_salary: number;
  rework_details: PayrollReworkDetail[];
}

export interface ComprehensiveReport {
  summary: {
    total_tasks: number;
    reopened_tasks: number;
    under_fix_tasks: number;
    total_bugs: number;
    open_bugs: number;
    closed_bugs: number;
    normal_development_hours: number;
    corrective_rework_hours: number;
    rework_percentage: number;
    total_rework_cost: number;
    total_proposed_deductions: number;
    total_waived_amount: number;
  };
  reopened_tasks: Array<{
    task_id: string;
    title: string;
    module_name: string;
    assigned_to_name: string;
    status: TaskAssignmentStatus;
    reopened_count: number;
    linked_bugs_count: number;
  }>;
  rework_hours_by_developer: Array<{
    developer_id: string;
    developer_name: string;
    normal_hours: number;
    rework_hours: number;
    hourly_rate: number;
    proposed_deduction: number;
    statutory_cap_applied: boolean;
  }>;
  payroll_adjustments_summary: Array<{
    adjustment_id: string;
    employee_name: string;
    month: string;
    rework_hours: number;
    calculated_amount: number;
    approved_amount: number;
    status: string;
    hr_authorization_status: string;
  }>;
  generated_at?: string;
  statutory_compliance_note?: string;
}



