'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday, addMonths, subMonths 
} from 'date-fns';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  Clock, User, CheckCircle2, Play, AlertTriangle, X, 
  Loader2, Check, AlertCircle, Filter, Trash2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { 
  createSelfTask, 
  adminAssignTask, 
  userUpdateTaskStatus, 
  sendWorkReportToDiscord, 
  adminDeleteTask 
} from '@/app/actions/task';

// Types matching database schema
interface UserType {
  id: string;
  clerkId: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

interface TaskType {
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
  user: {
    id: string;
    clerkId: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
}

interface Props {
  initialTasks: TaskType[];
  currentUser: {
    id: string;
    clerkId: string;
    name: string;
    role: string;
  };
  users: UserType[];
}

const statusConfig = {
  TODO: { color: 'hsl(210 100% 70%)', bg: 'hsl(210 100% 70% / 0.1)', label: 'To Do', border: 'border-sky-500/20' },
  IN_PROGRESS: { color: 'hsl(234 89% 74%)', bg: 'hsl(234 89% 74% / 0.1)', label: 'In Progress', border: 'border-indigo-500/20' },
  BLOCKED: { color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.1)', label: 'Blocked', border: 'border-red-500/20' },
  DONE: { color: 'hsl(142 71% 45%)', bg: 'hsl(142 71% 45% / 0.1)', label: 'Completed', border: 'border-emerald-500/20' },
};

export default function ContentCalendarClient({ initialTasks, currentUser, users }: Props) {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [tasks, setTasks] = useState<TaskType[]>(initialTasks);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterMode, setFilterMode] = useState<'MY_TASKS' | 'ALL_TASKS'>('MY_TASKS');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [isPending, startTransition] = useTransition();

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [targetUserId, setTargetUserId] = useState(currentUser.id); // Default to self
  const [creatingTask, setCreatingTask] = useState(false);

  // Task View/Edit Modal States
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [newStatus, setNewStatus] = useState<TaskType['status'] | null>(null);
  
  // Blocker Sub-Modal
  const [showBlockerInput, setShowBlockerInput] = useState(false);
  const [blockerReason, setBlockerReason] = useState('');

  // Work Report Sub-Modal
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportText, setReportText] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Sync tasks on initialTasks changes
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const setToday = () => setCurrentDate(new Date());

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    
    // Filter by Mine vs All
    if (filterMode === 'MY_TASKS' && task.user.clerkId !== currentUser.clerkId) {
      return false;
    }

    // Filter by specific user (for Admin)
    if (currentUser.role === 'ADMIN' && selectedUserFilter !== 'ALL' && task.userId !== selectedUserFilter) {
      return false;
    }

    return true;
  });

  // Handle Add Task Click
  const handleAddClick = (date: Date) => {
    setSelectedDate(date);
    setTargetUserId(currentUser.id);
    setTaskTitle('');
    setTaskDesc('');
    setShowAddModal(true);
  };

  // Submit Task Creation
  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedDate) return;

    setCreatingTask(true);
    try {
      const isSelf = targetUserId === currentUser.id;
      let res;

      if (currentUser.role === 'ADMIN' && !isSelf) {
        // Admin assigning to someone else
        const targetClerkId = users.find(u => u.id === targetUserId)?.clerkId;
        if (!targetClerkId) throw new Error('Assignee clerk ID not found');
        res = await adminAssignTask(targetClerkId, taskTitle, taskDesc, selectedDate);
      } else {
        // Self-assign task
        res = await createSelfTask(taskTitle, taskDesc, selectedDate);
      }

      if (res?.success) {
        toast.success('Task scheduled successfully!');
        setShowAddModal(false);
        router.refresh();
      } else {
        toast.error('Failed to create task.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while creating task.');
    } finally {
      setCreatingTask(false);
    }
  };

  // Status Change flow
  const handleStatusSelect = (status: TaskType['status']) => {
    setNewStatus(status);
    if (status === 'BLOCKED') {
      setShowBlockerInput(true);
      setShowReportInput(false);
    } else if (status === 'DONE') {
      setShowReportInput(true);
      setShowBlockerInput(false);
    } else {
      setShowBlockerInput(false);
      setShowReportInput(false);
      submitStatusChange(status);
    }
  };

  // Send status update to DB
  const submitStatusChange = async (status: TaskType['status'], blockerText?: string) => {
    if (!selectedTask) return;
    try {
      await userUpdateTaskStatus(selectedTask.id, status, blockerText);
      toast.success(`Task marked as ${statusConfig[status].label}`);
      
      // Close details and refresh
      setSelectedTask(null);
      setShowBlockerInput(false);
      setBlockerReason('');
      router.refresh();
    } catch (e) {
      toast.error('Failed to update task status.');
    }
  };

  // Submit Work Report
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !reportText.trim() || !proofUrl.trim()) return;

    setSubmittingReport(true);
    try {
      const userName = clerkUser?.fullName || clerkUser?.firstName || currentUser.name || 'Unknown User';
      const userEmail = clerkUser?.primaryEmailAddress?.emailAddress || 'No Email';

      // Send Discord Report
      const discordRes = await sendWorkReportToDiscord(
        selectedTask.id,
        selectedTask.title,
        userEmail,
        userName,
        reportText,
        proofUrl,
        'N/A' // No stopwatch timer
      );

      if (!discordRes.success && discordRes.error !== "Discord webhook not configured.") {
        toast.error('Discord report failed to send.');
      }

      // Update to DONE
      await userUpdateTaskStatus(selectedTask.id, 'DONE');
      toast.success('Task completed and report submitted!');
      
      // Reset
      setSelectedTask(null);
      setShowReportInput(false);
      setReportText('');
      setProofUrl('');
      router.refresh();
    } catch (error) {
      toast.error('Failed to submit work report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Delete Task (Admin Only)
  const handleDeleteTask = async () => {
    if (!selectedTask || currentUser.role !== 'ADMIN') return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await adminDeleteTask(selectedTask.id);
      toast.success('Task deleted successfully.');
      setSelectedTask(null);
      router.refresh();
    } catch (e) {
      toast.error('Failed to delete task.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-bg-dark/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner"
            style={{ background: 'hsl(234 89% 74% / 0.12)', color: 'hsl(234 89% 74%)' }}
          >
            <CalendarIcon size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-text-primary">Task Calendar</h1>
            <p className="text-text-secondary text-xs mt-0.5">
              Plan, view, and schedule tasks directly in the monthly overview.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* My vs All Toggle */}
          <div className="flex p-1 bg-bg-dark border border-white/10 rounded-xl">
            <button
              onClick={() => setFilterMode('MY_TASKS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === 'MY_TASKS' ? 'bg-white/10 text-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setFilterMode('ALL_TASKS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === 'ALL_TASKS' ? 'bg-white/10 text-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
            >
              All Team Tasks
            </button>
          </div>

          {/* Admin User Filter Dropdown */}
          {currentUser.role === 'ADMIN' && (
            <div className="flex items-center gap-2 bg-bg-dark border border-white/10 rounded-xl px-3 py-1">
              <Filter size={12} className="text-text-muted" />
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-transparent text-xs text-text-secondary outline-none border-none cursor-pointer py-1 max-w-[150px]"
              >
                <option value="ALL" className="bg-bg-dark">All Assignees</option>
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-bg-dark">{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Month Navigator & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold font-display text-text-primary">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-1.5">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-primary transition border border-white/5">
              <ChevronLeft size={16} />
            </button>
            <button onClick={setToday} className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text-secondary transition font-semibold">
              Today
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-primary transition border border-white/5">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Calendar stats info */}
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>Total Tasks: <strong className="text-text-secondary">{filteredTasks.length}</strong></span>
          <span>Pending: <strong className="text-sky-400">{filteredTasks.filter(t => t.status !== 'DONE').length}</strong></span>
          <span>Completed: <strong className="text-emerald-400">{filteredTasks.filter(t => t.status === 'DONE').length}</strong></span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel p-4 flex flex-col bg-bg-dark border border-white/5 rounded-2xl shadow-xl">
        <div className="grid grid-cols-7 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10 text-xs">
          {/* Weekday Names */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="bg-bg-dark/80 py-3 text-center font-bold text-text-muted border-b border-white/10">
              {day}
            </div>
          ))}
          
          {/* Days */}
          {daysInMonth.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            
            // Find tasks due on this day
            const dayTasks = filteredTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));

            return (
              <div 
                key={i}
                className={`min-h-[120px] p-2 bg-bg-dark relative group transition hover:bg-white/[0.02] flex flex-col justify-between ${!isCurrentMonth ? 'opacity-35 pointer-events-none' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${isDayToday ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'text-text-secondary'}`}>
                      {format(day, 'd')}
                    </span>
                    <button 
                      onClick={() => handleAddClick(day)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/15 rounded text-text-muted hover:text-brand-primary transition-all duration-150"
                      title="Add task for this date"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-1.5 max-h-[85px] overflow-y-auto pr-0.5">
                    {dayTasks.map(t => {
                      const cfg = statusConfig[t.status];
                      return (
                        <div 
                          key={t.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(t);
                            setNewStatus(t.status);
                            setShowBlockerInput(false);
                            setShowReportInput(false);
                          }}
                          className={`text-[10px] px-2 py-1 rounded-lg truncate cursor-pointer border ${cfg.border} bg-white/[0.02] hover:bg-white/[0.06] transition flex items-center gap-1.5`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                          <span className="truncate text-text-primary flex-1">{t.title}</span>
                          <span className="text-[8px] text-text-muted opacity-65 shrink-0">
                            {t.user.name.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Empty Space Click to Add */}
                <div 
                  onClick={() => handleAddClick(day)}
                  className="flex-1 min-h-[20px] cursor-pointer"
                  title="Click to schedule task"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================= */}
      {/* 1. SCHEDULE / ADD TASK MODAL                 */}
      {/* ============================================= */}
      <AnimatePresence>
        {showAddModal && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-dark border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
              <h3 className="text-lg font-bold font-display text-text-primary mb-1">Schedule Task</h3>
              <p className="text-xs text-text-muted mb-5">
                Set a task for <strong className="text-brand-primary">{format(selectedDate, 'PP')}</strong>
              </p>
              
              <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Task Title <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    className="w-full bg-bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                    placeholder="Enter task name..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
                  <textarea
                    value={taskDesc}
                    onChange={e => setTaskDesc(e.target.value)}
                    className="w-full bg-bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors resize-none h-20"
                    placeholder="Provide details about the task..."
                  />
                </div>

                {/* Admin-only Assignee Selection */}
                {currentUser.role === 'ADMIN' ? (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Assign To</label>
                    <select
                      value={targetUserId}
                      onChange={e => setTargetUserId(e.target.value)}
                      className="w-full bg-bg-surface border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role}) {u.id === currentUser.id ? ' - (You)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-text-muted">
                    Assignee: <strong className="text-text-secondary">{currentUser.name}</strong> (Self Assigned)
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTask || !taskTitle.trim()}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
                  >
                    {creatingTask ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Schedule Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================= */}
      {/* 2. TASK DETAILS / UPDATE STATUS MODAL        */}
      {/* ============================================= */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-dark border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedTask(null)}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>

              {/* Task Info Header */}
              <div className="space-y-3 mb-5 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  {selectedTask.tags.includes('ADMIN') ? (
                    <span className="text-[9px] font-bold tracking-wide uppercase bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20">
                      Admin Assigned
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      Self Assigned
                    </span>
                  )}
                  <span className="text-[10px] text-text-muted">
                    Created {format(new Date(selectedTask.createdAt), 'PP')}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold font-display text-text-primary leading-tight">
                  {selectedTask.title}
                </h3>

                {selectedTask.description && (
                  <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              {/* Assignee & Dates Details */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-white/5 border border-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedTask.user.avatarUrl ? (
                      <img src={selectedTask.user.avatarUrl} alt={selectedTask.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-text-secondary">{(selectedTask.user.name[0] || '').toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">Assignee</p>
                    <p className="font-semibold text-text-primary truncate">{selectedTask.user.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-text-muted">
                    <CalendarIcon size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">Due Date</p>
                    <p className="font-semibold text-text-primary">
                      {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'PP') : 'No Due Date'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-text-secondary">Task Status</p>
                  <span 
                    className="text-xs px-2.5 py-1 rounded-lg font-semibold uppercase"
                    style={{ backgroundColor: statusConfig[selectedTask.status].bg, color: statusConfig[selectedTask.status].color }}
                  >
                    {statusConfig[selectedTask.status].label}
                  </span>
                </div>

                {/* Status Options Selector */}
                {(currentUser.role === 'ADMIN' || selectedTask.user.clerkId === currentUser.clerkId) ? (
                  <div className="grid grid-cols-4 gap-2">
                    {(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const).map((statusVal) => {
                      const cfg = statusConfig[statusVal];
                      const active = newStatus === statusVal;
                      return (
                        <button
                          key={statusVal}
                          type="button"
                          onClick={() => handleStatusSelect(statusVal)}
                          className={`py-2 rounded-xl text-center font-bold text-[10px] uppercase transition border ${active ? 'border-brand-primary' : 'border-white/5 bg-white/[0.02]'}`}
                          style={{ color: active ? '#fff' : cfg.color, backgroundColor: active ? 'hsl(234 89% 74% / 0.15)' : '' }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-text-muted italic">Only the assignee or an Admin can modify this task status.</p>
                )}
              </div>

              {/* 2A. SUB-FORM: Blocker Input */}
              {showBlockerInput && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3 mb-6">
                  <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <ShieldAlert size={14} /> State Blocker Reason
                  </h4>
                  <textarea
                    required
                    value={blockerReason}
                    onChange={e => setBlockerReason(e.target.value)}
                    className="w-full bg-bg-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-red-400 h-16 resize-none"
                    placeholder="Describe what is blocking this task..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBlockerInput(false)}
                      className="px-3 py-1 text-[10px] text-text-muted hover:text-text-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!blockerReason.trim()}
                      onClick={() => submitStatusChange('BLOCKED', blockerReason)}
                      className="px-3 py-1 rounded bg-red-500 text-white font-bold text-[10px] hover:bg-red-600 transition"
                    >
                      Block Task
                    </button>
                  </div>
                </div>
              )}

              {/* 2B. SUB-FORM: Work Report Input */}
              {showReportInput && (
                <form onSubmit={handleReportSubmit} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3 mb-6">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Complete & Submit Work Report
                  </h4>
                  
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1 font-semibold">Report of Work <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      value={reportText}
                      onChange={e => setReportText(e.target.value)}
                      className="w-full bg-bg-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-emerald-400 h-16 resize-none"
                      placeholder="Describe the work completed..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-text-muted mb-1 font-semibold">Proof Link / PR URL <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={proofUrl}
                      onChange={e => setProofUrl(e.target.value)}
                      className="w-full bg-bg-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-emerald-400"
                      placeholder="Proof link or description..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReportInput(false)}
                      className="px-3 py-1 text-[10px] text-text-muted hover:text-text-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReport || !reportText.trim() || !proofUrl.trim()}
                      className="px-3 py-1 rounded bg-emerald-500 text-white font-bold text-[10px] hover:bg-emerald-600 transition flex items-center gap-1"
                    >
                      {submittingReport && <Loader2 size={10} className="animate-spin" />}
                      Complete & Notify Discord
                    </button>
                  </div>
                </form>
              )}

              {/* Footer / Delete controls */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                {currentUser.role === 'ADMIN' ? (
                  <button
                    onClick={handleDeleteTask}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-xs font-semibold border border-red-500/25"
                  >
                    <Trash2 size={13} />
                    Delete Task
                  </button>
                ) : <div />}

                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text-secondary transition font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
