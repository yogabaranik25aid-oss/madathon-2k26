import { 
  User, 
  Module, 
  Bug, 
  TimeEntry, 
  Review, 
  AuditLog, 
  DashboardStats,
  DashboardSummary,
  RootCauseDistributionItem,
  MonthlyReworkCostItem,
  ApiResponse,
  ActiveTimeSession,
  EmployeeDashboardData,
  EmployeeAssignedTask,
  EmployeeWorkStatusItem,
  NotificationItem,
  PayrollAdjustmentItem,
  MonthlyPayrollPreview,
  MonthlyFinanceSummary,
  BugClassificationStatus,
  RootCauseCategory,
  WorkCategory,
  JiraIntegrationStatus,
  JiraIssueMapping,
  JiraSyncLogEntry,
  PayrollIntegrationSettings,
  PayrollBatchSubmissionPayload,
  PayrollSubmissionResult,
  PayrollSubmissionLogEntry,
  Project,
  ProjectFile,
  DateFilterOption,
  TaskAssignment,
  SubmissionHistoryItem,
  WorkSession,
  TimeCorrectionRequest,
  EmployeeSummary,
  TeamSummary,
  PayrollReportItem,
  BugSeverity,
  ComprehensiveReport
} from '../../types/index';

const API_BASE = '/api';

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('reworkguard_token', token);
  } else {
    localStorage.removeItem('reworkguard_token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('reworkguard_token');
};

// Helper to handle API requests with safe JSON parsing & graceful error handling
async function request<T>(endpoint: string, options?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('reworkguard_token') : null;
  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
    authHeaders['x-auth-token'] = token;
  }

  const timeoutMs = options?.timeoutMs || 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      signal: options?.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options?.headers,
      },
      ...options,
    });
  } catch (netErr: any) {
    if (netErr.name === 'AbortError' || controller.signal.aborted) {
      console.error(`Request timed out on ${endpoint} after ${timeoutMs}ms`);
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s. Please check server status and try again.`);
    }
    console.error(`Network Error on ${endpoint}:`, netErr);
    throw new Error('Unable to connect to the ReworkGuard server. Please verify your network and ensure the backend is running.');
  } finally {
    clearTimeout(timer);
  }

  // Safely retrieve the response body as text first to prevent "Unexpected end of JSON input"
  let rawText = '';
  try {
    rawText = await res.text();
  } catch (textErr: any) {
    console.error(`Failed to read response body on ${endpoint}:`, textErr);
    throw new Error(`Failed to read server response (HTTP ${res.status}).`);
  }

  // Handle empty bodies
  if (!rawText || rawText.trim().length === 0) {
    if (!res.ok) {
      throw new Error(`Server returned an empty error response with status ${res.status} (${res.statusText || 'Error'}).`);
    }
    return {} as T;
  }

  // Safely parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch (jsonErr) {
    console.error(`Invalid JSON received on ${endpoint}:`, rawText);
    const cleanPreview = rawText.slice(0, 150).replace(/<[^>]+>/g, '').trim();
    throw new Error(
      cleanPreview 
        ? `Server error (${res.status}): ${cleanPreview}` 
        : `Server returned an invalid non-JSON response with status ${res.status}.`
    );
  }

  // Check success flag and HTTP status
  if (!res.ok || (parsed && typeof parsed === 'object' && parsed.success === false)) {
    const errorMsg = parsed?.error || parsed?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return (parsed && typeof parsed === 'object' && 'data' in parsed ? parsed.data : parsed) as T;
}

export const api = {
  // Health
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  getHealth: async (): Promise<{ status: string; app: string; version: string; port?: number }> => {
    return request<{ status: string; app: string; version: string; port?: number }>('/health');
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    return request<User[]>('/users');
  },

  // Dashboard Summary (4 summary cards + recent bugs table)
  getDashboardSummary: async (filters?: { startDate?: string; endDate?: string }): Promise<DashboardSummary> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<DashboardSummary>(`/dashboard/summary${queryString}`);
  },

  // Dashboard Root Causes Distribution
  getDashboardRootCauses: async (filters?: { startDate?: string; endDate?: string }): Promise<RootCauseDistributionItem[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<RootCauseDistributionItem[]>(`/dashboard/root-causes${queryString}`);
  },

  // Dashboard Monthly Rework Costs
  getDashboardMonthlyCosts: async (): Promise<MonthlyReworkCostItem[]> => {
    return request<MonthlyReworkCostItem[]>('/dashboard/monthly-costs');
  },

  // Dashboard Stats (legacy/extended)
  getDashboardStats: async (): Promise<DashboardStats> => {
    return request<DashboardStats>('/dashboard/stats');
  },

  // Modules
  getModules: async (): Promise<Module[]> => {
    return request<Module[]>('/modules');
  },

  getModule: async (id: string): Promise<Module> => {
    return request<Module>(`/modules/${id}`);
  },

  createModule: async (moduleData: {
    name: string;
    version: string;
    owner_id: string;
    description?: string;
    code?: string;
    status?: string;
    total_lines_of_code?: number;
  }): Promise<Module> => {
    return request<Module>('/modules', {
      method: 'POST',
      body: JSON.stringify(moduleData),
    });
  },

  updateModule: async (
    id: string, 
    moduleData: Partial<Module> & { user_id?: string; status_notes?: string }
  ): Promise<Module> => {
    return request<Module>(`/modules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(moduleData),
    });
  },

  // Bugs
  getBugs: async (filters?: {
    module_id?: string;
    status?: string;
    severity?: string;
    root_cause?: string;
    assigned_to_id?: string;
  }): Promise<Bug[]> => {
    const query = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val && val !== 'all') query.append(key, val);
      });
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<Bug[]>(`/bugs${queryString}`);
  },

  getBug: async (id: string): Promise<Bug> => {
    return request<Bug>(`/bugs/${id}`);
  },

  createBug: async (bugData: {
    title?: string;
    description: string;
    module_id: string;
    original_task_id?: string;
    task_id?: string;
    severity: string;
    priority?: string;
    root_cause?: string;
    assigned_to_id: string;
    reproduction_steps?: string;
    status?: string;
  }): Promise<Bug> => {
    return request<Bug>('/bugs', {
      method: 'POST',
      body: JSON.stringify(bugData),
    });
  },

  updateBug: async (
    id: string, 
    bugData: Partial<Bug> & { user_id?: string; status_notes?: string }
  ): Promise<Bug> => {
    return request<Bug>(`/bugs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(bugData),
    });
  },

  // Time Entries & Corrective Rework Hours
  getTimeEntries: async (bugId: string): Promise<TimeEntry[]> => {
    return request<TimeEntry[]>(`/bugs/${bugId}/time-entries`);
  },

  logTimeEntry: async (
    bugId: string,
    entryData: {
      hours_spent: number;
      work_description: string;
      user_id: string;
      target_developer_id?: string;
      date?: string;
    }
  ): Promise<TimeEntry> => {
    return request<TimeEntry>(`/bugs/${bugId}/time-entries`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  },

  // Reviews
  getReviews: async (): Promise<Review[]> => {
    return request<Review[]>('/reviews');
  },

  getPendingReviews: async (): Promise<Bug[]> => {
    return request<Bug[]>('/reviews/pending');
  },

  getBugReviews: async (bugId: string): Promise<Review[]> => {
    return request<Review[]>(`/bugs/${bugId}/reviews`);
  },

  submitBugReview: async (
    bugId: string,
    reviewData: {
      manager_id: string;
      root_cause: string;
      decision: string;
      comments?: string;
      explanation?: string;
    }
  ): Promise<{ review: Review; bug: Bug }> => {
    return request<{ review: Review; bug: Bug }>(`/bugs/${bugId}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  createReview: async (reviewData: {
    bug_id: string;
    manager_id: string;
    developer_id: string;
    status: 'approved' | 'rejected' | 'changes_requested';
    review_notes: string;
    cost_accepted: boolean;
    hours_approved: number;
    quality_rating: number;
  }): Promise<Review> => {
    return request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  updateReview: async (id: string, reviewData: Partial<Review>): Promise<Review> => {
    return request<Review>(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(reviewData),
    });
  },

  // Audit Logs
  getAuditLogs: async (limit?: number): Promise<AuditLog[]> => {
    const query = limit ? `?limit=${limit}` : '';
    return request<AuditLog[]>(`/audit-logs${query}`);
  },

  // Authentication
  login: async (credentials: { identifier: string; password?: string }): Promise<{ token: string; user: User; role: string; redirect_to: string }> => {
    const res = await request<{ token: string; user: User; role: string; redirect_to: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res?.token) {
      localStorage.setItem('reworkguard_token', res.token);
      localStorage.setItem('reworkguard_current_user_id', res.user.id);
    }
    return res;
  },

  getCurrentUser: async (): Promise<User> => {
    return request<User>('/auth/me');
  },

  logout: async (): Promise<void> => {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('reworkguard_token');
      localStorage.removeItem('reworkguard_current_user_id');
    }
  },

  // Server-Backed Time Tracking
  getActiveTimeSession: async (): Promise<ActiveTimeSession | null> => {
    return request<ActiveTimeSession | null>('/time-tracking/active');
  },

  startActiveTimeSession: async (data: { bug_id: string; work_description?: string }): Promise<ActiveTimeSession> => {
    return request<ActiveTimeSession>('/time-tracking/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  pauseActiveTimeSession: async (): Promise<ActiveTimeSession> => {
    return request<ActiveTimeSession>('/time-tracking/pause', {
      method: 'POST',
    });
  },

  resumeActiveTimeSession: async (): Promise<ActiveTimeSession> => {
    return request<ActiveTimeSession>('/time-tracking/resume', {
      method: 'POST',
    });
  },

  stopActiveTimeSession: async (data?: { work_description?: string }): Promise<{ timeEntry: TimeEntry; session: ActiveTimeSession; reworkCost: number }> => {
    return request<{ timeEntry: TimeEntry; session: ActiveTimeSession; reworkCost: number }>('/time-tracking/stop', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  cancelActiveTimeSession: async (): Promise<{ cancelled: boolean }> => {
    return request<{ cancelled: boolean }>('/time-tracking/cancel', {
      method: 'POST',
    });
  },

  // Employee Portal Data
  getEmployeeDashboard: async (range: 'today' | 'yesterday' | '7days' | '30days' = '7days'): Promise<EmployeeDashboardData> => {
    return request<EmployeeDashboardData>(`/employee/dashboard?range=${range}`);
  },

  getEmployeeTasks: async (filters?: { status?: string; search?: string }): Promise<EmployeeAssignedTask[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<EmployeeAssignedTask[]>(`/employee/tasks${queryString}`);
  },

  getEmployeeStatus: async (): Promise<EmployeeWorkStatusItem[]> => {
    return request<EmployeeWorkStatusItem[]>('/employee/status');
  },

  submitEmployeeWorkForReview: async (bugId: string, notes?: string): Promise<Bug> => {
    return request<Bug>(`/employee/tasks/${bugId}/submit-review`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  // Payroll Adjustments & Finance Previews
  getPayrollPreview: async (employeeId?: string, month?: string): Promise<MonthlyPayrollPreview> => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employee_id', employeeId);
    if (month) params.append('month', month);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<MonthlyPayrollPreview>(`/payroll/preview${queryString}`);
  },

  getFinanceSummary: async (month?: string): Promise<MonthlyFinanceSummary> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<MonthlyFinanceSummary>(`/finance/summary${queryString}`);
  },

  updatePayrollAdjustmentStatus: async (
    id: string, 
    data: { status: 'draft' | 'under_review' | 'finance_approved' | 'waived' | 'disputed' | 'eligible_for_review'; review_notes?: string; notes?: string }
  ): Promise<PayrollAdjustmentItem> => {
    return request<PayrollAdjustmentItem>(`/payroll/adjustments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  submitForHrReview: async (
    id: string,
    data: { notes?: string }
  ): Promise<PayrollAdjustmentItem> => {
    return request<PayrollAdjustmentItem>(`/payroll/adjustments/${id}/submit-for-hr-review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  hrAuthorizePayrollAdjustment: async (
    id: string,
    data: { decision: 'authorized' | 'rejected' | 'disputed'; notes?: string }
  ): Promise<PayrollAdjustmentItem> => {
    return request<PayrollAdjustmentItem>(`/payroll/adjustments/${id}/hr-authorize`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  disputePayrollAdjustment: async (
    id: string,
    data: { reason: string }
  ): Promise<PayrollAdjustmentItem> => {
    return request<PayrollAdjustmentItem>(`/payroll/adjustments/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAdjustmentAuditHistory: async (id: string): Promise<AuditLog[]> => {
    return request<AuditLog[]>(`/payroll/adjustments/${id}/audit-history`);
  },

  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    return request<NotificationItem[]>('/notifications');
  },

  markNotificationAsRead: async (id: string): Promise<{ success: boolean; notification: NotificationItem }> => {
    return request<{ success: boolean; notification: NotificationItem }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  // Bug Qualification & Dispute
  classifyBug: async (
    id: string, 
    data: { classification: BugClassificationStatus; notes?: string; assigned_to_id?: string; reassignment_reason?: string }
  ): Promise<Bug> => {
    return request<Bug>(`/bugs/${id}/classify`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  initialReviewBug: async (
    id: string,
    data: {
      decision: 'approve_assign' | 'reject_reopen' | 'request_info';
      root_cause?: RootCauseCategory;
      reason: string;
      assigned_to_id?: string;
      reassignment_reason?: string;
    }
  ): Promise<Bug> => {
    return request<Bug>(`/bugs/${id}/initial-review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  disputeBug: async (
    id: string, 
    data: { reason: string; evidence_urls?: string; evidence_notes?: string }
  ): Promise<Bug> => {
    return request<Bug>(`/bugs/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resolveBugDispute: async (
    id: string, 
    data: { resolution: 'upheld' | 'overturned' | 'adjusted'; notes: string; adjusted_hours?: number }
  ): Promise<Bug> => {
    return request<Bug>(`/bugs/${id}/resolve-dispute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Jira Integration
  getJiraStatus: async (): Promise<JiraIntegrationStatus> => {
    return request<JiraIntegrationStatus>('/integrations/jira/status');
  },

  getJiraLogs: async (): Promise<JiraSyncLogEntry[]> => {
    return request<JiraSyncLogEntry[]>('/integrations/jira/logs');
  },

  importJiraIssue: async (data: JiraIssueMapping): Promise<Bug> => {
    return request<Bug>('/integrations/jira/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Payroll Software Integration
  getPayrollSettings: async (): Promise<PayrollIntegrationSettings> => {
    return request<PayrollIntegrationSettings>('/payroll/integration/settings');
  },

  updatePayrollSettings: async (settings: Partial<PayrollIntegrationSettings>): Promise<PayrollIntegrationSettings> => {
    return request<PayrollIntegrationSettings>('/payroll/integration/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },

  getPayrollLogs: async (): Promise<PayrollSubmissionLogEntry[]> => {
    return request<PayrollSubmissionLogEntry[]>('/payroll/integration/logs');
  },

  getPayrollExportPreview: async (month?: string, format: 'json' | 'csv' = 'json'): Promise<{ payload: PayrollBatchSubmissionPayload; csv: string }> => {
    const q = new URLSearchParams();
    if (month) q.append('month', month);
    if (format) q.append('format', format);
    return request<{ payload: PayrollBatchSubmissionPayload; csv: string }>(`/payroll/integration/preview-export?${q.toString()}`);
  },

  submitPayrollBatch: async (data: { batch_id?: string; dry_run?: boolean }): Promise<PayrollSubmissionResult> => {
    return request<PayrollSubmissionResult>('/payroll/integration/submit-batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe: async (): Promise<User> => {
    return request<User>('/auth/me');
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    return request<Project[]>('/projects');
  },

  createProject: async (projectData: { name: string; code: string; description?: string }): Promise<Project> => {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  // --- Employee Workspace ---
  getEmployeeSummary: async (range: DateFilterOption = '30days', userId?: string): Promise<EmployeeSummary> => {
    const params = new URLSearchParams({ range });
    if (userId) params.append('user_id', userId);
    return request<EmployeeSummary>(`/employee/summary?${params.toString()}`);
  },

  // --- Tasks ---
  getTasks: async (filters?: { assigned_to_id?: string; module_id?: string; status?: string }): Promise<TaskAssignment[]> => {
    const params = new URLSearchParams();
    if (filters?.assigned_to_id) params.append('assigned_to_id', filters.assigned_to_id);
    if (filters?.module_id) params.append('module_id', filters.module_id);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<TaskAssignment[]>(`/tasks${queryString}`);
  },

  getTask: async (id: string): Promise<TaskAssignment & { submission_history?: SubmissionHistoryItem[] }> => {
    return request<TaskAssignment & { submission_history?: SubmissionHistoryItem[] }>(`/tasks/${id}`);
  },

  createTask: async (taskData: {
    module_id: string;
    title: string;
    description: string;
    assigned_to_id: string;
    priority?: TaskAssignment['priority'];
    deadline: string;
    project_id?: string;
    assigned_role?: string;
    acceptance_criteria?: string[];
    permitted_files?: string[];
  }): Promise<TaskAssignment> => {
    return request<TaskAssignment>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  updateTask: async (id: string, data: Partial<TaskAssignment>): Promise<TaskAssignment> => {
    return request<TaskAssignment>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  submitTask: async (taskId: string, notes: string): Promise<{ task: TaskAssignment; submission: SubmissionHistoryItem }> => {
    return request<{ task: TaskAssignment; submission: SubmissionHistoryItem }>(`/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  reviewTask: async (
    taskId: string, 
    decision: 'approved' | 'changes_requested', 
    feedback: string
  ): Promise<{ task: TaskAssignment; submission?: SubmissionHistoryItem }> => {
    return request<{ task: TaskAssignment; submission?: SubmissionHistoryItem }>(`/tasks/${taskId}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, feedback }),
    });
  },

  reopenTask: async (taskId: string, reason: string): Promise<{ task: TaskAssignment }> => {
    return request<{ task: TaskAssignment }>(`/tasks/${taskId}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Task Files & Development Diagnostics
  getTaskFiles: async (taskId: string): Promise<ProjectFile[]> => {
    return request<ProjectFile[]>(`/tasks/${taskId}/files`);
  },

  saveTaskFiles: async (taskId: string, files: Record<string, string>): Promise<{ success: boolean; saved_count: number }> => {
    return request<{ success: boolean; saved_count: number }>(`/tasks/${taskId}/files`, {
      method: 'POST',
      body: JSON.stringify({ files }),
    });
  },

  runTaskDiagnostics: async (taskId: string): Promise<{
    suite: string;
    test_name: string;
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    output: string;
    diagnostics: Array<{ type: string; message: string }>;
  }> => {
    return request<{
      suite: string;
      test_name: string;
      total_tests: number;
      passed_tests: number;
      failed_tests: number;
      output: string;
      diagnostics: Array<{ type: string; message: string }>;
    }>(`/tasks/${taskId}/test-run`, {
      method: 'POST',
    });
  },

  // Defect Rework Files & QA Verification
  getBugFiles: async (bugId: string): Promise<ProjectFile[]> => {
    return request<ProjectFile[]>(`/bugs/${bugId}/files`);
  },

  saveBugFiles: async (bugId: string, files: Record<string, string>): Promise<{ success: boolean; saved_count: number }> => {
    return request<{ success: boolean; saved_count: number }>(`/bugs/${bugId}/files`, {
      method: 'POST',
      body: JSON.stringify({ files }),
    });
  },

  verifyBugQA: async (
    bugId: string, 
    data: { passed: boolean; evidence: string; failure_reason?: string }
  ): Promise<Bug> => {
    return request<Bug>(`/bugs/${bugId}/qa-verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  runBugDiagnostics: async (bugId: string): Promise<{
    suite: string;
    test_name: string;
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    output: string;
    diagnostics: Array<{ type: string; message: string }>;
  }> => {
    return request(`/bugs/${bugId}/test-run`, {
      method: 'POST',
    });
  },

  // --- Work Sessions & Live Timers ---
  getActiveWorkSession: async (): Promise<(WorkSession & { elapsed_seconds: number }) | null> => {
    return request<(WorkSession & { elapsed_seconds: number }) | null>('/work-sessions/active');
  },

  getAllActiveWorkSessions: async (): Promise<(WorkSession & { elapsed_seconds: number; user_name: string })[]> => {
    return request<(WorkSession & { elapsed_seconds: number; user_name: string })[]>('/work-sessions/all-active');
  },

  getMyWorkSessions: async (): Promise<WorkSession[]> => {
    return request<WorkSession[]>('/work-sessions/my');
  },

  startWorkSession: async (sessionData: {
    target_id: string;
    target_title: string;
    work_type: 'original_development' | 'corrective_rework' | 'qa_testing';
    task_id?: string;
    bug_id?: string;
  }): Promise<WorkSession> => {
    return request<WorkSession>('/work-sessions/start', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  pauseWorkSession: async (id: string): Promise<WorkSession> => {
    return request<WorkSession>(`/work-sessions/${id}/pause`, {
      method: 'POST',
    });
  },

  resumeWorkSession: async (id: string): Promise<WorkSession> => {
    return request<WorkSession>(`/work-sessions/${id}/resume`, {
      method: 'POST',
    });
  },

  stopWorkSession: async (id: string, notes?: string): Promise<{ session: WorkSession; timeEntry: TimeEntry }> => {
    return request<{ session: WorkSession; timeEntry: TimeEntry }>(`/work-sessions/${id}/stop`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  // --- Time Corrections ---
  createTimeCorrection: async (data: {
    time_entry_id: string;
    requested_hours: number;
    reason: string;
  }): Promise<TimeCorrectionRequest> => {
    return request<TimeCorrectionRequest>('/time-corrections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTimeCorrections: async (filters?: { user_id?: string; status?: string }): Promise<TimeCorrectionRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.status) params.append('status', filters.status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<TimeCorrectionRequest[]>(`/time-corrections${queryString}`);
  },

  reviewTimeCorrection: async (
    id: string, 
    decision: 'approved' | 'rejected', 
    notes?: string
  ): Promise<TimeCorrectionRequest> => {
    return request<TimeCorrectionRequest>(`/time-corrections/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    });
  },

  // --- Manager Team Summary & Payroll ---
  getTeamSummary: async (range: DateFilterOption = '30days'): Promise<TeamSummary> => {
    return request<TeamSummary>(`/manager/team-summary?range=${range}`);
  },

  getPayrollSummary: async (): Promise<PayrollReportItem[]> => {
    return request<PayrollReportItem[]>('/payroll/summary');
  },

  getComprehensiveReport: async (): Promise<ComprehensiveReport> => {
    return request<ComprehensiveReport>('/reports/comprehensive');
  },

  // --- Client Portal ---
  getClientModules: async (): Promise<Module[]> => {
    return request<Module[]>('/client/modules');
  },

  getClientBugs: async (): Promise<Bug[]> => {
    return request<Bug[]>('/client/bugs');
  },

  reportClientDefect: async (data: {
    module_id: string;
    title: string;
    severity: BugSeverity;
    description: string;
    reproduction_steps?: string;
    evidence_urls?: string;
    bug_found_date?: string;
  }): Promise<Bug> => {
    return request<Bug>('/client/bugs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyClientDefectFix: async (id: string, data: { rating: number; feedback: string }): Promise<Bug> => {
    return request<Bug>(`/client/bugs/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  clientRequestReopen: async (id: string, data: { reason: string }): Promise<Bug> => {
    return request<Bug>(`/client/bugs/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};


