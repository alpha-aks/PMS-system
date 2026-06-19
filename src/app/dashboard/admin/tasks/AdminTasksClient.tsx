'use client';

import { useState, useTransition, useMemo } from 'react';
import { UserData } from '@/app/actions/user';
import { adminAssignTask, adminUpdateTaskStatus, adminDeleteTask } from '@/app/actions/task';
import { ROLE_COLORS, ROLE_LABELS } from '@/lib/utils';
import { 
  Plus, Search, Trash2, CheckCircle2, Clock, AlertTriangle, 
  Play, Calendar, User, Loader2, ChevronDown, Filter,
  X, Check, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Defined types for serialized data
interface TaskUser {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  alias: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface SerializedTask {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  complexityWeight: number;
  estimatedHours: number | null;
  blockerReason: string | null;
  blockedAt: string | null;
  completedAt: string | null;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  user: TaskUser;
}

interface Props {
  initialTasks: SerializedTask[];
  users: UserData[];
}

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Completed',
};

const STATUS_COLORS = {
  TODO: { text: 'hsl(210 100% 70%)', bg: 'hsl(210 100% 70% / 0.12)', border: 'hsl(210 100% 70% / 0.25)' },
  IN_PROGRESS: { text: 'hsl(234 89% 74%)', bg: 'hsl(234 89% 74% / 0.12)', border: 'hsl(234 89% 74% / 0.25)' },
  BLOCKED: { text: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.12)', border: 'hsl(0 84% 60% / 0.25)' },
  DONE: { text: 'hsl(142 71% 45%)', bg: 'hsl(142 71% 45% / 0.12)', border: 'hsl(142 71% 45% / 0.25)' },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function AdminTasksClient({ initialTasks, users }: Props) {
  const [tasks, setTasks] = useState<SerializedTask[]>(initialTasks);
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Assign task modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignUser, setAssignUser] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'TODO').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
    const completed = tasks.filter(t => t.status === 'DONE').length;
    return { total, todo, inProgress, blocked, completed };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesUser = selectedUser === 'ALL' || task.user.clerkId === selectedUser;
      const matchesStatus = selectedStatus === 'ALL' || task.status === selectedStatus;
      
      const normalizedQuery = searchQuery.toLowerCase();
      const matchesSearch = 
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.description && task.description.toLowerCase().includes(normalizedQuery)) ||
        task.user.name.toLowerCase().includes(normalizedQuery) ||
        (task.user.alias && task.user.alias.toLowerCase().includes(normalizedQuery));
        
      return matchesUser && matchesStatus && matchesSearch;
    });
  }, [tasks, selectedUser, selectedStatus, searchQuery]);

  const handleStatusChange = (taskId: string, newStatus: SerializedTask['status']) => {
    setUpdatingTaskId(taskId);
    startTransition(async () => {
      try {
        await adminUpdateTaskStatus(taskId, newStatus);
        setTasks(prev => 
          prev.map(t => t.id === taskId ? { 
            ...t, 
            status: newStatus,
            completedAt: newStatus === 'DONE' ? new Date().toISOString() : null
          } : t)
        );
      } catch (error) {
        alert('Failed to update status.');
      } finally {
        setUpdatingTaskId(null);
      }
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setUpdatingTaskId(taskId);
    try {
      await adminDeleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      alert('Failed to delete task.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUser || !taskTitle.trim()) return;

    setIsAssigning(true);
    try {
      const date = taskDueDate ? new Date(taskDueDate) : null;
      const res = await adminAssignTask(assignUser, taskTitle, taskDesc, date);
      
      if (res.success && res.task) {
        // Create full serialized task structure for immediate state update
        const assignedUserObj = users.find(u => u.id === assignUser);
        const newTask: SerializedTask = {
          ...res.task,
          createdAt: res.task.createdAt.toISOString(),
          updatedAt: res.task.updatedAt.toISOString(),
          dueDate: res.task.dueDate ? res.task.dueDate.toISOString() : null,
          completedAt: res.task.completedAt ? res.task.completedAt.toISOString() : null,
          blockedAt: res.task.blockedAt ? res.task.blockedAt.toISOString() : null,
          user: {
            id: res.task.userId,
            clerkId: assignUser,
            name: assignedUserObj ? `${assignedUserObj.firstName || ''} ${assignedUserObj.lastName || ''}`.trim() : 'Unknown',
            email: assignedUserObj?.email || '',
            avatarUrl: assignedUserObj?.imageUrl || null,
            alias: assignedUserObj?.alias || null,
            role: assignedUserObj?.role || 'DEV',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
        
        setTasks(prev => [newTask, ...prev]);
        setIsAssignModalOpen(false);
        setAssignUser('');
        setTaskTitle('');
        setTaskDesc('');
        setTaskDueDate('');
        alert('Task assigned successfully!');
      }
    } catch (error) {
      alert('Failed to assign task.');
    } finally {
      setIsAssigning(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Assigned', value: stats.total, color: 'hsl(220 10% 60%)', bg: 'hsl(220 10% 60% / 0.1)' },
          { label: 'To Do', value: stats.todo, color: 'hsl(210 100% 70%)', bg: 'hsl(210 100% 70% / 0.1)' },
          { label: 'In Progress', value: stats.inProgress, color: 'hsl(234 89% 74%)', bg: 'hsl(234 89% 74% / 0.1)' },
          { label: 'Blocked', value: stats.blocked, color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.1)' },
          { label: 'Completed', value: stats.completed, color: 'hsl(142 71% 45%)', bg: 'hsl(142 71% 45% / 0.1)' },
        ].map((s) => (
          <div key={s.label} className="premium-card p-4 flex flex-col justify-between">
            <span className="text-xs text-text-muted">{s.label}</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-display text-text-primary">{s.value}</span>
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Actions */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 md:flex-initial">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search tasks or members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-bg-dark border border-white/10 rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          {/* User Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-text-muted" />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-bg-dark border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
            >
              <option value="ALL">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.alias || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-bg-dark border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DONE">Completed</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="btn-primary flex items-center gap-2 self-start md:self-auto shrink-0"
        >
          <Plus size={15} />
          Assign Task
        </button>
      </div>

      {/* Task List / Table */}
      <div className="glass-panel p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: 'hsl(220 20% 16%)' }}>
                <th className="pb-3 px-4 font-semibold text-text-secondary text-sm">Task Details</th>
                <th className="pb-3 px-4 font-semibold text-text-secondary text-sm">Assigned User</th>
                <th className="pb-3 px-4 font-semibold text-text-secondary text-sm">Due Date</th>
                <th className="pb-3 px-4 font-semibold text-text-secondary text-sm">Completed At</th>
                <th className="pb-3 px-4 font-semibold text-text-secondary text-sm text-center">Status</th>
                <th className="pb-3 px-4 font-semibold text-text-secondary text-sm text-right">Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={container} initial="hidden" animate="show">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted text-sm">
                    No tasks found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const statusInfo = STATUS_COLORS[task.status] || STATUS_COLORS.TODO;
                  const roleColor = ROLE_COLORS[task.user.role as keyof typeof ROLE_COLORS] || '#fff';
                  
                  return (
                    <motion.tr 
                      key={task.id} 
                      variants={item}
                      className="border-b last:border-0 hover:bg-white/[0.01] transition-colors" 
                      style={{ borderColor: 'hsl(220 20% 14%)' }}
                    >
                      {/* Task Info */}
                      <td className="py-4 px-4 max-w-[320px]">
                        <div>
                          <p className="text-sm font-semibold text-text-primary line-clamp-1" title={task.title}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-text-muted mt-1 line-clamp-2" title={task.description}>
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {task.tags.includes('ADMIN') ? (
                              <span className="text-[9px] font-semibold tracking-wide uppercase bg-violet-500/10 text-violet-400 px-1.5 py-0.2 rounded border border-violet-500/20">
                                Admin
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                AI
                              </span>
                            )}
                            <span className="text-[10px] bg-white/5 border border-white/10 text-text-secondary px-1.5 py-0.2 rounded">
                              W: {task.complexityWeight}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              Created {formatDate(task.createdAt)}
                            </span>
                          </div>
                          
                          {/* Blocker Reason Alert if BLOCKED */}
                          {task.status === 'BLOCKED' && task.blockerReason && (
                            <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-1.5">
                              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                              <span>Blocker: {task.blockerReason}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* User Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          {task.user.avatarUrl ? (
                            <img src={task.user.avatarUrl} alt={task.user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: roleColor }}>
                              {task.user.name[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {task.user.alias || task.user.name}
                            </p>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase" style={{ color: roleColor, background: `${roleColor}15`, border: `1px solid ${roleColor}25` }}>
                              {ROLE_LABELS[task.user.role as keyof typeof ROLE_LABELS] || task.user.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4 text-sm text-text-secondary">
                        {formatDate(task.dueDate)}
                      </td>

                      {/* Completed At */}
                      <td className="py-4 px-4 text-sm text-text-secondary">
                        {formatDate(task.completedAt)}
                      </td>

                      {/* Status Selector Dropdown */}
                      <td className="py-4 px-4 text-center">
                        <div className="relative inline-block text-left group">
                          <button
                            disabled={updatingTaskId === task.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg text-xs font-semibold transition-colors uppercase border"
                            style={{
                              background: statusInfo.bg,
                              color: statusInfo.text,
                              borderColor: statusInfo.border
                            }}
                          >
                            {updatingTaskId === task.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <span>{STATUS_LABELS[task.status]}</span>
                            )}
                            <ChevronDown size={12} />
                          </button>

                          <div 
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-32 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden"
                            style={{ background: 'hsl(220 25% 10%)', border: '1px solid hsl(220 20% 20%)' }}
                          >
                            <div className="py-1">
                              {(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const).map((statusOption) => (
                                <button
                                  key={statusOption}
                                  onClick={() => handleStatusChange(task.id, statusOption)}
                                  className="w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-white/5 text-text-secondary hover:text-text-primary"
                                >
                                  {STATUS_LABELS[statusOption]}
                                  {task.status === statusOption && <Check size={12} className="text-accent-primary" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Delete Action */}
                      <td className="py-4 px-4 text-right">
                        <button
                          disabled={updatingTaskId === task.id}
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-text-muted hover:text-red-500 rounded-lg hover:bg-white/5 transition-colors inline-flex items-center justify-center"
                          title="Delete Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* Task Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-dark border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-xl font-bold font-display text-text-primary mb-1">Assign New Task</h3>
            <p className="text-sm text-text-muted mb-6">Create a workflow requirement for a team member.</p>

            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Assign User *</label>
                <select
                  required
                  value={assignUser}
                  onChange={(e) => setAssignUser(e.target.value)}
                  className="w-full bg-bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
                >
                  <option value="">Select a user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.alias || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email} ({u.role || 'No Role'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="e.g. Optimize SQL queries"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-primary transition-colors h-24 resize-none"
                  placeholder="Provide brief guidelines, requirements, or links..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Due Date (Optional)</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-primary transition-colors [color-scheme:dark]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="btn-primary"
                >
                  {isAssigning ? <Loader2 size={16} className="animate-spin" /> : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
