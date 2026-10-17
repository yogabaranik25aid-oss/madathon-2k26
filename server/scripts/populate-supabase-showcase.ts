import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://jfeveaptdeqniyriwcbc.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('====================================================');
console.log('REWORKGUARD — COMPREHENSIVE SUPABASE SHOWCASE SEEDER');
console.log('Target Project:', SUPABASE_URL);
console.log('====================================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function populateShowcase() {
  console.log('1. Checking connection to Supabase...');
  const { error: testErr } = await supabase.from('users').select('id').limit(1);
  if (testErr) {
    console.error('❌ Connection error:', testErr.message);
    process.exit(1);
  }
  console.log('✅ Supabase connected!\n');

  // --- 1. USERS ---
  console.log('📦 1. Seeding Users (all 5 system personas)...');
  const users = [
    {
      id: 'usr-1',
      name: 'Sarah Connor',
      email: 'sarah.connor@reworkguard.io',
      username: 'sarah.connor',
      password: '37dfa81e9f1a09d3b45e9988296d9a9fb9cf41d8e12f6ee2466b033e0854d6fa.51fb22bbaef4db521ffb858ec4602f0687157bc2626e257bb2d4de65fc9fa693',
      role: 'manager',
      employee_id: 'EMP-001',
      hourly_rate: 750.00,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      created_at: '2026-01-10T08:00:00Z'
    },
    {
      id: 'usr-2',
      name: 'Alex Rivera',
      email: 'alex.rivera@reworkguard.io',
      username: 'alex.rivera',
      password: '29384758b9cf41d8e12f6ee2466b033e0854d6fa37dfa81e9f1a09d3b45e9988.62fb22bbaef4db521ffb858ec4602f0687157bc2626e257bb2d4de65fc9fa693',
      role: 'developer',
      employee_id: 'EMP-002',
      engineering_role: 'frontend_developer',
      hourly_rate: 500.00,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      created_at: '2026-01-15T09:30:00Z'
    },
    {
      id: 'usr-3',
      name: 'Devon Lee',
      email: 'devon.lee@reworkguard.io',
      username: 'devon.lee',
      password: '29384758b9cf41d8e12f6ee2466b033e0854d6fa37dfa81e9f1a09d3b45e9988.62fb22bbaef4db521ffb858ec4602f0687157bc2626e257bb2d4de65fc9fa693',
      role: 'developer',
      employee_id: 'EMP-003',
      engineering_role: 'backend_developer',
      hourly_rate: 500.00,
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
      created_at: '2026-02-01T10:15:00Z'
    },
    {
      id: 'usr-4',
      name: 'Priya Sharma',
      email: 'priya.sharma@reworkguard.io',
      username: 'priya.sharma',
      password: '74829103c8ae32d7e12f6ee2466b033e0854d6fa37dfa81e9f1a09d3b45e9988.73fb22bbaef4db521ffb858ec4602f0687157bc2626e257bb2d4de65fc9fa693',
      role: 'qa',
      employee_id: 'EMP-004',
      engineering_role: 'qa_engineer',
      hourly_rate: 450.00,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      created_at: '2026-02-10T11:00:00Z'
    },
    {
      id: 'usr-5',
      name: 'Marcus Vance',
      email: 'marcus.vance@reworkguard.io',
      username: 'marcus.vance',
      password: '29384758b9cf41d8e12f6ee2466b033e0854d6fa37dfa81e9f1a09d3b45e9988.62fb22bbaef4db521ffb858ec4602f0687157bc2626e257bb2d4de65fc9fa693',
      role: 'developer',
      employee_id: 'EMP-005',
      engineering_role: 'database_designer',
      hourly_rate: 600.00,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      created_at: '2026-02-15T14:20:00Z'
    },
    {
      id: 'usr-6',
      name: 'Elena Rostova',
      email: 'elena.rostova@reworkguard.io',
      username: 'elena.rostova',
      password: '83920194d7be21c6e12f6ee2466b033e0854d6fa37dfa81e9f1a09d3b45e9988.84fb22bbaef4db521ffb858ec4602f0687157bc2626e257bb2d4de65fc9fa693',
      role: 'hr',
      employee_id: 'EMP-006',
      hourly_rate: 800.00,
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80',
      created_at: '2026-03-01T09:00:00Z'
    },
    {
      id: 'usr-7',
      name: 'David Kim',
      email: 'david.kim@reworkguard.io',
      username: 'david.kim',
      password: '94830285e6ad10b5e12f6ee2466b033e0854d6fa37dfa81e9f1a09d3b45e9988.95fb22bbaef4db521ffb858ec4602f0687157bc2626e257bb2d4de65fc9fa693',
      role: 'admin',
      employee_id: 'EMP-007',
      hourly_rate: 900.00,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      created_at: '2026-01-05T09:00:00Z'
    },
    {
      id: 'usr-8',
      name: 'Acme Enterprise (Client)',
      email: 'client@acmecorp.io',
      username: 'client.acme',
      password: '4f63c87e9196b297b83f4fbb4e27f6e4a64ef8d4ec097f58d044a6de265e1eb2.c5483ea4e7be0079c6d4e5f2fa64380a98f121a2c3a5e8f49a888e0b23028bfa',
      role: 'client',
      client_id: 'CLI-001',
      employee_id: 'CLI-001',
      hourly_rate: 0.00,
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
      created_at: '2026-01-08T10:00:00Z'
    }
  ];
  const { error: userErr } = await supabase.from('users').upsert(users);
  if (userErr) console.warn('Users upsert note:', userErr.message);
  else console.log(`✅ Upserted ${users.length} users.`);

  // --- 2. PROJECTS ---
  console.log('📦 2. Seeding Projects...');
  const projects = [
    {
      id: 'PRJ-LLM',
      name: 'LLM Application Platform',
      code: 'LLM_APP',
      description: 'Core AI agent, streaming chat, and task execution application suite',
      status: 'active',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      created_at: '2026-01-01T09:00:00Z'
    },
    {
      id: 'PRJ-ECOM',
      name: 'OmniCommerce Cloud Enterprise',
      code: 'OMNI_ECOM',
      description: 'Multi-tenant high-throughput e-commerce platform with automated logistics',
      status: 'active',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      created_at: '2026-01-05T09:00:00Z'
    },
    {
      id: 'PRJ-CORE',
      name: 'Enterprise Core Services',
      code: 'CORE_SERV',
      description: 'Mission-critical shared microservices: auth, payments, notifications, data warehouse',
      status: 'active',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      created_at: '2026-01-08T09:00:00Z'
    }
  ];
  const { error: prjErr } = await supabase.from('projects').upsert(projects);
  if (prjErr) console.warn('Projects upsert note:', prjErr.message);
  else console.log(`✅ Upserted ${projects.length} projects.`);

  // --- 3. MODULES ---
  console.log('📦 3. Seeding Modules (with strictly unique business codes)...');
  const modules = [
    {
      id: 'mod-0391',
      name: 'Small Inventory Widget',
      code: 'INV_WIDGET_0391',
      version: 'v2.1.0',
      description: 'Real-time stock synchronization and multi-warehouse allocation widget for checkout.',
      owner_id: 'usr-2',
      total_lines_of_code: 8500,
      status: 'completed',
      original_task_value: 65000.00,
      project_name: 'OmniCommerce Cloud Enterprise',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      reopen_count: 2,
      delivered_at: '2026-09-28T14:00:00Z',
      client_verified_at: '2026-10-02T11:30:00Z',
      client_star_rating: 4.8,
      client_feedback: 'Feature rich and responsive widget, minor stock latency was promptly addressed.',
      created_at: '2026-01-15T09:30:00Z',
      updated_at: '2026-10-02T11:30:00Z',
      completion_date: '2026-10-02T11:30:00Z',
      committed_deadline: '2026-09-30T18:00:00Z'
    },
    {
      id: 'mod-1',
      name: 'Billing & Checkout Engine',
      code: 'BILLING_ENG',
      version: 'v2.4.0',
      description: 'Stripe and Adyen payment processing pipeline, tax calculations, and invoice generation.',
      owner_id: 'usr-2',
      total_lines_of_code: 14200,
      status: 'in_progress',
      original_task_value: 75000.00,
      project_name: 'OmniCommerce Cloud Enterprise',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      reopen_count: 1,
      delivered_at: '2026-10-01T10:00:00Z',
      created_at: '2026-01-20T10:00:00Z',
      updated_at: '2026-10-12T16:00:00Z'
    },
    {
      id: 'mod-2',
      name: 'JWT Auth & Session Manager',
      code: 'AUTH_SRV',
      version: 'v1.8.2',
      description: 'Distributed OAuth2, MFA session tokens, and cryptographic access revocation.',
      owner_id: 'usr-3',
      total_lines_of_code: 9800,
      status: 'completed',
      original_task_value: 50000.00,
      project_name: 'LLM Application Platform',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      reopen_count: 1,
      delivered_at: '2026-09-15T12:00:00Z',
      client_verified_at: '2026-09-20T15:00:00Z',
      client_star_rating: 5.0,
      client_feedback: 'Zero downtime upgrade, flawless session token rotation.',
      created_at: '2026-02-01T09:00:00Z',
      updated_at: '2026-09-20T15:00:00Z',
      completion_date: '2026-09-20T15:00:00Z'
    },
    {
      id: 'mod-3',
      name: 'Distributed Database Partitioning',
      code: 'DB_PARTITION',
      version: 'v1.2.0',
      description: 'Horizontal table sharding, PostgreSQL partition routing, and read-replica replication.',
      owner_id: 'usr-5',
      total_lines_of_code: 18500,
      status: 'under_fix',
      original_task_value: 90000.00,
      project_name: 'OmniCommerce Cloud Enterprise',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      reopen_count: 3,
      created_at: '2026-02-15T14:00:00Z',
      updated_at: '2026-10-15T09:30:00Z'
    },
    {
      id: 'mod-4',
      name: 'Customer Notification Dispatcher',
      code: 'NOTIF_DISPATCH',
      version: 'v2.0.1',
      description: 'Omni-channel push, SendGrid transactional emails, and Twilio SMS verification.',
      owner_id: 'usr-2',
      total_lines_of_code: 7200,
      status: 'completed',
      original_task_value: 45000.00,
      project_name: 'LLM Application Platform',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      reopen_count: 0,
      delivered_at: '2026-09-10T16:00:00Z',
      client_verified_at: '2026-09-12T10:00:00Z',
      client_star_rating: 4.9,
      client_feedback: 'Fast dispatch latencies under 40ms, highly reliable.',
      created_at: '2026-02-10T11:00:00Z',
      updated_at: '2026-09-12T10:00:00Z',
      completion_date: '2026-09-12T10:00:00Z'
    },
    {
      id: 'mod-5',
      name: 'Executive Analytics & Reporting',
      code: 'ANALYTICS_REP',
      version: 'v1.4.0',
      description: 'Streamed BigQuery reporting engine, aggregations, and CSV/PDF export generator.',
      owner_id: 'usr-3',
      total_lines_of_code: 11000,
      status: 'in_progress',
      original_task_value: 55000.00,
      project_name: 'LLM Application Platform',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      reopen_count: 0,
      created_at: '2026-03-01T09:00:00Z',
      updated_at: '2026-10-10T12:00:00Z'
    },
    {
      id: 'mod-6',
      name: 'Global Payment Gateway Adapters',
      code: 'PAY_GATEWAY_MOD6',
      version: 'v1.5.0',
      description: 'Unified adapter layer connecting PayPal, Klarna, Apple Pay, and Google Pay checkout flows.',
      owner_id: 'usr-2',
      total_lines_of_code: 12400,
      status: 'assigned',
      original_task_value: 60000.00,
      project_name: 'OmniCommerce Cloud Enterprise',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      reopen_count: 0,
      created_at: '2026-03-15T09:00:00Z',
      updated_at: '2026-10-14T11:00:00Z'
    },
    {
      id: 'mod-7',
      name: 'Offline Sync & Mobile Reconciliation',
      code: 'MOBILE_SYNC_MOD7',
      version: 'v1.1.0',
      description: 'Client-side IndexedDB conflict-free replicated data types (CRDT) sync protocol for mobile POS.',
      owner_id: 'usr-3',
      total_lines_of_code: 9300,
      status: 'reopened',
      original_task_value: 52000.00,
      project_name: 'LLM Application Platform',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      reopen_count: 1,
      created_at: '2026-03-20T10:00:00Z',
      updated_at: '2026-10-15T14:00:00Z'
    }
  ];
  const { error: modErr } = await supabase.from('modules').upsert(modules);
  if (modErr) console.warn('Modules upsert note:', modErr.message);
  else console.log(`✅ Upserted ${modules.length} modules.`);

  // --- 4. TASKS ---
  console.log('📦 4. Seeding Tasks (across assigned, in_progress, submitted, changes_requested, approved, reopened, under_fix)...');
  const tasks = [
    {
      id: 'task-llm-1',
      project_id: 'PRJ-LLM',
      project_name: 'LLM Application Platform',
      module_id: 'mod-1',
      module_name: 'Billing & Checkout Engine',
      module_code: 'BILLING_ENG',
      module_version: 'v2.4.0',
      title: 'Implement Streaming Markdown Chat Interface',
      description: 'Build responsive chat interface that consumes token deltas over Server-Sent Events (SSE). Render Markdown code blocks with copy-to-clipboard, auto-scroll with pause capability, and provide prompt edit/retry controls.',
      assigned_to_id: 'usr-2',
      assigned_to_name: 'Alex Rivera',
      assigned_by_id: 'usr-1',
      assigned_by_name: 'Sarah Connor',
      assigned_role: 'frontend_developer',
      priority: 'p0',
      deadline: '2026-10-25T18:00:00Z',
      status: 'in_progress',
      original_task_value: 65000.00,
      acceptance_criteria: [
        'Render assistant responses incrementally via Server-Sent Events (SSE)',
        'Support Markdown code block rendering with syntax highlighting and copy button',
        'Auto-scroll to bottom during generation with user pause capability'
      ],
      permitted_files: ['src/components/ChatInterface.tsx', 'src/hooks/useChatStream.ts'],
      resubmission_count: 0,
      created_at: '2026-10-10T09:00:00Z',
      updated_at: '2026-10-14T11:00:00Z'
    },
    {
      id: 'task-llm-2',
      project_id: 'PRJ-LLM',
      project_name: 'LLM Application Platform',
      module_id: 'mod-2',
      module_name: 'JWT Auth & Session Manager',
      module_code: 'AUTH_SRV',
      module_version: 'v1.8.2',
      title: 'Implement Streaming LLM Gateway & Rate Limiting',
      description: 'Implement POST /api/v1/chat/completions endpoint with token streaming, sliding-window rate limiting, and upstream timeout handling.',
      assigned_to_id: 'usr-3',
      assigned_to_name: 'Devon Lee',
      assigned_by_id: 'usr-1',
      assigned_by_name: 'Sarah Connor',
      assigned_role: 'backend_developer',
      priority: 'p0',
      deadline: '2026-10-26T18:00:00Z',
      status: 'in_progress',
      original_task_value: 50000.00,
      acceptance_criteria: [
        'Implement POST /api/v1/chat/completions endpoint with token streaming',
        'Apply sliding-window token bucket rate limiter per client API key',
        'Handle upstream provider timeouts with fallback graceful error JSON'
      ],
      permitted_files: ['server/controllers/chatController.ts', 'server/services/llmGateway.ts'],
      resubmission_count: 0,
      created_at: '2026-10-09T10:00:00Z',
      updated_at: '2026-10-13T16:00:00Z'
    },
    {
      id: 'task-llm-3',
      project_id: 'PRJ-LLM',
      project_name: 'LLM Application Platform',
      module_id: 'mod-3',
      module_name: 'Distributed Database Partitioning',
      module_code: 'DB_PARTITION',
      module_version: 'v1.2.0',
      title: 'Design Conversation Sessions & Vector Embedding Store',
      description: 'Define relational schema for conversations and message thread hierarchy with composite B-tree indexing for history retrieval.',
      assigned_to_id: 'usr-5',
      assigned_to_name: 'Marcus Vance',
      assigned_by_id: 'usr-1',
      assigned_by_name: 'Sarah Connor',
      assigned_role: 'database_designer',
      priority: 'p1',
      deadline: '2026-10-27T18:00:00Z',
      status: 'assigned',
      original_task_value: 90000.00,
      acceptance_criteria: [
        'Composite B-tree indexing on (user_id, updated_at DESC)',
        'Vector embedding store schema with pgvector cosine distance index'
      ],
      permitted_files: ['server/db/schema.sql'],
      resubmission_count: 0,
      created_at: '2026-10-10T12:00:00Z',
      updated_at: '2026-10-10T12:00:00Z'
    },
    {
      id: 'task-llm-4',
      project_id: 'PRJ-LLM',
      project_name: 'LLM Application Platform',
      module_id: 'mod-4',
      module_name: 'Customer Notification Dispatcher',
      module_code: 'NOTIF_DISPATCH',
      module_version: 'v2.0.1',
      title: 'Automate Streaming Regression & Prompt Injection Tests',
      description: 'Develop automated test harness that executes synthetic prompt injection and multi-turn streaming conversations against the LLM gateway.',
      assigned_to_id: 'usr-4',
      assigned_to_name: 'Priya Sharma',
      assigned_by_id: 'usr-1',
      assigned_by_name: 'Sarah Connor',
      assigned_role: 'qa_engineer',
      priority: 'p1',
      deadline: '2026-10-28T18:00:00Z',
      status: 'in_progress',
      original_task_value: 45000.00,
      acceptance_criteria: [
        'Automated test harness testing prompt injection resilience',
        'Verify token rate limiting under simulated load'
      ],
      permitted_files: ['tests/llmSecurityTests.ts'],
      resubmission_count: 0,
      created_at: '2026-10-11T14:00:00Z',
      updated_at: '2026-10-15T10:00:00Z'
    },
    {
      id: 'task-1',
      project_id: 'PRJ-ECOM',
      project_name: 'OmniCommerce Cloud Enterprise',
      module_id: 'mod-1',
      module_name: 'Billing & Checkout Engine',
      module_code: 'BILLING_ENG',
      module_version: 'v2.4.0',
      title: 'Implement Webhook Idempotency Header',
      description: 'Store idempotency keys in Redis cache with 24-hour TTL to prevent duplicate checkout transactions on network retry.',
      assigned_to_id: 'usr-2',
      assigned_to_name: 'Alex Rivera',
      assigned_by_id: 'usr-1',
      assigned_by_name: 'Sarah Connor',
      assigned_role: 'frontend_developer',
      priority: 'p0',
      deadline: '2026-10-24T18:00:00Z',
      status: 'in_progress',
      original_task_value: 75000.00,
      acceptance_criteria: ['Redis deduplication caching', 'Zero double charge anomalies'],
      permitted_files: ['server/middleware/idempotency.ts'],
      resubmission_count: 0,
      created_at: '2026-10-12T09:00:00Z',
      updated_at: '2026-10-15T11:00:00Z'
    },
    {
      id: 'task-2',
      project_id: 'PRJ-LLM',
      project_name: 'LLM Application Platform',
      module_id: 'mod-2',
      module_name: 'JWT Auth & Session Manager',
      module_code: 'AUTH_SRV',
      module_version: 'v1.8.2',
      title: 'SAML 2.0 Identity Provider Handshake',
      description: 'Implement enterprise SSO federation handshake using SAML 2.0 with XML signature verification and metadata exchange.',
      assigned_to_id: 'usr-3',
      assigned_to_name: 'Devon Lee',
      assigned_by_id: 'usr-1',
      assigned_by_name: 'Sarah Connor',
      assigned_role: 'backend_developer',
      priority: 'p1',
      deadline: '2026-10-22T18:00:00Z',
      status: 'submitted',
      original_task_value: 50000.00,
      acceptance_criteria: ['SAML assertion verification', 'Support Okta, Azure AD, and PingFederate'],
      permitted_files: ['server/auth/samlProvider.ts'],
      submission_notes: 'Implemented SAML 2.0 assertion verification with XML signature validation. Staging tests passing with Okta mock IdP.',
      submitted_at: '2026-10-15T17:30:00Z',
      resubmission_count: 0,
      created_at: '2026-10-08T10:00:00Z',
      updated_at: '2026-10-15T17:30:00Z'
    },
    {
      id: 'task-3',
      project_id: 'PRJ-ECOM',
      project_name: 'OmniCommerce Cloud Enterprise',
      module_id: 'mod-3',
      module_name: 'Distributed Database Partitioning',
      module_code: 'DB_PARTITION',
      module_version: 'v1.2.0',
      title: 'Redis Stock Distributed Lock Mechanism',
      description: 'Implement Redlock distributed locking algorithm across multi-node Redis clusters for inventory reservation.',
      assigned_to_id: 'usr-5',
      assigned_to_name: 'Marcus Vance',
      assigned_by_id: 'usr-1',
      assigned_by_name: 'Sarah Connor',
      assigned_role: 'database_designer',
      priority: 'p0',
      deadline: '2026-10-29T18:00:00Z',
      status: 'assigned',
      original_task_value: 90000.00,
      acceptance_criteria: ['Atomic distributed lock acquire/release', 'Automatic TTL extension heartbeat'],
      permitted_files: ['server/redis/distributedLock.ts'],
      resubmission_count: 0,
      created_at: '2026-10-14T11:00:00Z',
      updated_at: '2026-10-14T11:00:00Z'
    },
    {
      id: 'task-4',
      project_id: 'PRJ-LLM',
      project_name: 'LLM Application Platform',
      module_id: 'mod-4',
      module_name: 'Customer Notification Dispatcher',
      module_code: 'NOTIF_DISPATCH',
      module_version: 'v2.0.1',
      title: 'Email Template DOMPurify Integration',
      description: 'Audit all Handlebars email templates and integrate DOMPurify sanitization to prevent XSS in receipt emails.',
      assigned_to_id: 'usr-2',
      assigned_to_name: 'Alex Rivera',
      assigned_by_id: 'usr-1',
      assigned_by_name: 'Sarah Connor',
      assigned_role: 'frontend_developer',
      priority: 'p1',
      deadline: '2026-10-18T18:00:00Z',
      status: 'approved',
      original_task_value: 45000.00,
      acceptance_criteria: ['DOMPurify sanitization in all templates', 'Unit test coverage for HTML escaping'],
      permitted_files: ['server/notifications/emailTemplateRenderer.ts'],
      reviewed_by_id: 'usr-1',
      reviewed_by_name: 'Sarah Connor',
      reviewed_at: '2026-10-14T16:00:00Z',
      reviewer_feedback: 'Approved by manager. Security audit confirmed clean sanitization across all templates.',
      resubmission_count: 0,
      created_at: '2026-10-06T10:00:00Z',
      updated_at: '2026-10-14T16:00:00Z'
    },
    {
      id: 'task-5',
      project_id: 'PRJ-ECOM',
      project_name: 'OmniCommerce Cloud Enterprise',
      module_id: 'mod-1',
      module_name: 'Billing & Checkout Engine',
      module_code: 'BILLING_ENG',
      module_version: 'v2.4.0',
      title: 'Stripe Tax Multi-Jurisdiction Precision',
      description: 'Handle European cross-border OSS tax calculation rounding edge cases according to EU VAT regulations.',
      assigned_to_id: 'usr-5',
      assigned_to_name: 'Marcus Vance',
      assigned_by_id: 'usr-1',
      assigned_by_name: 'Sarah Connor',
      assigned_role: 'database_designer',
      priority: 'p2',
      deadline: '2026-10-28T18:00:00Z',
      status: 'changes_requested',
      original_task_value: 75000.00,
      acceptance_criteria: ['Accurate rounding to 2 decimal places per Directive 2006/112/EC'],
      permitted_files: ['server/tax/taxEngine.ts'],
      reviewed_by_id: 'usr-1',
      reviewed_by_name: 'Sarah Connor',
      reviewed_at: '2026-10-15T15:30:00Z',
      reviewer_feedback: 'Rounding edge cases in Austrian VAT require banker rounding on total taxable sum rather than per item.',
      resubmission_count: 1,
      created_at: '2026-10-07T11:00:00Z',
      updated_at: '2026-10-15T15:30:00Z'
    },
    {
      id: 'task-6',
      project_id: 'PRJ-ECOM',
      project_name: 'OmniCommerce Cloud Enterprise',
      module_id: 'mod-0391',
      module_name: 'Small Inventory Widget',
      module_code: 'INV_WIDGET_0391',
      module_version: 'v2.1.0',
      title: 'Stock Synchronization High Latency Reconciliation',
      description: 'Reconcile stock count latency during simultaneous checkout on mobile network throttling.',
      assigned_to_id: 'usr-2',
      assigned_to_name: 'Alex Rivera',
      assigned_by_id: 'usr-1',
      assigned_by_name: 'Sarah Connor',
      assigned_role: 'frontend_developer',
      priority: 'p1',
      deadline: '2026-10-23T18:00:00Z',
      status: 'reopened',
      original_task_value: 65000.00,
      acceptance_criteria: ['Sub-50ms stock optimistic UI update', 'Rollback gracefully on API network failure'],
      permitted_files: ['src/components/InventoryWidget.tsx'],
      resubmission_count: 1,
      created_at: '2026-10-12T10:00:00Z',
      updated_at: '2026-10-16T11:00:00Z'
    },
    {
      id: 'task-7',
      project_id: 'PRJ-ECOM',
      project_name: 'OmniCommerce Cloud Enterprise',
      module_id: 'mod-3',
      module_name: 'Distributed Database Partitioning',
      module_code: 'DB_PARTITION',
      module_version: 'v1.2.0',
      title: 'Partition Failover Routing Under Heavy Load',
      description: 'Ensure automated failover routing executes without connection storm when a database partition shard becomes unreachable.',
      assigned_to_id: 'usr-5',
      assigned_to_name: 'Marcus Vance',
      assigned_by_id: 'usr-1',
      assigned_by_name: 'Sarah Connor',
      assigned_role: 'database_designer',
      priority: 'p0',
      deadline: '2026-10-31T18:00:00Z',
      status: 'under_fix',
      original_task_value: 90000.00,
      acceptance_criteria: ['Connection pool circuit breaker', 'Sub-2s failover redirect without data loss'],
      permitted_files: ['server/db/shardRouter.ts'],
      resubmission_count: 2,
      created_at: '2026-10-13T09:00:00Z',
      updated_at: '2026-10-16T14:00:00Z'
    }
  ];
  const { error: taskErr } = await supabase.from('tasks').upsert(tasks);
  if (taskErr) console.warn('Tasks upsert note:', taskErr.message);
  else console.log(`✅ Upserted ${tasks.length} tasks.`);

  // --- 5. SUBMISSIONS ---
  console.log('📦 5. Seeding Task Submissions...');
  const submissions = [
    {
      id: 'sub-1',
      task_id: 'task-2',
      user_id: 'usr-3',
      user_name: 'Devon Lee',
      submission_notes: 'Implemented SAML 2.0 assertion verification with XML signature validation. Staging tests passing with Okta mock IdP.',
      submitted_at: '2026-10-15T17:30:00Z',
      status: 'submitted',
      review_decision: null,
      reviewer_id: null,
      reviewer_name: null,
      reviewer_feedback: null,
      reviewed_at: null
    },
    {
      id: 'sub-2',
      task_id: 'task-4',
      user_id: 'usr-2',
      user_name: 'Alex Rivera',
      submission_notes: 'Integrated DOMPurify across all Handlebars templates. 48 unit tests passing.',
      submitted_at: '2026-10-14T14:00:00Z',
      status: 'approved',
      review_decision: 'approved',
      reviewer_id: 'usr-1',
      reviewer_name: 'Sarah Connor',
      reviewer_feedback: 'Approved by manager. Security audit confirmed clean sanitization across all templates.',
      reviewed_at: '2026-10-14T16:00:00Z'
    },
    {
      id: 'sub-3',
      task_id: 'task-5',
      user_id: 'usr-5',
      user_name: 'Marcus Vance',
      submission_notes: 'First draft of EU VAT calculation rules for OSS digital goods.',
      submitted_at: '2026-10-15T14:00:00Z',
      status: 'changes_requested',
      review_decision: 'changes_requested',
      reviewer_id: 'usr-1',
      reviewer_name: 'Sarah Connor',
      reviewer_feedback: 'Rounding edge cases in Austrian VAT require banker rounding on total taxable sum rather than per item.',
      reviewed_at: '2026-10-15T15:30:00Z'
    },
    {
      id: 'sub-4',
      task_id: 'task-1',
      user_id: 'usr-2',
      user_name: 'Alex Rivera',
      submission_notes: 'Added Redis idempotency key middleware with 120s TTL and automatic deduplication.',
      submitted_at: '2026-10-15T11:00:00Z',
      status: 'submitted',
      review_decision: null,
      reviewer_id: null,
      reviewer_name: null,
      reviewer_feedback: null,
      reviewed_at: null
    }
  ];
  const { error: subErr } = await supabase.from('submissions').upsert(submissions);
  if (subErr) console.warn('Submissions upsert note:', subErr.message);
  else console.log(`✅ Upserted ${submissions.length} submissions.`);

  // --- 6. BUGS & DEFECTS ---
  console.log('📦 6. Seeding Bugs (with rich severities, root causes, and client sign-offs)...');
  const bugs = [
    {
      id: 'bug-101',
      title: 'Double charge on 3D-Secure timeout during Stripe checkout',
      description: 'When the 3D-Secure authentication handshake takes >15s, client retried the POST /charge request without idempotency key header, generating double transactions.',
      module_id: 'mod-1',
      module_version: 'v2.4.0',
      original_module_owner_id: 'usr-2',
      severity: 'critical',
      priority: 'p0',
      status: 'review_pending',
      root_cause: 'logic_error',
      original_author_id: 'usr-2',
      assigned_to_id: 'usr-2',
      corrective_hours: 14.5,
      hourly_rate: 500.0,
      rework_cost: 7250.0,
      review_status: 'pending',
      classification_status: 'confirmed_defect',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      client_reported: true,
      client_verified: false,
      original_task_id: 'task-1',
      original_task_title: 'Implement Webhook Idempotency Header',
      original_task_value: 75000.0,
      created_at: '2026-10-02T09:15:00Z',
      updated_at: '2026-10-12T16:40:00Z',
      resolved_at: '2026-10-12T16:40:00Z'
    },
    {
      id: 'bug-102',
      title: 'JWT refresh token reuse race condition',
      description: 'Concurrent refresh requests with the same rotation token caused silent logout for valid active sessions due to unindexed timestamp comparison.',
      module_id: 'mod-2',
      module_version: 'v1.8.2',
      original_module_owner_id: 'usr-3',
      severity: 'high',
      priority: 'p1',
      status: 'fixed',
      root_cause: 'edge_case',
      original_author_id: 'usr-3',
      assigned_to_id: 'usr-3',
      corrective_hours: 8.0,
      hourly_rate: 500.0,
      rework_cost: 4000.0,
      review_status: 'approved',
      classification_status: 'confirmed_defect',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      client_reported: false,
      client_verified: false,
      original_task_id: 'task-llm-2',
      original_task_title: 'Implement Streaming LLM Gateway & Rate Limiting',
      original_task_value: 50000.0,
      created_at: '2026-10-04T11:20:00Z',
      updated_at: '2026-10-11T14:10:00Z',
      resolved_at: '2026-10-10T18:00:00Z'
    },
    {
      id: 'bug-103',
      title: 'Negative stock quantity during simultaneous cart checkout',
      description: 'Inventory lock was released prior to DB commit, allowing 2 users to buy the last single remaining SKU simultaneously.',
      module_id: 'mod-3',
      module_version: 'v1.2.0',
      original_module_owner_id: 'usr-5',
      severity: 'critical',
      priority: 'p0',
      status: 'in_progress',
      root_cause: 'regression',
      original_author_id: 'usr-5',
      assigned_to_id: 'usr-5',
      corrective_hours: 11.0,
      hourly_rate: 600.0,
      rework_cost: 6600.0,
      review_status: 'not_submitted',
      classification_status: 'confirmed_defect',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      client_reported: true,
      client_verified: false,
      original_task_id: 'task-3',
      original_task_title: 'Redis Stock Distributed Lock Mechanism',
      original_task_value: 90000.0,
      created_at: '2026-10-08T14:00:00Z',
      updated_at: '2026-10-15T09:30:00Z'
    },
    {
      id: 'bug-104',
      title: 'Email notification template variable XSS sanitization gap',
      description: 'Customer greeting in transactional receipt emails permitted raw HTML injection if display name contained unsanitized script tags.',
      module_id: 'mod-4',
      module_version: 'v2.0.1',
      original_module_owner_id: 'usr-2',
      severity: 'high',
      priority: 'p1',
      status: 'closed',
      root_cause: 'security',
      original_author_id: 'usr-2',
      assigned_to_id: 'usr-2',
      corrective_hours: 5.5,
      hourly_rate: 500.0,
      rework_cost: 2750.0,
      review_status: 'approved',
      classification_status: 'confirmed_defect',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      client_reported: true,
      client_verified: true,
      client_verified_at: '2026-10-01T11:00:00Z',
      client_rating: 5.0,
      client_feedback: 'Security patch was delivered swiftly and validated in staging with zero regressions.',
      original_task_id: 'task-4',
      original_task_title: 'Email Template DOMPurify Integration',
      original_task_value: 45000.0,
      created_at: '2026-09-25T13:40:00Z',
      updated_at: '2026-10-01T11:00:00Z',
      resolved_at: '2026-09-30T17:15:00Z'
    },
    {
      id: 'bug-105',
      title: 'OOM error when generating quarterly CSV report over 100k rows',
      description: 'Report generation loaded entire dataset into memory instead of streaming chunks via cursor, causing Node heap limit crash.',
      module_id: 'mod-5',
      module_version: 'v1.4.0',
      original_module_owner_id: 'usr-3',
      severity: 'medium',
      priority: 'p2',
      status: 'open',
      root_cause: 'performance',
      original_author_id: 'usr-3',
      assigned_to_id: 'usr-3',
      corrective_hours: 3.0,
      hourly_rate: 500.0,
      rework_cost: 1500.0,
      review_status: 'not_submitted',
      classification_status: 'confirmed_defect',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      client_reported: false,
      client_verified: false,
      original_task_value: 55000.0,
      created_at: '2026-10-11T10:05:00Z',
      updated_at: '2026-10-14T11:25:00Z'
    },
    {
      id: 'bug-106',
      title: 'Tax rounding discrepancy on EU VAT orders with multiple items',
      description: 'Calculated tax per unit rather than sum of line totals, leading to 1-cent divergence against Stripe tax calculation.',
      module_id: 'mod-1',
      module_version: 'v2.4.0',
      original_module_owner_id: 'usr-2',
      severity: 'medium',
      priority: 'p2',
      status: 'review_pending',
      root_cause: 'logic_error',
      original_author_id: 'usr-2',
      assigned_to_id: 'usr-5',
      corrective_hours: 6.0,
      hourly_rate: 600.0,
      rework_cost: 3600.0,
      review_status: 'pending',
      classification_status: 'confirmed_defect',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      client_reported: false,
      client_verified: false,
      original_task_id: 'task-5',
      original_task_title: 'Stripe Tax Multi-Jurisdiction Precision',
      original_task_value: 75000.0,
      created_at: '2026-10-07T16:15:00Z',
      updated_at: '2026-10-15T15:20:00Z',
      resolved_at: '2026-10-15T15:20:00Z'
    },
    {
      id: 'bug-107',
      title: 'Stock allocation lag causes phantom availability during flash sale',
      description: 'Cache invalidation queue had 500ms delay allowing multiple customers to view outdated inventory levels.',
      module_id: 'mod-0391',
      module_version: 'v2.1.0',
      original_module_owner_id: 'usr-2',
      severity: 'high',
      priority: 'p1',
      status: 'in_progress',
      root_cause: 'regression',
      original_author_id: 'usr-2',
      assigned_to_id: 'usr-2',
      corrective_hours: 5.0,
      hourly_rate: 500.0,
      rework_cost: 2500.0,
      review_status: 'pending',
      classification_status: 'confirmed_defect',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      client_reported: true,
      client_verified: false,
      original_task_id: 'task-6',
      original_task_title: 'Stock Synchronization High Latency Reconciliation',
      original_task_value: 65000.0,
      created_at: '2026-10-12T10:00:00Z',
      updated_at: '2026-10-16T11:00:00Z'
    },
    {
      id: 'bug-108',
      title: 'Client Reported: Inactive session not cleared on logout',
      description: 'Local session storage token was retained on browser tab refresh after user explicitly clicked log out.',
      module_id: 'mod-2',
      module_version: 'v1.8.2',
      original_module_owner_id: 'usr-3',
      severity: 'major',
      priority: 'p1',
      status: 'closed',
      root_cause: 'edge_case',
      original_author_id: 'usr-3',
      assigned_to_id: 'usr-3',
      corrective_hours: 4.5,
      hourly_rate: 500.0,
      rework_cost: 2250.0,
      review_status: 'approved',
      classification_status: 'confirmed_defect',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      client_reported: true,
      client_verified: true,
      client_verified_at: '2026-10-16T18:00:00Z',
      client_rating: 5.0,
      client_feedback: 'Verified token renewal under simulated throttling. Zero dropped sessions observed.',
      original_task_id: 'task-llm-2',
      original_task_title: 'Implement Streaming LLM Gateway & Rate Limiting',
      original_task_value: 50000.0,
      created_at: '2026-10-14T11:00:00Z',
      updated_at: '2026-10-16T18:00:00Z',
      resolved_at: '2026-10-16T17:30:00Z'
    },
    {
      id: 'bug-109',
      title: 'Client Reported: Widget quantity counter flickering on mobile Safari',
      description: 'CSS transition layout reflow triggers double redraw when rapidly clicking increment/decrement buttons.',
      module_id: 'mod-0391',
      module_version: 'v2.1.0',
      original_module_owner_id: 'usr-2',
      severity: 'minor',
      priority: 'p3',
      status: 'open',
      root_cause: 'logic_error',
      original_author_id: 'usr-2',
      assigned_to_id: 'usr-2',
      corrective_hours: 2.0,
      hourly_rate: 500.0,
      rework_cost: 1000.0,
      review_status: 'not_submitted',
      classification_status: 'pending_manager_review',
      client_id: 'usr-8',
      client_name: 'Acme Enterprise (Client)',
      client_reported: true,
      client_verified: false,
      original_task_id: 'task-6',
      original_task_title: 'Stock Synchronization High Latency Reconciliation',
      original_task_value: 65000.0,
      created_at: '2026-10-16T15:00:00Z',
      updated_at: '2026-10-16T15:00:00Z'
    }
  ];
  const { error: bugErr } = await supabase.from('bugs').upsert(bugs);
  if (bugErr) console.warn('Bugs upsert note:', bugErr.message);
  else console.log(`✅ Upserted ${bugs.length} bugs.`);

  // --- 7. TIME ENTRIES ---
  console.log('📦 7. Seeding Time Entries (normal development vs corrective rework)...');
  const timeEntries = [
    {
      id: 'te-1',
      bug_id: 'bug-101',
      user_id: 'usr-2',
      hours_spent: 6.5,
      hourly_rate: 500.0,
      cost: 3250.0,
      work_category: 'corrective_maintenance',
      work_description: 'Reproduced 3D-Secure timeout in sandbox, isolated missing idempotency header on client retry loop.',
      target_title: 'Double charge on 3D-Secure timeout during Stripe checkout',
      date: '2026-10-03',
      created_at: '2026-10-03T17:00:00Z'
    },
    {
      id: 'te-2',
      bug_id: 'bug-101',
      user_id: 'usr-2',
      hours_spent: 8.0,
      hourly_rate: 500.0,
      cost: 4000.0,
      work_category: 'corrective_maintenance',
      work_description: 'Implemented server-side idempotency cache in Redis and client backoff with deduplication key.',
      target_title: 'Double charge on 3D-Secure timeout during Stripe checkout',
      date: '2026-10-12',
      created_at: '2026-10-12T16:30:00Z'
    },
    {
      id: 'te-3',
      bug_id: 'bug-102',
      user_id: 'usr-3',
      hours_spent: 8.0,
      hourly_rate: 500.0,
      cost: 4000.0,
      work_category: 'corrective_maintenance',
      work_description: 'Added atomic Redis mutex lock for token rotation window of 5 seconds to permit parallel tabs.',
      target_title: 'JWT refresh token reuse race condition',
      date: '2026-10-09',
      created_at: '2026-10-09T18:00:00Z'
    },
    {
      id: 'te-4',
      bug_id: 'bug-103',
      user_id: 'usr-5',
      hours_spent: 11.0,
      hourly_rate: 600.0,
      cost: 6600.0,
      work_category: 'corrective_maintenance',
      work_description: 'Refactored inventory checkout to use PostgreSQL SELECT ... FOR UPDATE pessimistic row locks.',
      target_title: 'Negative stock quantity during simultaneous cart checkout',
      date: '2026-10-14',
      created_at: '2026-10-14T19:00:00Z'
    },
    {
      id: 'te-5',
      bug_id: 'bug-104',
      user_id: 'usr-2',
      hours_spent: 5.5,
      hourly_rate: 500.0,
      cost: 2750.0,
      work_category: 'corrective_maintenance',
      work_description: 'Audited all email handlebars templates and integrated DOMPurify/validator HTML escape encoder.',
      target_title: 'Email notification template variable XSS sanitization gap',
      date: '2026-09-29',
      created_at: '2026-09-29T16:45:00Z'
    },
    {
      id: 'te-6',
      bug_id: 'bug-105',
      user_id: 'usr-3',
      hours_spent: 3.0,
      hourly_rate: 500.0,
      cost: 1500.0,
      work_category: 'corrective_maintenance',
      work_description: 'Investigated memory dump and drafted transform stream pipeline for large CSV generation.',
      target_title: 'OOM error when generating quarterly CSV report over 100k rows',
      date: '2026-10-13',
      created_at: '2026-10-13T16:00:00Z'
    },
    {
      id: 'te-7',
      bug_id: 'bug-106',
      user_id: 'usr-5',
      hours_spent: 6.0,
      hourly_rate: 600.0,
      cost: 3600.0,
      work_category: 'corrective_maintenance',
      work_description: 'Aligned rounding algorithm with Directive 2006/112/EC using banker rounding on total taxable sum.',
      target_title: 'Tax rounding discrepancy on EU VAT orders with multiple items',
      date: '2026-10-15',
      created_at: '2026-10-15T15:00:00Z'
    },
    {
      id: 'te-8',
      task_id: 'task-llm-1',
      user_id: 'usr-2',
      hours_spent: 18.0,
      hourly_rate: 500.0,
      cost: 9000.0,
      work_category: 'regular_development',
      work_description: 'Streaming SSE delta consumer and syntax highlighting markdown render component.',
      target_title: 'Implement Streaming Markdown Chat Interface',
      date: '2026-10-14',
      created_at: '2026-10-14T17:00:00Z'
    },
    {
      id: 'te-9',
      task_id: 'task-llm-2',
      user_id: 'usr-3',
      hours_spent: 22.0,
      hourly_rate: 500.0,
      cost: 11000.0,
      work_category: 'regular_development',
      work_description: 'Token bucket sliding-window rate limiter per API key with Redis store.',
      target_title: 'Implement Streaming LLM Gateway & Rate Limiting',
      date: '2026-10-13',
      created_at: '2026-10-13T18:00:00Z'
    },
    {
      id: 'te-10',
      task_id: 'task-llm-3',
      user_id: 'usr-5',
      hours_spent: 15.0,
      hourly_rate: 600.0,
      cost: 9000.0,
      work_category: 'regular_development',
      work_description: 'Conversation threads database schema and pgvector embeddings indexing.',
      target_title: 'Design Conversation Sessions & Vector Embedding Store',
      date: '2026-10-12',
      created_at: '2026-10-12T19:00:00Z'
    },
    {
      id: 'te-11',
      task_id: 'task-4',
      user_id: 'usr-2',
      hours_spent: 12.0,
      hourly_rate: 500.0,
      cost: 6000.0,
      work_category: 'regular_development',
      work_description: 'Transactional email template library refactor with unit tests.',
      target_title: 'Email Template DOMPurify Integration',
      date: '2026-10-09',
      created_at: '2026-10-09T17:00:00Z'
    }
  ];
  const { error: teErr } = await supabase.from('time_entries').upsert(timeEntries);
  if (teErr) console.warn('Time entries upsert note:', teErr.message);
  else console.log(`✅ Upserted ${timeEntries.length} time entries.`);

  // --- 8. WORK SESSIONS ---
  console.log('📦 8. Seeding Work Sessions...');
  const workSessions = [
    {
      id: 'ws-1',
      user_id: 'usr-2',
      user_name: 'Alex Rivera',
      task_id: 'task-1',
      target_id: 'task-1',
      target_title: 'Implement Webhook Idempotency Header',
      work_type: 'original_development',
      status: 'stopped',
      start_time: '2026-10-15T09:00:00Z',
      end_time: '2026-10-15T12:30:00Z',
      total_paused_seconds: 0,
      duration_seconds: 12600,
      notes: 'Drafted idempotency Redis key schema and middleware.',
      created_at: '2026-10-15T09:00:00Z'
    },
    {
      id: 'ws-2',
      user_id: 'usr-2',
      user_name: 'Alex Rivera',
      bug_id: 'bug-101',
      target_id: 'bug-101',
      target_title: 'Idempotency failure on high-latency payment retries',
      work_type: 'corrective_rework',
      status: 'stopped',
      start_time: '2026-10-16T10:00:00Z',
      end_time: '2026-10-16T12:30:00Z',
      total_paused_seconds: 600,
      duration_seconds: 8400,
      notes: 'Isolated retry timeout and verified fix in sandbox.',
      created_at: '2026-10-16T10:00:00Z'
    },
    {
      id: 'ws-3',
      user_id: 'usr-3',
      user_name: 'Devon Lee',
      task_id: 'task-llm-2',
      target_id: 'task-llm-2',
      target_title: 'Implement Streaming LLM Gateway & Rate Limiting',
      work_type: 'original_development',
      status: 'stopped',
      start_time: '2026-10-13T09:00:00Z',
      end_time: '2026-10-13T13:00:00Z',
      total_paused_seconds: 0,
      duration_seconds: 14400,
      notes: 'Implemented token bucket sliding-window algorithm.',
      created_at: '2026-10-13T09:00:00Z'
    },
    {
      id: 'ws-4',
      user_id: 'usr-5',
      user_name: 'Marcus Vance',
      bug_id: 'bug-103',
      target_id: 'bug-103',
      target_title: 'Negative stock quantity during simultaneous cart checkout',
      work_type: 'corrective_rework',
      status: 'stopped',
      start_time: '2026-10-14T14:00:00Z',
      end_time: '2026-10-14T19:00:00Z',
      total_paused_seconds: 900,
      duration_seconds: 17100,
      notes: 'PostgreSQL row-level locking benchmark and deadlock stress test.',
      created_at: '2026-10-14T14:00:00Z'
    }
  ];
  const { error: wsErr } = await supabase.from('work_sessions').upsert(workSessions);
  if (wsErr) console.warn('Work sessions upsert note:', wsErr.message);
  else console.log(`✅ Upserted ${workSessions.length} work sessions.`);

  // --- 9. REVIEWS ---
  console.log('📦 9. Seeding Code Reviews & Manager Approvals...');
  const reviews = [
    {
      id: 'rev-1',
      bug_id: 'bug-102',
      manager_id: 'usr-1',
      developer_id: 'usr-3',
      status: 'approved_for_accounting',
      decision: 'approved_for_accounting',
      root_cause: 'code_defect',
      review_notes: 'Clean atomic lock solution. Unit and concurrency tests passed under 50 simultaneous refresh requests. Rework cost verified and accepted.',
      comments: 'Clean atomic lock solution. Unit and concurrency tests passed under 50 simultaneous refresh requests. Rework cost verified and accepted.',
      cost_accepted: true,
      hours_approved: 8.0,
      quality_rating: 5,
      created_at: '2026-10-11T10:00:00Z',
      updated_at: '2026-10-11T14:10:00Z'
    },
    {
      id: 'rev-2',
      bug_id: 'bug-104',
      manager_id: 'usr-1',
      developer_id: 'usr-2',
      status: 'approved_for_accounting',
      decision: 'approved_for_accounting',
      root_cause: 'code_defect',
      review_notes: 'Sanitization filters applied across all 12 notification templates. Regression test suite green.',
      comments: 'Sanitization filters applied across all 12 notification templates. Regression test suite green.',
      cost_accepted: true,
      hours_approved: 5.5,
      quality_rating: 4,
      created_at: '2026-09-30T14:00:00Z',
      updated_at: '2026-10-01T11:00:00Z'
    },
    {
      id: 'rev-3',
      bug_id: 'bug-101',
      manager_id: 'usr-1',
      developer_id: 'usr-2',
      status: 'pending',
      decision: 'pending',
      root_cause: 'code_defect',
      review_notes: 'Awaiting final payment provider sandbox automated integration run before signing off.',
      comments: 'Awaiting final payment provider sandbox automated integration run before signing off.',
      cost_accepted: false,
      hours_approved: 14.5,
      quality_rating: 4,
      created_at: '2026-10-12T17:00:00Z',
      updated_at: '2026-10-12T17:00:00Z'
    },
    {
      id: 'rev-4',
      bug_id: 'bug-106',
      manager_id: 'usr-1',
      developer_id: 'usr-5',
      status: 'pending',
      decision: 'pending',
      root_cause: 'requirement_change',
      review_notes: 'Need confirmation from finance department regarding Austrian and German edge case orders.',
      comments: 'Need confirmation from finance department regarding Austrian and German edge case orders.',
      cost_accepted: false,
      hours_approved: 6.0,
      quality_rating: 4,
      created_at: '2026-10-15T16:00:00Z',
      updated_at: '2026-10-15T16:00:00Z'
    }
  ];
  const { error: revErr } = await supabase.from('reviews').upsert(reviews);
  if (revErr) console.warn('Reviews upsert note:', revErr.message);
  else console.log(`✅ Upserted ${reviews.length} reviews.`);

  // --- 10. PAYROLL ADJUSTMENTS ---
  console.log('📦 10. Seeding Payroll Adjustments (across October and September 2026)...');
  const adjustments = [
    {
      id: 'pa-101',
      employee_id: 'usr-2',
      month: 'October 2026',
      bug_id: 'bug-101',
      module_id: 'mod-1',
      original_author_id: 'usr-2',
      rework_assignee_id: 'usr-2',
      approved_hours: 14.5,
      hourly_rate: 500.00,
      rework_cost: 7250.00,
      original_task_value: 75000.00,
      proposed_adjustment_amount: 7250.00,
      waiver_amount: 0.00,
      is_chargeable: true,
      status: 'under_review',
      review_notes: 'Under manager evaluation for October accounting cycle.',
      hr_authorization_status: 'pending_hr_review',
      created_at: '2026-10-12T17:00:00Z',
      updated_at: '2026-10-12T17:00:00Z'
    },
    {
      id: 'pa-102',
      employee_id: 'usr-3',
      month: 'October 2026',
      bug_id: 'bug-102',
      module_id: 'mod-2',
      original_author_id: 'usr-3',
      rework_assignee_id: 'usr-3',
      approved_hours: 8.0,
      hourly_rate: 500.00,
      rework_cost: 4000.00,
      original_task_value: 50000.00,
      proposed_adjustment_amount: 4000.00,
      waiver_amount: 0.00,
      is_chargeable: true,
      status: 'finance_approved',
      review_notes: 'Approved in finance-review workflow by Sarah Connor. Clean atomic lock verified. Pending independent HR authorization signoff.',
      finance_reviewer_id: 'usr-1',
      finance_review_date: '2026-10-11T14:15:00Z',
      hr_authorization_status: 'pending_hr_review',
      created_at: '2026-10-11T14:10:00Z',
      updated_at: '2026-10-11T14:15:00Z'
    },
    {
      id: 'pa-103',
      employee_id: 'usr-5',
      month: 'October 2026',
      bug_id: 'bug-106',
      module_id: 'mod-1',
      original_author_id: 'usr-2',
      rework_assignee_id: 'usr-5',
      approved_hours: 6.0,
      hourly_rate: 600.00,
      rework_cost: 3600.00,
      original_task_value: 75000.00,
      proposed_adjustment_amount: 0.00,
      waiver_amount: 3600.00,
      is_chargeable: false,
      waiver_reason: 'Statutory compliance shift: EU Directive 2006/112/EC amendment required rounding adjustments at the line level. Defect caused by changing legal requirements rather than developer implementation negligence. Full rework cost of ₹3,600 waived in full.',
      status: 'waived',
      review_notes: 'Fairness waiver granted — external regulatory requirement update, not developer defect.',
      finance_reviewer_id: 'usr-1',
      finance_review_date: '2026-10-15T16:05:00Z',
      hr_authorization_status: 'rejected',
      hr_reviewer_id: 'usr-1',
      hr_decision_date: '2026-10-15T16:05:00Z',
      hr_notes: 'Waiver accepted and archived. Zero payroll impact.',
      created_at: '2026-10-15T16:00:00Z',
      updated_at: '2026-10-15T16:05:00Z'
    },
    {
      id: 'pa-104',
      employee_id: 'usr-2',
      month: 'September 2026',
      bug_id: 'bug-104',
      module_id: 'mod-4',
      original_author_id: 'usr-2',
      rework_assignee_id: 'usr-2',
      approved_hours: 5.5,
      hourly_rate: 500.00,
      rework_cost: 2750.00,
      original_task_value: 45000.00,
      proposed_adjustment_amount: 2750.00,
      waiver_amount: 0.00,
      is_chargeable: true,
      status: 'finance_approved',
      review_notes: 'September payroll cycle review finalized. Corrective fixes verified.',
      finance_reviewer_id: 'usr-1',
      finance_review_date: '2026-09-30T14:00:00Z',
      hr_authorization_status: 'authorized',
      hr_reviewer_id: 'usr-6',
      hr_decision_date: '2026-10-01T10:00:00Z',
      hr_notes: 'Formally authorized following statutory employee notification and compliance check under Section 7 Payment of Wages Act.',
      created_at: '2026-09-30T14:00:00Z',
      updated_at: '2026-10-01T10:00:00Z'
    },
    {
      id: 'pa-105',
      employee_id: 'usr-3',
      month: 'September 2026',
      bug_id: 'bug-105',
      module_id: 'mod-5',
      original_author_id: 'usr-3',
      rework_assignee_id: 'usr-3',
      approved_hours: 3.0,
      hourly_rate: 500.00,
      rework_cost: 1500.00,
      original_task_value: 55000.00,
      proposed_adjustment_amount: 1500.00,
      waiver_amount: 0.00,
      is_chargeable: true,
      status: 'disputed',
      review_notes: 'Employee raised formal dispute on requirement changes.',
      hr_authorization_status: 'disputed',
      dispute_reason: 'Memory leak caused by un-versioned third-party CSV parser library dependency update pushed by DevOps, not developer negligence.',
      disputed_at: '2026-10-14T12:00:00Z',
      disputed_by_id: 'usr-3',
      created_at: '2026-10-13T16:30:00Z',
      updated_at: '2026-10-14T12:00:00Z'
    }
  ];
  const { error: paErr } = await supabase.from('payroll_adjustments').upsert(adjustments);
  if (paErr) console.warn('Payroll adjustments upsert note:', paErr.message);
  else console.log(`✅ Upserted ${adjustments.length} payroll adjustments.`);

  // --- 11. AUDIT LOGS ---
  console.log('📦 11. Seeding Audit Logs...');
  const auditLogs = [
    {
      id: 'aud-1',
      entity_type: 'bug',
      entity_id: 'bug-101',
      action: 'STATUS_CHANGED',
      user_id: 'usr-2',
      details: 'Status changed from fixed to review_pending after completing automated tests.',
      timestamp: '2026-10-12T16:40:00Z'
    },
    {
      id: 'aud-2',
      entity_type: 'time_entry',
      entity_id: 'te-2',
      action: 'HOURS_LOGGED',
      user_id: 'usr-2',
      details: 'Logged 8.0 corrective hours (₹4,000.00) on bug-101: Double charge on Stripe checkout.',
      timestamp: '2026-10-12T16:30:00Z'
    },
    {
      id: 'aud-3',
      entity_type: 'review',
      entity_id: 'rev-1',
      action: 'REVIEW_APPROVED',
      user_id: 'usr-1',
      details: 'Manager Sarah Connor approved rework fix for bug-102 (JWT refresh race). Accepted cost: ₹4,000.00.',
      timestamp: '2026-10-11T14:10:00Z'
    },
    {
      id: 'aud-4',
      entity_type: 'time_entry',
      entity_id: 'te-4',
      action: 'HOURS_LOGGED',
      user_id: 'usr-5',
      details: 'Logged 11.0 corrective hours (₹6,600.00) on bug-103: Negative stock quantity.',
      timestamp: '2026-10-14T19:00:00Z'
    },
    {
      id: 'aud-5',
      entity_type: 'bug',
      entity_id: 'bug-106',
      action: 'SUBMITTED_FOR_REVIEW',
      user_id: 'usr-5',
      details: 'Submitted tax rounding discrepancy fix to Manager review queue.',
      timestamp: '2026-10-15T15:20:00Z'
    },
    {
      id: 'aud-6',
      entity_type: 'payroll_adjustment',
      entity_id: 'pa-101',
      action: 'ADJUSTMENT_INITIALIZED',
      user_id: 'usr-1',
      details: 'Draft adjustment generated for Alex Rivera: 14.5 hrs on bug-101. Total rework cost: ₹7,250.00. Marked under internal finance review.',
      timestamp: '2026-10-12T17:00:00Z'
    },
    {
      id: 'aud-7',
      entity_type: 'payroll_adjustment',
      entity_id: 'pa-102',
      action: 'FINANCE_APPROVED',
      user_id: 'usr-1',
      details: 'Finance approved internal preview for Devon Lee: ₹4,000.00. Placed in HR review queue. No salary deduction applied.',
      timestamp: '2026-10-11T14:15:00Z'
    },
    {
      id: 'aud-8',
      entity_type: 'payroll_adjustment',
      entity_id: 'pa-103',
      action: 'FAIRNESS_WAIVED',
      user_id: 'usr-1',
      details: 'Fairness waiver approved by Sarah Connor: Requirement change from finance on EU VAT rules. ₹3,600.00 rework cost absorbed by company. Offset set to ₹0.',
      timestamp: '2026-10-15T16:05:00Z'
    },
    {
      id: 'aud-9',
      entity_type: 'payroll_adjustment',
      entity_id: 'pa-104',
      action: 'HR_AUTHORIZED',
      user_id: 'usr-6',
      details: 'September cycle: HR authorization sign-off completed by Elena Rostova following statutory compliance verification.',
      timestamp: '2026-10-01T10:00:00Z'
    },
    {
      id: 'aud-10',
      entity_type: 'module',
      entity_id: 'mod-0391',
      action: 'CLIENT_VERIFIED_AND_CLOSED',
      user_id: 'usr-8',
      details: 'Client Acme Enterprise verified and approved module Small Inventory Widget with 4.8★ rating.',
      timestamp: '2026-10-02T11:30:00Z'
    }
  ];
  const { error: audErr } = await supabase.from('audit_logs').upsert(auditLogs);
  if (audErr) console.warn('Audit logs upsert note:', audErr.message);
  else console.log(`✅ Upserted ${auditLogs.length} audit logs.`);

  // --- 12. NOTIFICATIONS ---
  console.log('📦 12. Seeding Notifications (for all personas)...');
  const notifications = [
    {
      id: 'notif-1',
      user_id: 'usr-2',
      title: 'Review Update on Bug-101',
      message: 'Manager Sarah Connor is reviewing the idempotency fix. Awaiting final payment provider sandbox automated run.',
      type: 'review',
      link: '/employee/status',
      read: false,
      created_at: '2026-10-12T17:05:00Z'
    },
    {
      id: 'notif-2',
      user_id: 'usr-2',
      title: 'Monthly Adjustment Preview Generated',
      message: 'Your draft October payroll adjustment preview has been computed for engineering retrospective review.',
      type: 'payroll_adjustment',
      link: '/employee/payroll',
      read: false,
      created_at: '2026-10-15T09:00:00Z'
    },
    {
      id: 'notif-3',
      user_id: 'usr-3',
      title: 'Review Approved: Bug-102',
      message: 'JWT refresh token race condition fix was approved for accounting by Manager Sarah Connor (Rating: 5/5).',
      type: 'review',
      link: '/employee/status',
      read: true,
      created_at: '2026-10-11T14:15:00Z'
    },
    {
      id: 'notif-4',
      user_id: 'usr-5',
      title: 'Defect Waived (Non-Chargeable): Bug-106',
      message: 'Tax rounding discrepancy classified as Requirement Change. Rework cost waived from payroll adjustment preview.',
      type: 'payroll_adjustment',
      link: '/employee/payroll',
      read: false,
      created_at: '2026-10-15T16:10:00Z'
    },
    {
      id: 'notif-5',
      user_id: 'usr-6',
      title: 'HR Statutory Authorization Queue',
      message: 'October 2026 proposed payroll adjustments are pending your statutory compliance review under Section 7.',
      type: 'payroll_adjustment',
      link: '/manager/payroll',
      read: false,
      created_at: '2026-10-15T10:00:00Z'
    },
    {
      id: 'notif-6',
      user_id: 'usr-1',
      title: 'Client Verified Deliverable: Small Inventory Widget',
      message: 'Client Acme Enterprise reviewed and approved Small Inventory Widget with 4.8★ star rating.',
      type: 'info',
      link: '/modules',
      read: true,
      created_at: '2026-10-02T11:35:00Z'
    }
  ];
  const { error: notifErr } = await supabase.from('notifications').upsert(notifications);
  if (notifErr) console.warn('Notifications upsert note:', notifErr.message);
  else console.log(`✅ Upserted ${notifications.length} notifications.`);

  // --- 13. GENERATE SQL EXPORT FOR SUPABASE SQL EDITOR ---
  console.log('\n📄 Generating copy-paste showcase SQL script: supabase/showcase_seed_all_features.sql ...');
  function sqlVal(v: any): string {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return isNaN(v) ? '0' : String(v);
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (Array.isArray(v) || typeof v === 'object') {
      return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
    }
    return `'${String(v).replace(/'/g, "''")}'`;
  }

  function generateUpsertSql(table: string, records: any[], pkey: string = 'id'): string {
    if (!records.length) return '';
    const cols = Object.keys(records[0]);
    const lines: string[] = [];
    lines.push(`-- --- TABLE: ${table.toUpperCase()} (${records.length} records) ---`);
    for (const r of records) {
      const vals = cols.map(c => sqlVal(r[c])).join(', ');
      const updates = cols
        .filter(c => c !== pkey)
        .map(c => `${c} = EXCLUDED.${c}`)
        .join(', ');
      lines.push(
        `INSERT INTO public.${table} (${cols.join(', ')})\nVALUES (${vals})\nON CONFLICT (${pkey}) DO UPDATE SET ${updates};`
      );
    }
    lines.push('');
    return lines.join('\n');
  }

  const completeSql = `-- ====================================================================
-- REWORKGUARD — COMPLETE SHOWCASE DATASET SEED QUERY
-- Target Supabase Project: https://jfeveaptdeqniyriwcbc.supabase.co
-- Schema: public
--
-- Instructions:
-- 1. Open Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard/project/jfeveaptdeqniyriwcbc/sql/new)
-- 2. Paste this entire query and click "Run" (Cmd+Enter / Ctrl+Enter)
-- 3. All features (Manager, Developer, QA, Client, HR/Payroll, Admin) will be fully populated!
-- ====================================================================

${generateUpsertSql('users', users)}
${generateUpsertSql('projects', projects)}
${generateUpsertSql('modules', modules)}
${generateUpsertSql('tasks', tasks)}
${generateUpsertSql('submissions', submissions)}
${generateUpsertSql('bugs', bugs)}
${generateUpsertSql('time_entries', timeEntries)}
${generateUpsertSql('work_sessions', workSessions)}
${generateUpsertSql('reviews', reviews)}
${generateUpsertSql('payroll_adjustments', adjustments)}
${generateUpsertSql('audit_logs', auditLogs)}
${generateUpsertSql('notifications', notifications)}
`;

  const sqlExportPath = path.resolve(__dirname, '../../supabase/showcase_seed_all_features.sql');
  fs.writeFileSync(sqlExportPath, completeSql, 'utf8');
  console.log('✅ Generated SQL script saved to:', sqlExportPath);

  console.log('\n====================================================');
  console.log('🎉 ALL SHOWCASE DATA SUCCESSFULLY POPULATED IN SUPABASE!');
  console.log('====================================================\n');
}

populateShowcase();
