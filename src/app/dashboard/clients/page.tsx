import { getClientProjects } from '@/app/actions/clients';
import { prisma } from '@/lib/db';
import ClientProjectsClient from './ClientProjectsClient';
import { FolderGit2 } from 'lucide-react';

export const metadata = {
  title: 'Client Projects | AI CEO',
};

export default async function ClientProjectsPage() {
  const projects = await getClientProjects();
  const allUsers = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(271 91% 65% / 0.15)', color: 'hsl(271 91% 65%)' }}
            >
              <FolderGit2 size={20} />
            </div>
            <h1 className="text-2xl font-bold font-display text-text-primary">Client Projects</h1>
          </div>
          <p className="text-text-secondary text-sm">
            Manage active client work and assign team members for AI evaluation tracking.
          </p>
        </div>
      </div>

      <ClientProjectsClient initialProjects={projects} allUsers={allUsers} />
    </div>
  );
}
