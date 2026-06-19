'use client';

import { useState, useTransition } from 'react';
import { User } from '@prisma/client';
import { createClientProject, assignUserToProject, removeUserFromProject } from '@/app/actions/clients';
import { FolderGit2, Plus, Users, X, Loader2, UserPlus } from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  assignedUsers: User[];
}

interface Props {
  initialProjects: ProjectData[];
  allUsers: User[];
}

export default function ClientProjectsClient({ initialProjects, allUsers }: Props) {
  const [projects, setProjects] = useState(initialProjects);
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [activeAssignMenu, setActiveAssignMenu] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    startTransition(async () => {
      try {
        const result = await createClientProject(newName, newDesc);
        if (result.success) {
          setProjects([{ ...result.project, assignedUsers: [] } as any, ...projects]);
          setNewName('');
          setNewDesc('');
        }
      } catch (error) {
        alert('Failed to create project.');
      } finally {
        setIsCreating(false);
      }
    });
  };

  const handleAssign = (projectId: string, userId: string) => {
    startTransition(async () => {
      try {
        await assignUserToProject(projectId, userId);
        setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            const user = allUsers.find(u => u.id === userId);
            if (user && !p.assignedUsers.find(au => au.id === userId)) {
              return { ...p, assignedUsers: [...p.assignedUsers, user] };
            }
          }
          return p;
        }));
      } catch (error) {
        alert('Failed to assign user.');
      }
    });
    setActiveAssignMenu(null);
  };

  const handleRemove = (projectId: string, userId: string) => {
    startTransition(async () => {
      try {
        await removeUserFromProject(projectId, userId);
        setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            return { ...p, assignedUsers: p.assignedUsers.filter(u => u.id !== userId) };
          }
          return p;
        }));
      } catch (error) {
        alert('Failed to remove user.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Create new project card */}
      <div className="glass-panel p-6 border border-white/5">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Plus size={18} className="text-accent-primary" /> Create New Client Project
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Project Name (e.g. Nike Rebranding)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            disabled={isCreating || isPending}
            className="input-primary col-span-1"
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            disabled={isCreating || isPending}
            className="input-primary col-span-1 md:col-span-1"
          />
          <button
            onClick={handleCreate}
            disabled={isCreating || isPending || !newName.trim()}
            className="btn-primary w-full md:w-auto self-start"
          >
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : 'Create Project'}
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map(project => (
          <div key={project.id} className="premium-card p-5 relative overflow-visible">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold font-display text-text-primary">{project.name}</h3>
                {project.description && <p className="text-sm text-text-secondary mt-1">{project.description}</p>}
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/30">
                {project.status}
              </span>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} /> Assigned Team Members
                </span>
                
                {/* Assign Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveAssignMenu(activeAssignMenu === project.id ? null : project.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-accent-primary hover:text-white transition-colors"
                  >
                    <UserPlus size={14} /> Assign
                  </button>
                  
                  {activeAssignMenu === project.id && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-bg-dark border border-white/10 shadow-xl z-50 p-1 overflow-hidden">
                      {allUsers.filter(u => !project.assignedUsers.find(au => au.id === u.id)).length === 0 ? (
                         <div className="px-3 py-2 text-xs text-text-muted">All users assigned</div>
                      ) : (
                        allUsers.filter(u => !project.assignedUsers.find(au => au.id === u.id)).map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleAssign(project.id, user.id)}
                            className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary rounded-lg transition-colors flex items-center gap-2"
                          >
                            <div className="w-5 h-5 rounded-full bg-accent-primary/20 flex items-center justify-center text-[9px] font-bold text-accent-primary">
                              {user.name[0]}
                            </div>
                            {user.alias || user.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Users List */}
              <div className="flex flex-wrap gap-2">
                {project.assignedUsers.length === 0 && (
                  <span className="text-xs text-text-muted italic">No one assigned yet.</span>
                )}
                {project.assignedUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                    <span className="font-medium text-text-primary">{user.alias || user.name}</span>
                    <button 
                      onClick={() => handleRemove(project.id, user.id)}
                      className="text-text-muted hover:text-red-400 transition-colors ml-1 p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-muted glass-panel border-dashed border-2 border-white/10">
            <FolderGit2 size={48} className="mx-auto mb-4 opacity-20" />
            <p>No client projects created yet.</p>
            <p className="text-sm mt-1">Create one above to start assigning team members.</p>
          </div>
        )}
      </div>
    </div>
  );
}
