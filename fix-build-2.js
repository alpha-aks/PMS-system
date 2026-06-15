const fs = require('fs');

function replaceInFile(file, search, replaceStr) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.split(search).join(replaceStr);
  fs.writeFileSync(file, content);
}

function fixFramer(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const container = \{/g, 'const container: any = {');
  content = content.replace(/const item = \{/g, 'const item: any = {');
  fs.writeFileSync(file, content);
}

// 1. AdminDashboardClient
const adminClient = 'src/app/dashboard/admin/AdminDashboardClient.tsx';
replaceInFile(adminClient, 'member.completion', 'member.avgMonthEffort');
replaceInFile(adminClient, 'formatter={(v: number)', 'formatter={(v: any)');
fixFramer(adminClient);

// 2. Dev Page
const devPage = 'src/app/dashboard/dev/page.tsx';
replaceInFile(devPage, 'DAILY_RATE', 'monthlySalary');
fixFramer(devPage);

// 3. Market Page
const marketPage = 'src/app/dashboard/market/page.tsx';
fixFramer(marketPage);

console.log("Fixes applied!");
