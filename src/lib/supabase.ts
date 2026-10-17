import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { 
  User, 
  Module, 
  Bug, 
  TaskAssignment, 
  WorkSession, 
  AuditLog, 
  PayrollAdjustmentItem 
} from '../../types/index';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jfeveaptdeqniyriwcbc.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/**
 * Supabase Service Client for Direct Remote Data Operations
 * Implements CRUD workflows for tasks, bugs, work logs, payroll adjustments, and audit logs.
 */
export const supabaseService = {
  /**
   * Health and connectivity check against Supabase
   */
  async checkConnection(): Promise<{ connected: boolean; tablesFound: boolean; message: string }> {
    if (!isSupabaseConfigured) {
      return {
        connected: false,
        tablesFound: false,
        message: 'Supabase credentials are not configured in environment variables.'
      };
    }

    try {
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          return {
            connected: true,
            tablesFound: false,
            message: 'Connected to Supabase endpoint, but tables have not been created yet in the public schema.'
          };
        }
        return {
          connected: false,
          tablesFound: false,
          message: error.message
        };
      }
      return {
        connected: true,
        tablesFound: true,
        message: 'Successfully connected to remote Supabase database with public schema tables active.'
      };
    } catch (err: any) {
      return {
        connected: false,
        tablesFound: false,
        message: err?.message || 'Failed to connect to Supabase.'
      };
    }
  },

  /**
   * 1. Task Operations
   */
  async getTasks(filter?: { assigned_to_id?: string; status?: string }): Promise<TaskAssignment[]> {
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (filter?.assigned_to_id) query = query.eq('assigned_to_id', filter.assigned_to_id);
    if (filter?.status) query = query.eq('status', filter.status);

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase getTasks error:', error.message);
      throw error;
    }
    return (data || []) as TaskAssignment[];
  },

  async createTask(task: Partial<TaskAssignment>): Promise<TaskAssignment> {
    const payload = {
      ...task,
      id: task.id || `task-${Date.now().toString().slice(-5)}`,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('tasks').insert(payload).select().single();
    if (error) {
      console.warn('Supabase createTask error:', error.message);
      throw error;
    }
    return data as TaskAssignment;
  },

  async updateTaskStatus(taskId: string, status: string, notes?: string): Promise<TaskAssignment> {
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes) updatePayload.submission_notes = notes;

    const { data, error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.warn('Supabase updateTaskStatus error:', error.message);
      throw error;
    }
    return data as TaskAssignment;
  },

  /**
   * 2. Bug Reporting & Accountability
   */
  async getBugs(filter?: { module_id?: string; assigned_to_id?: string; status?: string }): Promise<Bug[]> {
    let query = supabase.from('bugs').select('*').order('created_at', { ascending: false });
    if (filter?.module_id) query = query.eq('module_id', filter.module_id);
    if (filter?.assigned_to_id) query = query.eq('assigned_to_id', filter.assigned_to_id);
    if (filter?.status) query = query.eq('status', filter.status);

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase getBugs error:', error.message);
      throw error;
    }
    return (data || []) as Bug[];
  },

  async reportBug(bug: Partial<Bug>): Promise<Bug> {
    const payload = {
      ...bug,
      id: bug.id || `bug-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('bugs').insert(payload).select().single();
    if (error) {
      console.warn('Supabase reportBug error:', error.message);
      throw error;
    }
    return data as Bug;
  },

  async updateBug(bugId: string, updates: Partial<Bug>): Promise<Bug> {
    const { data, error } = await supabase
      .from('bugs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', bugId)
      .select()
      .single();

    if (error) {
      console.warn('Supabase updateBug error:', error.message);
      throw error;
    }
    return data as Bug;
  },

  /**
   * 3. Work Logs & Rework Separation
   */
  async recordWorkSession(session: Partial<WorkSession>): Promise<WorkSession> {
    const payload = {
      ...session,
      id: session.id || `ws-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('work_sessions').insert(payload).select().single();
    if (error) {
      console.warn('Supabase recordWorkSession error:', error.message);
      throw error;
    }
    return data as WorkSession;
  },

  async getWorkSessions(userId?: string): Promise<WorkSession[]> {
    let query = supabase.from('work_sessions').select('*').order('session_start', { ascending: false });
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase getWorkSessions error:', error.message);
      throw error;
    }
    return (data || []) as WorkSession[];
  },

  /**
   * 4. Payroll Adjustments (Tripartite Protected)
   */
  async getPayrollAdjustments(employeeId?: string): Promise<PayrollAdjustmentItem[]> {
    let query = supabase.from('payroll_adjustments').select('*').order('created_at', { ascending: false });
    if (employeeId) query = query.eq('employee_id', employeeId);

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase getPayrollAdjustments error:', error.message);
      throw error;
    }
    return (data || []) as PayrollAdjustmentItem[];
  },

  /**
   * 5. Audit Logging
   */
  async addAuditLog(entry: {
    entity_type: string;
    entity_id: string;
    action: string;
    user_id: string;
    details: string;
  }): Promise<AuditLog> {
    const payload = {
      id: `aud-${Date.now().toString().slice(-6)}`,
      ...entry,
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('audit_logs').insert(payload).select().single();
    if (error) {
      console.warn('Supabase addAuditLog error:', error.message);
      throw error;
    }
    return data as AuditLog;
  }
};
