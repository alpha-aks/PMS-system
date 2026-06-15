const fs = require('fs');
const path = require('path');

const files = [
  'src/app/dashboard/tech/page.tsx',
  'src/app/dashboard/dev/page.tsx',
  'src/app/dashboard/ops/page.tsx',
  'src/app/dashboard/design/page.tsx',
  'src/app/dashboard/video/page.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Ensure getUserDashboardStats is imported
  if (!content.includes("import { getUserDashboardStats } from '@/app/actions/user';")) {
    content = content.replace(
      "import { useState, useEffect } from 'react';",
      "import { useState, useEffect } from 'react';\nimport { getUserDashboardStats } from '@/app/actions/user';"
    );
  }

  // Fix Framer motion variant types
  content = content.replace(/const container = \{/g, 'const container: any = {');
  content = content.replace(/const item = \{/g, 'const item: any = {');
  
  // Also fix the any issue with 'stats' in getUserDashboardStats().then(stats => ...)
  content = content.replace(/then\(stats => \{/g, 'then((stats: any) => {');

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
