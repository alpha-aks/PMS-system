'use client';

import { useState, useEffect, useTransition } from 'react';
import { getUserTasks, userUpdateTaskStatus, sendWorkReportToDiscord } from '@/app/actions/task';
import { useUser } from '@clerk/nextjs';
import { 
  CheckCircle2, Clock, AlertTriangle, Play, ChevronDown, 
  Loader2, Check, Calendar, AlertCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '@/lib/utils';

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

  // Work Report modal state
  const [reportingTask, setReportingTask] = useState<Task | null>(null);
  const [reportText, setReportText] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const { user: clerkUser } = useUser();

  // Watch / Timer States
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});
  const [timeSpentOnComplete, setTimeSpentOnComplete] = useState<number>(0);

  const formatFriendlyDuration = (totalSeconds: number) => {
    if (totalSeconds <= 0) return '0 secs';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) {
      parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds} sec${seconds > 1 ? 's' : ''}`);
    }
    return parts.join(' ');
  };

  const getTaskElapsedSeconds = (task: Task) => {
    try {
      const dateVal = task.createdAt;
      const parsedDate = dateVal instanceof Date ? dateVal : new Date(dateVal);
      if (isNaN(parsedDate.getTime())) {
        return 0;
      }
      return Math.floor((Date.now() - parsedDate.getTime()) / 1000);
    } catch (e) {
      console.error("Failed to parse task date:", e);
      return 0;
    }
  };

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

  // Real-time ticking for active tasks (not DONE)
  useEffect(() => {
    if (tasks.length === 0) return;

    const calculateTimes = () => {
      const updatedTimes: Record<string, number> = {};
      let hasActiveTasks = false;
      tasks.forEach((task) => {
        if (task.status !== 'DONE') {
          hasActiveTasks = true;
          updatedTimes[task.id] = getTaskElapsedSeconds(task);
        }
      });

      if (hasActiveTasks) {
        setElapsedTimes(updatedTimes);
      } else {
        setElapsedTimes(prev => {
          if (Object.keys(prev).length === 0) return prev;
          return {};
        });
      }
    };

    calculateTimes(); // Run immediately

    const interval = setInterval(calculateTimes, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const handleOpenReportModal = (task: Task) => {
    setReportingTask(task);
    const seconds = getTaskElapsedSeconds(task);
    setTimeSpentOnComplete(seconds);
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    if (newStatus === 'BLOCKED') {
      setBlockingTaskId(taskId);
      return;
    }
    if (newStatus === 'DONE') {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        handleOpenReportModal(task);
        return;
      }
    }

    submitStatusChange(taskId, newStatus);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingTask) return;

    const userName = clerkUser?.fullName || clerkUser?.firstName || 'Unknown User';
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress || 'No Email';
    const timeString = formatFriendlyDuration(timeSpentOnComplete);

    setSubmittingReport(true);
    startTransition(async () => {
      try {
        // 1. Send report to Discord Webhook
        const discordRes = await sendWorkReportToDiscord(
          reportingTask.id,
          reportingTask.title,
          userEmail,
          userName,
          reportText,
          proofUrl,
          timeString
        );

        if (!discordRes.success) {
          console.warn("Discord report warning:", discordRes.error);
          if (discordRes.error === "Discord webhook not configured.") {
            alert("Warning: Discord webhook is not configured in .env, but marking task as completed.");
          }
        }

        // 2. Update task status to DONE in database
        await userUpdateTaskStatus(reportingTask.id, 'DONE');
        
        // 3. Update client state
        setTasks(prev => 
          prev.map(t => t.id === reportingTask.id ? { 
            ...t, 
            status: 'DONE',
            completedAt: new Date(),
          } : t)
        );

        // 4. Clean up stopwatch state
        setElapsedTimes(prev => {
          const next = { ...prev };
          delete next[reportingTask.id];
          return next;
        });

        // 5. Reset state
        setReportingTask(null);
        setReportText('');
        setProofUrl('');
        setTimeSpentOnComplete(0);
      } catch (error) {
        alert('Failed to submit work report.');
      } finally {
        setSubmittingReport(false);
      }
    });
  };

  const submitStatusChange = (taskId: string, newStatus: Task['status'], blockerReason?: string) => {
    setUpdatingTaskId(taskId);
    startTransition(async () => {
      try {
        await userUpdateTaskStatus(taskId, newStatus, blockerReason);
        
        // Handle timer init based on status change
        if (newStatus !== 'DONE') {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            const elapsed = getTaskElapsedSeconds(task);
            setElapsedTimes(prev => ({ ...prev, [taskId]: elapsed }));
          }
        } else {
          setElapsedTimes(prev => {
            const next = { ...prev };
            delete next[taskId];
            return next;
          });
        }

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

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
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
                onClick={() => !isCompleted && handleOpenReportModal(task)}
                className={`p-3.5 rounded-xl border transition-all duration-200 ${!isCompleted ? 'cursor-pointer hover:border-white/20 hover:bg-white/[0.02]' : ''}`}
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
                      <span className="text-[10px] text-text-muted flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                        <Clock size={10} />
                        Assigned {timeAgo(task.createdAt)}
                      </span>
                      {task.status !== 'DONE' && (
                        <span className="text-[10px] font-semibold tracking-wide uppercase bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping mr-0.5" />
                          ⏱️ {formatFriendlyDuration(elapsedTimes[task.id] || 0)}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-lg border ${isToday(task.dueDate) ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 font-bold animate-pulse' : 'bg-white/5 text-text-muted border-white/10'}`}>
                          <Calendar size={10} />
                          {isToday(task.dueDate) ? 'Due Today' : `Due ${formatDate(task.dueDate)}`}
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
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="relative inline-block text-left group"
                  >
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

      {/* Work Report Modal */}
      {reportingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-dark border border-white/10 rounded-2xl p-5 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setReportingTask(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
            <h3 className="text-md font-bold text-text-primary mb-1">Submit Work Report</h3>
            <p className="text-xs text-text-muted mb-4">
              Submit your work details and proof of completion for: <span className="font-semibold text-text-primary">{reportingTask.title}</span>
            </p>

            <div className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/10 flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                ⏱️ Time Tracked
              </span>
              <span className="text-sm font-bold text-sky-400 font-mono">
                {formatFriendlyDuration(timeSpentOnComplete)}
              </span>
            </div>
            
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Report of Work <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="w-full bg-bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors h-24 resize-none"
                  placeholder="Describe the work you completed, key files changed, or updates made..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Proof of Work (Link or Description) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full bg-bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="e.g. GitHub PR URL, loom video link, or commit hash"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingTask(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport || !reportText.trim() || !proofUrl.trim()}
                  className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5"
                >
                  {submittingReport ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      Complete Task & Send Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
