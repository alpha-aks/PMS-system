'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import {
  GitBranch, FileText, TrendingUp, AlertCircle,
  CheckCircle2, Clock, Sparkles, ArrowUpRight,
  Code2, Receipt, PlusCircle, Activity
} from 'lucide-react';
import DailyPercentageMeter from '@/components/DailyPercentageMeter';
import GSTAlertWidget from '@/components/GSTAlertWidget';
import StandupModal from '@/components/StandupModal';
import { formatINR, timeAgo } from '@/lib/utils';

// Mock data – replace with real API calls once DB is connected
const MOCK_TASKS = [
  { id: '1', title: 'Fix authentication bug on client portal', status: 'IN_PROGRESS', estimatedHours: 3, complexityWeight: 0.75, category: 'development' },
  { id: '2', title: 'GST return filing for May 2025', status: 'TODO', estimatedHours: 1.5, complexityWeight: 0.5, category: 'accounts' },
  { id: '3', title: 'Update homepage hero section for TechCorp', status: 'DONE', estimatedHours: 2, complexityWeight: 0.6, category: 'development' },
  { id: '4', title: 'Review and merge 3 pull requests', status: 'TODO', estimatedHours: 1, complexityWeight: 0.45, category: 'development' },
];

const MOCK_COMMITS = [
  { repo: 'client-portal', message: 'fix: resolve OAuth callback loop', time: new Date(Date.now() - 2 * 3600000), sha: 'a3f2b1c' },
  { repo: 'agency-website', message: 'feat: add GST calculator widget', time: new Date(Date.now() - 6 * 3600000), sha: 'e9d8f3a' },
  { repo: 'client-portal', message: 'refactor: split auth middleware', time: new Date(Date.now() - 26 * 3600000), sha: 'b7c4d2e' },
];

 // ₹1500/day example

const statusConfig = {
  TODO: { color: 'hsl(220 15% 45%)', bg: 'hsl(220 20% 14%)', label: 'To Do' },
  IN_PROGRESS: { color: 'hsl(234 89% 74%)', bg: 'hsl(234 89% 74% / 0.1)', label: 'In Progress' },
  DONE: { color: 'hsl(142 71% 45%)', bg: 'hsl(142 71% 45% / 0.1)', label: 'Done' },
  BLOCKED: { color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.1)', label: 'Blocked' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function DevDashboard() {
  const { user } = useUser();
  const [showStandup, setShowStandup] = useState(false);
  const [todayPct, setTodayPct] = useState(0);
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserDashboardStats().then(stats => {
      if (stats) {
        setMonthlySalary(stats.monthlySalary);
        setTodayPct(stats.todayPct);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <div className="p-8 text-center text-text-muted animate-pulse">Loading dashboard...</div>; // 35% complete
  const [projectedPayout, setProjectedPayout] = useState(DAILY_RATE * 0.35);
  const [standupDone, setStandupDone] = useState(false);
  const [tasks, setTasks] = useState(MOCK_TASKS);

  // Auto-show standup modal if not done today
  useEffect(() => {
    const lastStandup = localStorage.getItem('lastStandupDate');
    const today = new Date().toDateString();
    if (lastStandup !== today) {
      setTimeout(() => setShowStandup(true), 800);
    } else {
      setStandupDone(true);
    }
  }, []);

  const handleStandupComplete = (result: { analysis: { targetPercentage: number; projectedPayout: number } }) => {
    const pct = result.analysis.targetPercentage / 100;
    setTodayPct(pct);
    setProjectedPayout(result.analysis.projectedPayout);
    setStandupDone(true);
    localStorage.setItem('lastStandupDate', new Date().toDateString());
  };

  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const totalTasks = tasks.length;

  return (
    <>
      <StandupModal
        isOpen={showStandup}
        onClose={() => setShowStandup(false)}
        onComplete={handleStandupComplete}
        userRole="DEV"
        monthlySalary={monthlySalary}
        userName={user?.firstName || 'there'}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6 max-w-[1400px]"
      >
        {/* Page header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-text-primary">
              Web Dev & Accounts
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!standupDone && (
              <motion.button
                animate={{ boxShadow: ['0 0 20px hsl(234 89% 74% / 0.3)', '0 0 40px hsl(234 89% 74% / 0.6)', '0 0 20px hsl(234 89% 74% / 0.3)'] }}
                transition={{ duration: 2, repeat: Infinity }}
                onClick={() => setShowStandup(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Sparkles size={15} />
                Start AI Stand-up
              </motion.button>
            )}
            {standupDone && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'hsl(142 71% 45% / 0.1)', border: '1px solid hsl(142 71% 45% / 0.25)' }}>
                <CheckCircle2 size={14} style={{ color: 'hsl(142 71% 45%)' }} />
                <span className="text-sm font-medium" style={{ color: 'hsl(142 71% 45%)' }}>Stand-up logged</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top row: Meter + Stats + GST */}
        <div className="grid grid-cols-12 gap-4">
          {/* Daily performance meter */}
          <motion.div variants={item} className="col-span-3">
            <div className="glass-card p-5 flex flex-col items-center">
              <p className="section-header mb-4 self-start">Today's Performance</p>
              <DailyPercentageMeter
                percentage={todayPct}
                projectedPayout={projectedPayout}
                monthlySalary={monthlySalary}
                size="lg"
              />
              <div className="grid grid-cols-2 gap-2 w-full mt-4">
                <div className="text-center p-2 rounded-lg" style={{ background: 'hsl(220 20% 10%)' }}>
                  <p className="text-lg font-bold font-display text-text-primary">{completedTasks}</p>
                  <p className="text-[10px] text-text-muted">Done</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'hsl(220 20% 10%)' }}>
                  <p className="text-lg font-bold font-display text-text-primary">{totalTasks - completedTasks}</p>
                  <p className="text-[10px] text-text-muted">Remaining</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick stats */}
          <motion.div variants={item} className="col-span-5 space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Week Earnings', value: formatINR(6200), icon: <TrendingUp size={16} />, color: 'hsl(43 96% 56%)', sub: '+₹800 from last week' },
                { label: 'Commits Today', value: '3', icon: <GitBranch size={16} />, color: 'hsl(234 89% 74%)', sub: '2 repos touched' },
                { label: 'Tasks Complete', value: `${completedTasks}/${totalTasks}`, icon: <CheckCircle2 size={16} />, color: 'hsl(142 71% 45%)', sub: `${Math.round((completedTasks / totalTasks) * 100)}% done` },
                { label: 'Hours Logged', value: '4.5h', icon: <Clock size={16} />, color: 'hsl(271 91% 65%)', sub: 'via Discord VC' },
              ].map((stat) => (
                <div key={stat.label} className="premium-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}20`, color: stat.color }}>
                      {stat.icon}
                    </div>
                    <ArrowUpRight size={14} className="text-text-muted" />
                  </div>
                  <p className="stat-value text-2xl font-display font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
                  <p className="text-[10px] mt-1" style={{ color: stat.color }}>{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* GitHub recent commits */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="section-header">Recent Commits</p>
                <GitBranch size={14} className="text-text-muted" />
              </div>
              <div className="space-y-2">
                {MOCK_COMMITS.map((commit) => (
                  <div key={commit.sha} className="flex items-start gap-3 py-2 border-b" style={{ borderColor: 'hsl(220 20% 14%)' }}>
                    <Code2 size={12} className="mt-1 shrink-0" style={{ color: 'hsl(234 89% 74%)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{commit.message}</p>
                      <p className="text-[10px] text-text-muted">{commit.repo} · {timeAgo(commit.time)}</p>
                    </div>
                    <span className="mono text-[10px] text-text-muted shrink-0">{commit.sha}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* GST Widget + activity */}
          <motion.div variants={item} className="col-span-4 space-y-4">
            <GSTAlertWidget />

            {/* Activity feed */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="section-header">Activity</p>
                <Activity size={14} className="text-text-muted" />
              </div>
              <div className="space-y-3">
                {[
                  { icon: <CheckCircle2 size={12} />, text: 'Task completed: Homepage hero', time: '2h ago', color: 'hsl(142 71% 45%)' },
                  { icon: <GitBranch size={12} />, text: 'Pushed to client-portal main', time: '2h ago', color: 'hsl(234 89% 74%)' },
                  { icon: <Receipt size={12} />, text: 'GST return status: Pending', time: '1d ago', color: 'hsl(38 100% 56%)' },
                  { icon: <AlertCircle size={12} />, text: 'Stand-up logged via AI CEO', time: '9h ago', color: 'hsl(271 91% 65%)' },
                ].map((event, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${event.color}15`, color: event.color }}>
                      {event.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary">{event.text}</p>
                      <p className="text-[10px] text-text-muted">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Task board */}
        <motion.div variants={item} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-primary font-display">Today's Tasks</h2>
            <button className="btn-ghost flex items-center gap-2 text-sm py-1.5">
              <PlusCircle size={14} />
              Add Task
            </button>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => {
              const status = statusConfig[task.status as keyof typeof statusConfig];
              return (
                <motion.div
                  key={task.id}
                  layout
                  className="flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer hover:bg-surface-elevated"
                  style={{ background: 'hsl(220 20% 10%)', border: '1px solid hsl(220 20% 16%)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: status.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-text-muted capitalize">{task.category}</span>
                      <span className="text-[10px] text-text-muted">{task.estimatedHours}h</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </div>
                    <span
                      className="text-xs font-bold font-display"
                      style={{ color: 'hsl(234 89% 74%)' }}
                    >
                      {Math.round(task.complexityWeight * 100)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
