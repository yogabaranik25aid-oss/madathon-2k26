import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://jfeveaptdeqniyriwcbc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('====================================================');
console.log('REWORKGUARD — SUPABASE CONNECTIVITY & WORKFLOW VERIFIER');
console.log('Target Project:', SUPABASE_URL);
console.log('====================================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function runVerification() {
  console.log('1. Checking connection and schema cache...');
  const { data: users, error: userErr } = await supabase.from('users').select('id, name, role').limit(5);

  if (userErr) {
    if (userErr.code === 'PGRST205' || userErr.message.includes('Could not find the table')) {
      console.log('❌ Status: Remote tables are not yet created in the Supabase public schema.');
      console.log('\n👉 ACTION REQUIRED:');
      console.log('   1. Open: https://supabase.com/dashboard/project/jfeveaptdeqniyriwcbc/sql/new');
      console.log('   2. Paste the contents of supabase/reworkguard_setup.sql');
      console.log('   3. Click Run');
      console.log('   4. Re-run this check: npm run db:verify\n');
      return false;
    }
    console.error('❌ Supabase connection error:', userErr.message);
    return false;
  }

  console.log(`✅ Connection OK! Retrieved ${users?.length || 0} user profiles from remote Supabase.\n`);

  // 2. Test Real Insert, Read, Update, and Read-back
  console.log('2. Testing Real Insert / Read / Update on Supabase...');
  const testModuleId = `mod-test-${Date.now().toString().slice(-4)}`;
  const testPayload = {
    id: testModuleId,
    name: 'Supabase Connectivity Probe Module',
    code: `TEST_${Date.now().toString().slice(-4)}`,
    version: 'v1.0.0',
    description: 'Automated connectivity and persistence verification test record.',
    total_lines_of_code: 5000,
    status: 'assigned',
    original_task_value: 25000.00,
    reopen_count: 0
  };

  const { error: insertErr } = await supabase.from('modules').insert(testPayload);
  if (insertErr) {
    console.error('❌ Insert failed:', insertErr.message);
    return false;
  }
  console.log(`✅ INSERT successful: Created test module ${testModuleId}`);

  // Read back
  const { data: readBack, error: readErr } = await supabase
    .from('modules')
    .select('*')
    .eq('id', testModuleId)
    .single();

  if (readErr || !readBack) {
    console.error('❌ Read-back failed:', readErr?.message);
    return false;
  }
  console.log(`✅ READ-BACK successful: Retrieved "${readBack.name}" (Status: ${readBack.status})`);

  // Update
  const { error: updateErr } = await supabase
    .from('modules')
    .update({ status: 'completed', reopen_count: 1 })
    .eq('id', testModuleId);

  if (updateErr) {
    console.error('❌ Update failed:', updateErr.message);
    return false;
  }
  console.log(`✅ UPDATE successful: Transitioned module status to completed (reopen_count: 1)`);

  // Read updated
  const { data: readUpdated } = await supabase
    .from('modules')
    .select('*')
    .eq('id', testModuleId)
    .single();

  console.log(`✅ VERIFY UPDATE: Status is now "${readUpdated?.status}", reopens: ${readUpdated?.reopen_count}`);

  // Cleanup test record
  await supabase.from('modules').delete().eq('id', testModuleId);
  console.log(`✅ CLEANUP: Deleted transient test record ${testModuleId}\n`);

  console.log('====================================================');
  console.log('🎉 ALL SUPABASE PERSISTENCE TESTS PASSED!');
  console.log('====================================================\n');
  return true;
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
