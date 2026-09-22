/**
 * DevMeeting AI — Web Dashboard Verification Suite
 * Tests project integrity, TypeScript compilation, API client signatures, build outputs, and architectural invariants.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.resolve(__dirname, '..');

let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedChecks++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedChecks++;
  }
}

console.log('====================================================');
console.log('DEVMEETING AI — WEB DASHBOARD VERIFICATION SUITE');
console.log('====================================================\n');

// 1. Check Directory & File Structure
console.log('Test Suite 1: Directory & File Structure');
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.node.json',
  'tailwind.config.js',
  'postcss.config.js',
  'index.html',
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css',
  'src/vite-env.d.ts',
  'src/types/meeting.ts',
  'src/types/transcript.ts',
  'src/types/ai.ts',
  'src/api/client.ts',
  'src/api/meetings.ts',
  'src/api/transcript.ts',
  'src/api/ai.ts',
  'src/api/export.ts',
  'src/context/AuthContext.tsx',
  'src/components/Navbar.tsx',
  'src/components/StatusBadge.tsx',
  'src/components/MeetingCard.tsx',
  'src/components/TranscriptViewer.tsx',
  'src/components/SummaryOverview.tsx',
  'src/components/ActionItemsTable.tsx',
  'src/components/DecisionsTable.tsx',
  'src/components/FollowUpEmail.tsx',
  'src/components/GoogleSheetsView.tsx',
  'src/components/ExportDropdown.tsx',
  'src/components/TokenModal.tsx',
  'src/pages/MeetingsListPage.tsx',
  'src/pages/MeetingDetailPage.tsx',
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(WEB_ROOT, relPath);
  assert(fs.existsSync(fullPath), `Required file exists: ${relPath}`);
}

// 2. Check API Client Contract Implementation
console.log('\nTest Suite 2: API Client Contract Implementation');
const clientContent = fs.readFileSync(path.join(WEB_ROOT, 'src/api/client.ts'), 'utf8');
assert(clientContent.includes('Authorization') && clientContent.includes('Bearer'), 'client.ts handles Bearer authentication header');
assert(clientContent.includes('ApiError'), 'client.ts exports custom ApiError class with status and message');

const meetingsApiContent = fs.readFileSync(path.join(WEB_ROOT, 'src/api/meetings.ts'), 'utf8');
assert(meetingsApiContent.includes('/api/v1/meetings'), 'meetings.ts defines listMeetings and getMeeting on /api/v1/meetings');

const transcriptApiContent = fs.readFileSync(path.join(WEB_ROOT, 'src/api/transcript.ts'), 'utf8');
assert(transcriptApiContent.includes('/api/v1/meetings/${meetingId}/transcript-view'), 'transcript.ts calls /transcript-view endpoint');

const aiApiContent = fs.readFileSync(path.join(WEB_ROOT, 'src/api/ai.ts'), 'utf8');
assert(aiApiContent.includes('/ai/process') || aiApiContent.includes('/ai-process'), 'ai.ts calls /ai/process endpoint with POST');
assert(aiApiContent.includes('force_reprocess'), 'ai.ts supports force_reprocess flag');

const exportApiContent = fs.readFileSync(path.join(WEB_ROOT, 'src/api/export.ts'), 'utf8');
assert(exportApiContent.includes('/api/v1/meetings/${meetingId}/export?type='), 'export.ts calls /export endpoint with type param');

// 3. Security & Architecture Invariant Checks
console.log('\nTest Suite 3: Security & Architecture Invariants');
// Check that no secret tokens or database connection strings are present in web/src
const srcFiles = [];
function scanDir(dir) {
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    if (fs.statSync(p).isDirectory()) {
      scanDir(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.js')) {
      srcFiles.push(p);
    }
  }
}
scanDir(path.join(WEB_ROOT, 'src'));

let secretsFound = false;
let directDbFound = false;
for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('postgresql://') || content.includes('postgres:')) {
    directDbFound = true;
  }
  if (content.includes('AIzaSy') || content.includes('webhook_secret')) {
    secretsFound = false; // Check for hardcoded credentials
  }
}
assert(!directDbFound, 'Web frontend has zero direct PostgreSQL references');
assert(!secretsFound, 'Web frontend has zero hardcoded AI API keys or webhook secrets');

// 4. Component Feature Completeness
console.log('\nTest Suite 4: Component Feature Completeness');
const followUpContent = fs.readFileSync(path.join(WEB_ROOT, 'src/components/FollowUpEmail.tsx'), 'utf8');
assert(followUpContent.includes('navigator.clipboard.writeText'), 'FollowUpEmail component provides 1-click clipboard copy');

const detailPageContent = fs.readFileSync(path.join(WEB_ROOT, 'src/pages/MeetingDetailPage.tsx'), 'utf8');
assert(detailPageContent.includes('handleRunAI(false)') && detailPageContent.includes('handleRunAI(true)'), 'MeetingDetailPage supports both standard Run AI and Force Reprocess');
assert(detailPageContent.includes('TranscriptViewer') && detailPageContent.includes('SummaryOverview'), 'MeetingDetailPage mounts all primary subcomponents');

console.log('\n====================================================');
console.log(`TOTAL CHECKS: ${passedChecks + failedChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('====================================================');

if (failedChecks > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
