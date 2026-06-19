import { prisma } from '@/lib/db';
import { getAllUsers } from '@/app/actions/user';
import AdminTasksClient from '@/app/dashboard/admin/tasks/AdminTasksClient';
import { ClipboardList } from 'lucide-react';

export const metadata = {
  title: 'Task Management | Command Center',
};

export default async function AdminTasksPage() {
  // Fetch all tasks from DB with their assigned user
  const tasks = await prisma.task.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch all registered users (from Clerk + DB details) to populate the task assignment dropdown
  const users = await getAllUsers();

  // Map dates to strings/JSON-safe formats
  const serializedTasks = tasks.map(task => ({
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    blockedAt: task.blockedAt ? task.blockedAt.toISOString() : null,
    user: {
      ...task.user,
      createdAt: task.user.createdAt.toISOString(),
      updatedAt: task.user.updatedAt.toISOString(),
    }
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(234 89% 74% / 0.15)', color: 'hsl(234 89% 74%)' }}
            >
              <ClipboardList size={20} />
            </div>
            <h1 className="text-2xl font-bold font-display text-text-primary">Task Management</h1>
          </div>
          <p className="text-text-secondary text-sm">
            Assign and monitor agency workflows in real-time
          </p>
        </div>
      </div>

      <AdminTasksClient initialTasks={serializedTasks} users={users} />
    </div>
  );
}
