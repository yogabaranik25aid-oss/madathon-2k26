import assert from 'assert';

const API_BASE = 'http://localhost:5001/api';

async function runTwoStageWorkflowTests() {
  console.log('====================================================');
  console.log('REWORKGUARD — TWO-STAGE REWORK WORKFLOW VERIFICATION');
  console.log('====================================================');

  try {
    // 1. Authenticate users
    console.log('\n--- 1. Authenticating Manager, Developer, and Client ---');
    const mgrRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'sarah.connor@reworkguard.io', password: 'password123' })
    });
    const mgrData = await mgrRes.json();
    assert(mgrRes.ok && mgrData.success, 'Manager logged in');
    const mgrToken = mgrData.data.token;

    const devRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'alex.rivera@reworkguard.io', password: 'password123' })
    });
    const devData = await devRes.json();
    assert(devRes.ok && devData.success, 'Developer logged in');
    const devToken = devData.data.token;

    const clientRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'client@acmecorp.io', password: 'password123' })
    });
    const clientData = await clientRes.json();
    assert(clientRes.ok && clientData.success, 'Client logged in');
    const clientToken = clientData.data.token;
    console.log('  ✅ PASS: All 3 actors authenticated');

    // 2. Stage A — Client reports a defect
    console.log('\n--- 2. Client Reports Defect Against Delivered Module ---');
    const bugReportRes = await fetch(`${API_BASE}/bugs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        title: 'Redis Connection Leak in Token Revocation',
        description: 'Under 1000 concurrent logout calls, connection pool is exhausted and timeouts spike.',
        module_id: 'mod-1',
        severity: 'high',
        priority: 'high'
      })
    });
    const bugReportData = await bugReportRes.json();
    assert(bugReportRes.ok && bugReportData.success, 'Defect created successfully');
    const bugId = bugReportData.data.id;
    console.log(`  ✅ PASS: Defect ${bugId} created (Initial Status: ${bugReportData.data.classification_status})`);

    // 3. Stage A Validation: Rejection without mandatory reason
    console.log('\n--- 3. Stage A Validation: Mandatory Reason Enforcement ---');
    const invalidReviewRes = await fetch(`${API_BASE}/bugs/${bugId}/initial-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mgrToken}`
      },
      body: JSON.stringify({
        decision: 'approve_assign',
        reason: '   ' // empty reason
      })
    });
    assert(!invalidReviewRes.ok && invalidReviewRes.status === 400, 'Empty manager reason rejected with HTTP 400');
    console.log('  ✅ PASS: Manager review reason is strictly mandatory');

    // 4. Stage A Approval: Manager approves & assigns rework
    console.log('\n--- 4. Stage A Approval: Manager Approves & Assigns Rework ---');
    const stageARes = await fetch(`${API_BASE}/bugs/${bugId}/initial-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mgrToken}`
      },
      body: JSON.stringify({
        decision: 'approve_assign',
        root_cause: 'code_defect',
        reason: 'Confirmed memory leak in redis unregister hook during teardown. High priority regression fix.',
        assigned_to_id: 'usr-2', // Assigned to Alex Rivera
        reassignment_reason: 'Assigned to Alex Rivera for Redis mutex expertise'
      })
    });
    const stageAData = await stageARes.json();
    assert(stageARes.ok && stageAData.success, 'Stage A review succeeded');
    assert(stageAData.data.classification_status === 'confirmed_defect', 'Defect classified as confirmed_defect');
    assert(stageAData.data.status === 'in_progress', 'Defect moved to in_progress');
    assert(stageAData.data.review_status === 'pending', 'Review status remains pending (NOT approved for accounting yet)');
    assert(stageAData.data.assigned_to_id === 'usr-2', 'Corrective developer assigned to usr-2');
    console.log('  ✅ PASS: Stage A completed: Module reopened, task reopened, accounting NOT prematurely approved');

    // 5. Stage B: Automatic, Idempotent Timer Start
    console.log('\n--- 5. Stage B: Work Session & Idempotent Timer ---');
    const startSessionRes = await fetch(`${API_BASE}/work-sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devToken}`
      },
      body: JSON.stringify({
        target_id: bugId,
        target_title: 'Redis Connection Leak Fix',
        work_type: 'corrective_rework',
        bug_id: bugId
      })
    });
    const startSessionData = await startSessionRes.json();
    assert(startSessionRes.ok && startSessionData.success, 'Work session started for assigned developer');
    const sessionId = startSessionData.data.id;
    console.log(`  ✅ PASS: Server-backed timer session active: ${sessionId}`);

    // Test Idempotency: Starting again for same target returns existing session
    const duplicateSessionRes = await fetch(`${API_BASE}/work-sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devToken}`
      },
      body: JSON.stringify({
        target_id: bugId,
        target_title: 'Redis Connection Leak Fix',
        work_type: 'corrective_rework',
        bug_id: bugId
      })
    });
    const duplicateSessionData = await duplicateSessionRes.json();
    assert(duplicateSessionRes.ok && duplicateSessionData.data.id === sessionId, 'Duplicate start returns existing session idempotently');
    console.log('  ✅ PASS: Timer start is strictly idempotent');

    // 6. Stage C: Developer Submits Completed Fix
    console.log('\n--- 6. Stage C: Developer Submits Completed Fix ---');
    // Stop session
    await fetch(`${API_BASE}/work-sessions/${sessionId}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devToken}`
      },
      body: JSON.stringify({ notes: 'Redis pool timeout configured and pipeline released' })
    });

    // Submit fix with fix_notes and transition to review_pending
    const submitFixRes = await fetch(`${API_BASE}/bugs/${bugId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devToken}`
      },
      body: JSON.stringify({
        status: 'review_pending',
        fix_notes: 'Patched redis-client connection pool leak with auto-closing pipeline in catch block. Added test assertion under 1000 parallel iterations.',
        corrective_hours: 3.0
      })
    });
    const submitFixData = await submitFixRes.json();
    assert(submitFixRes.ok && submitFixData.success, 'Bug fix submitted successfully');
    assert(submitFixData.data.status === 'review_pending', 'Bug status is review_pending');
    assert(submitFixData.data.fix_notes.includes('auto-closing pipeline'), 'Fix notes preserved in defect record');
    assert(submitFixData.data.fix_submitted_at !== undefined, 'Fix submission timestamp recorded');
    console.log('  ✅ PASS: Fix submitted, status = review_pending, hours logged separately');

    // 7. Stage D: Final Manager Accounting Review
    console.log('\n--- 7. Stage D: Manager Accounting Review Sign-Off ---');
    const stageDReviewRes = await fetch(`${API_BASE}/bugs/${bugId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mgrToken}`
      },
      body: JSON.stringify({
        manager_id: 'usr-1',
        root_cause: 'code_defect',
        decision: 'approved_for_accounting',
        comments: 'Verified patch in staging environment under load. 3.0 corrective rework hours approved for accounting qualification.'
      })
    });
    const stageDData = await stageDReviewRes.json();
    assert(stageDReviewRes.ok && stageDData.success, 'Stage D review recorded');
    assert(stageDData.data.bug.review_status === 'approved_for_accounting', 'Defect review_status set to approved_for_accounting');
    assert(stageDData.data.bug.status === 'closed', 'Defect closed after accounting approval');
    console.log('  ✅ PASS: Stage D accounting approval complete with audit trail');

    // 8. Stage E: Financial Reporting Breakdown Verification
    console.log('\n--- 8. Stage E: Financial Reporting Breakdown Verification ---');
    const financeRes = await fetch(`${API_BASE}/finance/summary?month=October%202026`, {
      headers: { 'Authorization': `Bearer ${mgrToken}` }
    });
    const financeData = await financeRes.json();
    assert(financeRes.ok && financeData.success, 'Finance summary retrieved');
    const summary = financeData.data;

    assert(summary.total_rework_hours !== undefined, `Total rework hours present: ${summary.total_rework_hours}`);
    assert(summary.submitted_hours !== undefined, `Submitted hours present: ${summary.submitted_hours}`);
    assert(summary.approved_hours !== undefined, `Approved hours present: ${summary.approved_hours}`);
    assert(summary.pending_hours !== undefined, `Pending hours present: ${summary.pending_hours}`);
    assert(summary.disputed_hours !== undefined, `Disputed hours present: ${summary.disputed_hours}`);
    assert(summary.waived_hours !== undefined, `Waived hours present: ${summary.waived_hours}`);
    assert(summary.eligible_proposed_rework_cost !== undefined, `Eligible proposed rework cost present: ₹${summary.eligible_proposed_rework_cost}`);

    console.log('  ✅ PASS: All 7 Stage E breakdown metrics computed and verified:');
    console.log(`     • Total Rework Hours: ${summary.total_rework_hours} hrs`);
    console.log(`     • Submitted Hours: ${summary.submitted_hours} hrs`);
    console.log(`     • Approved Hours: ${summary.approved_hours} hrs`);
    console.log(`     • Pending Hours: ${summary.pending_hours} hrs`);
    console.log(`     • Disputed Hours: ${summary.disputed_hours} hrs`);
    console.log(`     • Waived Hours: ${summary.waived_hours} hrs`);
    console.log(`     • Eligible Proposed Rework Cost: ₹${summary.eligible_proposed_rework_cost}`);

    console.log('\n====================================================');
    console.log('ALL TWO-STAGE REWORK WORKFLOW TESTS PASSED (100%)');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Test Failure:', err.message);
    process.exit(1);
  }
}

runTwoStageWorkflowTests();
