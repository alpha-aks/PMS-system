'use client';

import { useState, useEffect, useTransition } from 'react';
import { getUserTasks, userUpdateTaskStatus } from '@/app/actions/task';
import { 
  CheckCircle2, Clock, AlertTriangle, Play, ChevronDown, 
  Loader2, Check, Calendar, AlertCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  complexityWeight: number;
  estimatedHours: number | null;
  blockerReason: string | null;
  blockedAt: Date | null;
  completedAt: Date | null;
  dueDate: Date | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  clerkId: string;
}

const statusConfig = {
  TODO: { color: 'hsl(210 100% 70%)', bg: 'hsl(210 100% 70% / 0.1)', label: 'To Do', icon: <Clock size={12} /> },
  IN_PROGRESS: { color: 'hsl(234 89% 74%)', bg: 'hsl(234 89% 74% / 0.1)', label: 'In Progress', icon: <Play size={12} /> },
  BLOCKED: { color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.1)', label: 'Blocked', icon: <AlertTriangle size={12} /> },
  DONE: { color: 'hsl(142 71% 45%)', bg: 'hsl(142 71% 45% / 0.1)', label: 'Completed', icon: <CheckCircle2 size={12} /> },
};

export default function UserTasksWidget({ clerkId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Blocker modal state
  const [blockingTaskId, setBlockingTaskId] = useState<string | null>(null);
  const [blockerReasonText, setBlockerReasonText] = useState('');

  const fetchTasks = async () => {
    try {
      const userTasks = await getUserTasks(clerkId);
      // Map string dates to Date objects if needed
      const mapped = userTasks.map(t => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
        blockedAt: t.blockedAt ? new Date(t.blockedAt) : null,
      }));
      setTasks(mapped);
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clerkId) {
      fetchTasks();
    }
  }, [clerkId]);

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    if (newStatus === 'BLOCKED') {
      setBlockingTaskId(taskId);
      return;
    }

    submitStatusChange(taskId, newStatus);
  };

  const submitStatusChange = (taskId: string, newStatus: Task['status'], blockerReason?: string) => {
    setUpdatingTaskId(taskId);
    startTransition(async () => {
      try {
        await userUpdateTaskStatus(taskId, newStatus, blockerReason);
        setTasks(prev => 
          prev.map(t => t.id === taskId ? { 
            ...t, 
            status: newStatus,
            completedAt: newStatus === 'DONE' ? new Date() : null,
            blockerReason: newStatus === 'BLOCKED' ? (blockerReason || 'Blocked') : null,
            blockedAt: newStatus === 'BLOCKED' ? new Date() : null,
          } : t)
        );
      } catch (error) {
        alert('Failed to update task status.');
      } finally {
        setUpdatingTaskId(null);
        setBlockingTaskId(null);
        setBlockerReasonText('');
      }
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="glass-card p-5 flex items-center justify-center min-h-[200px]">
        <Loader2 className="animate-spin text-accent-primary" size={24} />
      </div>
    );
  }

  const activeTasks = tasks.filter(t => t.status !== 'DONE');
  const completedTasks = tasks.filter(t => t.status === 'DONE');

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-text-primary font-display text-lg">My Assigned Tasks</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''} · {completedTasks.length} completed
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm border border-dashed border-white/10 rounded-xl">
            No tasks assigned to you yet. Good job!
          </div>
        ) : (
          tasks.map((task) => {
            const status = statusConfig[task.status] || statusConfig.TODO;
            const isCompleted = task.status === 'DONE';

            return (
              <motion.div
                key={task.id}
                layout
                className="p-3.5 rounded-xl border transition-all duration-200"
                style={{ 
                  background: isCompleted ? 'hsl(220 20% 8%)' : 'hsl(220 20% 10%)',
                  borderColor: isCompleted ? 'hsl(220 20% 12%)' : 'hsl(220 20% 16%)'
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Status Indicator Bar */}
                  <div
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ background: status.color }}
                  />

                  {/* Task Text Details */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold transition-all ${isCompleted ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {task.title}
                    </p>
                    {task.description && !isCompleted && (
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Meta info tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {task.tags.includes('ADMIN') ? (
                        <span className="text-[9px] font-semibold tracking-wide uppercase bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20">
                          Admin Assigned
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                          AI Suggested
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="text-[10px] text-text-muted flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                          <Calendar size={10} />
                          Due {formatDate(task.dueDate)}
                        </span>
                      )}
                      <span className="text-[10px] text-text-muted bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                        Weight: {Math.round(task.complexityWeight * 100)}%
                      </span>
                    </div>

                    {/* Blocker details */}
                    {task.status === 'BLOCKED' && task.blockerReason && (
                      <div className="mt-2.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-1.5">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        <span>Blocker: {task.blockerReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Dropdown status update selector */}
                  <div className="relative inline-block text-left group">
                    <button
                      disabled={updatingTaskId === task.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border transition-all"
                      style={{
                        background: status.bg,
                        color: status.color,
                        borderColor: 'transparent'
                      }}
                    >
                      {updatingTaskId === task.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          {status.icon}
                          <span>{status.label}</span>
                        </>
                      )}
                      <ChevronDown size={11} />
                    </button>

                    <div 
                      className="absolute right-0 top-full mt-1.5 w-32 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden"
                      style={{ background: 'hsl(220 25% 10%)', border: '1px solid hsl(220 20% 20%)' }}
                    >
                      <div className="py-1">
                        {(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const).map((statusOption) => (
                          <button
                            key={statusOption}
                            onClick={() => handleStatusChange(task.id, statusOption)}
                            className="w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-white/5 text-text-secondary hover:text-text-primary"
                          >
                            {statusConfig[statusOption].label}
                            {task.status === statusOption && <Check size={11} className="text-accent-primary" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Blocker Modal */}
      {blockingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-dark border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => setBlockingTaskId(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
            <h3 className="text-md font-bold text-text-primary mb-1">State Blocker Reason</h3>
            <p className="text-xs text-text-muted mb-4">Please explain what is blocking this task so the team is informed.</p>
            
            <textarea
              required
              value={blockerReasonText}
              onChange={(e) => setBlockerReasonText(e.target.value)}
              className="w-full bg-bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors h-20 resize-none"
              placeholder="e.g. Waiting on Client API keys..."
            />
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setBlockingTaskId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submitStatusChange(blockingTaskId, 'BLOCKED', blockerReasonText)}
                disabled={!blockerReasonText.trim()}
                className="btn-primary py-1 px-3 text-xs"
              >
                Block Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
