import { getAllUsers } from '@/app/actions/user';
import TeamListClient from './TeamListClient';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Team Management | AI CEO',
};

export const dynamic = 'force-dynamic';

export default async function TeamManagementPage() {
  const users = await getAllUsers();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(142 71% 45% / 0.15)', color: 'hsl(142 71% 45%)' }}
            >
              <Users size={20} />
            </div>
            <h1 className="text-2xl font-bold font-display text-text-primary">Team Management</h1>
          </div>
          <p className="text-text-secondary text-sm">
            Total Members: <span className="text-text-primary font-bold">{users.length}</span>
          </p>
        </div>
      </div>

      {/* User List Client Component */}
      <TeamListClient initialUsers={users} />
    </div>
  );
}
