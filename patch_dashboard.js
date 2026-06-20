const fs = require('fs');

let content = fs.readFileSync('src/components/UniversalDashboard.tsx', 'utf8');

// 1. Add derived states right after `const [tasks, setTasks] = useState<any[]>([]);`
const derivedStates = `
  // Derived task states
  const derivedTechTasks = tasks.map(t => ({
    id: t.id,
    col: t.status === 'TODO' ? 'Backlog' : t.status === 'IN_PROGRESS' ? 'In Progress' : t.status === 'BLOCKED' ? 'Review' : 'Done',
    title: t.title,
    points: Math.max(1, Math.round(t.complexityWeight * 10)),
  }));

  const derivedDesignRequests = tasks.map(t => ({
    id: t.id,
    client: t.description || 'Internal',
    type: t.title,
    stage: t.status === 'TODO' ? 'Request' : t.status === 'IN_PROGRESS' ? 'WIP' : t.status === 'BLOCKED' ? 'Review' : 'Delivered',
    daysLeft: t.dueDate ? Math.max(0, Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24))) : 0,
    priority: t.complexityWeight >= 0.8 ? 'URGENT' : t.complexityWeight >= 0.6 ? 'HIGH' : t.complexityWeight >= 0.3 ? 'MEDIUM' : 'LOW',
  }));

  const derivedVideoTasks = tasks.map(t => ({
    id: t.id,
    title: t.title,
    client: t.description || 'Internal',
    status: t.status === 'DONE' ? 'DONE' : t.status === 'TODO' ? 'TODO' : 'IN_PROGRESS',
    due: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No Due Date',
    complexity: t.complexityWeight,
  }));

  const derivedOpsTasks = {
    'To Do': tasks.filter(t => t.status === 'TODO' || t.status === 'BLOCKED').map(t => ({ id: t.id, title: t.title, priority: t.complexityWeight >= 0.8 ? 'URGENT' : t.complexityWeight >= 0.6 ? 'HIGH' : t.complexityWeight >= 0.3 ? 'MEDIUM' : 'LOW', time: 'Tracked' })),
    'In Progress': tasks.filter(t => t.status === 'IN_PROGRESS').map(t => ({ id: t.id, title: t.title, priority: t.complexityWeight >= 0.8 ? 'URGENT' : t.complexityWeight >= 0.6 ? 'HIGH' : t.complexityWeight >= 0.3 ? 'MEDIUM' : 'LOW', time: 'Tracked' })),
    'Done': tasks.filter(t => t.status === 'DONE').map(t => ({ id: t.id, title: t.title, priority: t.complexityWeight >= 0.8 ? 'URGENT' : t.complexityWeight >= 0.6 ? 'HIGH' : t.complexityWeight >= 0.3 ? 'MEDIUM' : 'LOW', time: 'Tracked' })),
  };
`;

content = content.replace(
  "const [tasks, setTasks] = useState<any[]>([]);",
  "const [tasks, setTasks] = useState<any[]>([]);\n" + derivedStates
);

// 2. Replace static array usages in the render
content = content.replace(/SPRINT_TASKS/g, "derivedTechTasks");
content = content.replace(/ASSET_REQUESTS/g, "derivedDesignRequests");
content = content.replace(/VIDEO_TASKS/g, "derivedVideoTasks");

// For OPS, replace opsTasks with derivedOpsTasks ONLY where it's used to read
content = content.replace(/opsTasks\['Done'\]/g, "derivedOpsTasks['Done']");
content = content.replace(/Object\.values\(opsTasks\)/g, "Object.values(derivedOpsTasks)");
content = content.replace(/opsTasks\[col as keyof typeof opsTasks\]/g, "derivedOpsTasks[col as keyof typeof derivedOpsTasks]");

fs.writeFileSync('src/components/UniversalDashboard.tsx', content);
console.log('Patched UniversalDashboard.tsx');
