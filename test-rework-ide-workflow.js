import http from 'http';
import { Buffer } from 'buffer';

function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const request = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    request.on('error', reject);
    if (data) request.write(data);
    request.end();
  });
}

async function run() {
  console.log('--- Testing Rework IDE Workflow & Auto-Pause ---');

  // 1. Login as developer Alex Rivera (usr-2)
  const devLogin = await req('POST', '/api/auth/login', { identifier: 'alex.rivera@reworkguard.io', password: 'password123' });
  if (!devLogin.body.success) {
    console.error('Failed dev login:', devLogin.body);
    process.exit(1);
  }
  const token = devLogin.body.data.token;
  console.log('✅ Developer logged in');

  // 2. Fetch assigned bugs
  const bugsRes = await req('GET', '/api/bugs?assigned_to_id=usr-2', null, token);
  const bugs = bugsRes.body.data || bugsRes.body;
  const targetBug = bugs.find(b => b.status !== 'closed') || bugs[0];
  console.log(`✅ Found assigned defect: ${targetBug.id} - "${targetBug.title}" (Status: ${targetBug.status})`);

  // 3. Test getBugFiles (verifies developer's previous work is loaded)
  const filesRes = await req('GET', `/api/bugs/${targetBug.id}/files`, null, token);
  if (!filesRes.body.success || !Array.isArray(filesRes.body.data)) {
    console.error('❌ Failed to fetch bug files:', filesRes.body);
    process.exit(1);
  }
  console.log(`✅ Loaded ${filesRes.body.data.length} source code files for defect ${targetBug.id}`);

  // 4. Test Starting Work Session (Clicking "Open IDE")
  const sessionRes = await req('POST', '/api/work-sessions/start', {
    target_id: targetBug.id,
    target_title: targetBug.title,
    work_type: 'corrective_rework',
    bug_id: targetBug.id
  }, token);

  if (!sessionRes.body.success) {
    console.error('❌ Failed to start work session:', sessionRes.body);
    process.exit(1);
  }
  const session = sessionRes.body.data;
  console.log(`✅ Started timer session on Open IDE: ${session.id} (Status: ${session.status})`);

  // 5. Test Auto-Pause on Page Leave
  const pauseRes = await req('POST', `/api/work-sessions/${session.id}/pause`, null, token);
  if (!pauseRes.body.success || pauseRes.body.data.status !== 'paused') {
    console.error('❌ Failed to pause session:', pauseRes.body);
    process.exit(1);
  }
  console.log(`✅ Auto-paused timer session on page leave: ${session.id} (Status: ${pauseRes.body.data.status})`);

  // 6. Test Idempotent Pause (calling pause again should not error)
  const repeatPauseRes = await req('POST', `/api/work-sessions/${session.id}/pause`, null, token);
  if (!repeatPauseRes.body.success) {
    console.error('❌ Repeat pause errored:', repeatPauseRes.body);
    process.exit(1);
  }
  console.log('✅ Idempotent pause succeeded without error');

  // 7. Test Resume Session (re-entering IDE)
  const resumeRes = await req('POST', `/api/work-sessions/${session.id}/resume`, null, token);
  if (!resumeRes.body.success || resumeRes.body.data.status !== 'active') {
    console.error('❌ Failed to resume session:', resumeRes.body);
    process.exit(1);
  }
  console.log(`✅ Resumed timer session on reopening IDE: ${session.id} (Status: ${resumeRes.body.data.status})`);

  // 8. Test Idempotent Resume (calling resume while active should not error)
  const repeatResumeRes = await req('POST', `/api/work-sessions/${session.id}/resume`, null, token);
  if (!repeatResumeRes.body.success || repeatResumeRes.body.data.status !== 'active') {
    console.error('❌ Repeat resume errored:', repeatResumeRes.body);
    process.exit(1);
  }
  console.log('✅ Idempotent resume succeeded without error');

  // 9. Test Saving Fix in IDE
  const saveRes = await req('POST', `/api/bugs/${targetBug.id}/files`, {
    files: {
      [filesRes.body.data[0].path]: filesRes.body.data[0].content + '\n// Corrective patch applied'
    }
  }, token);
  if (!saveRes.body.success) {
    console.error('❌ Failed to save bug files:', saveRes.body);
    process.exit(1);
  }
  console.log('✅ Saved modified fix files in IDE');

  // 10. Pause session so it does not remain unpaused
  await req('POST', `/api/work-sessions/${session.id}/pause`, null, token);
  console.log('✅ Test complete: Cleanly paused');

  console.log('\n🎉 ALL REWORK IDE & TIMER AUTO-PAUSE TESTS PASSED (100%)');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
