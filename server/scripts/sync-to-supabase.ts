import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DataStore } from '../db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://jfeveaptdeqniyriwcbc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('====================================================');
console.log('REWORKGUARD — SUPABASE DATA MIGRATION & SYNC TOOL');
console.log('Target Project:', SUPABASE_URL);
console.log('====================================================\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be configured in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

const dataFilePath = path.resolve(__dirname, '../.reworkguard-data.json');

async function checkSchemaExists(): Promise<boolean> {
  console.log('🔍 Checking remote schema in Supabase project...');
  const { data, error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
      console.warn('⚠️  Remote tables not found in public schema yet.');
      console.warn('👉 Please run the migration script in your Supabase SQL Editor:');
      console.warn('   File: server/migrations/001_complete_reworkguard_supabase_schema.sql');
      console.warn('   Dashboard URL: https://supabase.com/dashboard/project/jfeveaptdeqniyriwcbc/sql/new\n');
      return false;
    }
    console.error('❌ Supabase check error:', error.message);
    return false;
  }
  console.log('✅ Remote schema verified! Supabase tables exist in public schema.\n');
  return true;
}

async function syncTable(tableName: string, records: any[], keyField: string = 'id'): Promise<{ success: number; failed: number }> {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return { success: 0, failed: 0 };
  }

  process.stdout.write(`⏳ Syncing ${tableName.padEnd(25)} (${records.length} records)... `);

  let successCount = 0;
  let failCount = 0;

  // Deduplicate records by keyField to avoid PostgreSQL ON CONFLICT batch errors
  const recordMap = new Map<any, any>();
  for (const r of records) {
    const key = r[keyField];
    if (key !== undefined && key !== null) {
      recordMap.set(key, r);
    } else {
      recordMap.set(Math.random(), r);
    }
  }
  const dedupedRecords = Array.from(recordMap.values());

  // Process in chunks of 50 to avoid request payload limits
  const chunkSize = 50;
  for (let i = 0; i < dedupedRecords.length; i += chunkSize) {
    const rawChunk = dedupedRecords.slice(i, i + chunkSize);
    const chunk = rawChunk.map(r => DataStore.sanitizeForSupabase(tableName, r));
    const { error } = await supabase.from(tableName).upsert(chunk, { onConflict: keyField });
    if (error) {
      failCount += chunk.length;
      console.log(`\n   ❌ Batch failed for ${tableName}:`, error.message);
    } else {
      successCount += chunk.length;
    }
  }

  if (failCount === 0) {
    console.log(`✅ Synced ${successCount} records.`);
  } else {
    console.log(`⚠️  ${successCount} succeeded, ${failCount} failed.`);
  }

  return { success: successCount, failed: failCount };
}

async function main() {
  const schemaReady = await checkSchemaExists();
  if (!schemaReady) {
    console.log('To complete setup:');
    console.log('1. Open https://supabase.com/dashboard/project/jfeveaptdeqniyriwcbc/sql/new');
    console.log('2. Paste the contents of server/migrations/001_complete_reworkguard_supabase_schema.sql');
    console.log('3. Click Run');
    console.log('4. Re-run this command: npm run db:sync\n');
    return;
  }

  if (!fs.existsSync(dataFilePath)) {
    console.error('❌ No local .reworkguard-data.json found to sync.');
    return;
  }

  console.log(`📂 Reading authoritative application data from ${path.basename(dataFilePath)}...`);
  const rawData = fs.readFileSync(dataFilePath, 'utf8');
  const data = JSON.parse(rawData);

  console.log('🚀 Beginning authoritative sync to Supabase...\n');

  const report: Record<string, { success: number; failed: number }> = {};

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

  const normalizedModules = (data.modules || []).map((m: any) => ({
    ...m,
    code: moduleCodeDisambiguations[m.id] || m.code,
    original_task_value: Number(m.original_task_value || m.originalTaskValue) || 50000.00
  }));

  const normalizedTasks = (data.tasks || []).map((t: any) => ({
    ...t,
    original_task_value: Number(t.original_task_value || t.originalTaskValue) || 50000.00
  }));

  const normalizedBugs = (data.bugs || []).map((b: any) => {
    const modId = b.moduleId || b.module_id;
    let priority = b.priority;
    if (priority !== 'p0' && priority !== 'p1' && priority !== 'p2' && priority !== 'p3') {
      if (priority === 'critical' || b.severity === 'critical') priority = 'p0';
      else if (priority === 'high' || b.severity === 'high') priority = 'p1';
      else if (priority === 'medium' || b.severity === 'medium') priority = 'p2';
      else priority = 'p3';
    }
    return {
      ...b,
      priority,
      module_code: moduleCodeDisambiguations[modId] || b.module_code || b.moduleCode,
      moduleCode: moduleCodeDisambiguations[modId] || b.module_code || b.moduleCode
    };
  });

  if (data.users) report['users'] = await syncTable('users', data.users);
  if (data.projects) report['projects'] = await syncTable('projects', data.projects);
  if (data.modules) report['modules'] = await syncTable('modules', normalizedModules);
  if (data.tasks) report['tasks'] = await syncTable('tasks', normalizedTasks);
  if (data.submissions) report['submissions'] = await syncTable('submissions', data.submissions);
  const normalizedTimeEntries = (data.timeEntries || []).map((te: any) => ({
    ...te,
    hours_spent: Math.max(0.01, Number(te.hours_spent || te.hoursSpent) || 0.01),
    work_category: te.work_category || (te.bug_id ? 'corrective_maintenance' : 'feature_development'),
    work_description: te.work_description || 'Engineering work recorded',
    date: te.date || new Date().toISOString().split('T')[0]
  }));

  if (data.workSessions) report['work_sessions'] = await syncTable('work_sessions', data.workSessions);
  if (data.bugs) report['bugs'] = await syncTable('bugs', normalizedBugs);
  if (data.timeEntries) report['time_entries'] = await syncTable('time_entries', normalizedTimeEntries);

  if (data.reviews) report['reviews'] = await syncTable('reviews', data.reviews);
  if (data.auditLogs) report['audit_logs'] = await syncTable('audit_logs', data.auditLogs);
  if (data.payrollAdjustments) report['payroll_adjustments'] = await syncTable('payroll_adjustments', data.payrollAdjustments);
  if (data.notifications) report['notifications'] = await syncTable('notifications', data.notifications);
  if (data.jiraSyncLogs) report['jira_sync_logs'] = await syncTable('jira_sync_logs', data.jiraSyncLogs);
  if (data.payrollSubmissionLogs) report['payroll_submission_logs'] = await syncTable('payroll_submission_logs', data.payrollSubmissionLogs);

  console.log('\n====================================================');
  console.log('MIGRATION SUMMARY');
  console.log('====================================================');
  let totalSuccess = 0;
  let totalFailed = 0;
  for (const [table, counts] of Object.entries(report)) {
    totalSuccess += counts.success;
    totalFailed += counts.failed;
    console.log(` • ${table.padEnd(25)}: ${counts.success} synced, ${counts.failed} errors`);
  }
  console.log(`\nTotal Records Synced: ${totalSuccess} | Total Failures: ${totalFailed}`);
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
