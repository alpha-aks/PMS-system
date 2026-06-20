'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import {
  Users, TrendingUp, CheckCircle2, Clock,
  AlertTriangle, DollarSign, BarChart2,
  ShieldCheck, Zap, ChevronRight, ArrowUpRight,
  UserSearch, Phone, Star, PlusCircle, Flame,
  GitBranch, Clapperboard, Wand2, Music, Film,
  Lightbulb, Loader2, Palette, Upload, Eye,
  Layers, AlertCircle, Plus, MoveRight, Flag,
  Calendar, Target, Sparkles, Video
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import DailyPercentageMeter from '@/components/DailyPercentageMeter';
import GSTAlertWidget from '@/components/GSTAlertWidget';
import StandupModal from '@/components/StandupModal';
import UserTasksWidget from '@/components/UserTasksWidget';
import { formatINR, ROLE_COLORS } from '@/lib/utils';
import { getUserDashboardStats, overrideTodayPercentage } from '@/app/actions/user';
import { getUserTasks } from '@/app/actions/task';
import type { VideoCreativePackage } from '@/lib/ai/gemini';

// ─── Data Definitions ────────────────────────────────────────────────────────

const MOCK_COMMITS = [
  { repo: 'pms-dashboard', message: 'feat: add interactive payout analytics', time: new Date(Date.now() - 2 * 3600000), sha: 'a1b2c3d' },
  { repo: 'agency-website', message: 'feat: add GST calculator widget', time: new Date(Date.now() - 6 * 3600000), sha: 'e9d8f3a' },
  { repo: 'client-portal', message: 'refactor: split auth middleware', time: new Date(Date.now() - 26 * 3600000), sha: 'b7c4d2e' },
];

const PIPELINE = [
  { stage: 'Prospect', count: 24, value: 180000, color: 'hsl(220 15% 55%)' },
  { stage: 'Contacted', count: 12, value: 90000, color: 'hsl(234 89% 74%)' },
  { stage: 'Qualified', count: 6, value: 54000, color: 'hsl(43 96% 56%)' },
  { stage: 'Proposal', count: 3, value: 27000, color: 'hsl(271 91% 65%)' },
  { stage: 'Closed Won', count: 1, value: 15000, color: 'hsl(142 71% 45%)' },
];

const SPRINT_TASKS = [
  { id: '1', col: 'Backlog', title: 'Set up lead scraper for e-commerce niche', points: 5 },
  { id: '2', col: 'Backlog', title: 'Integrate Apollo.io API for contact enrichment', points: 8 },
  { id: '3', col: 'In Progress', title: 'Build Instagram outreach automation script', points: 13 },
  { id: '4', col: 'In Progress', title: 'CRM pipeline dashboard integration', points: 8 },
  { id: '5', col: 'Review', title: 'Weekly lead quality audit (150 contacts)', points: 3 },
  { id: '6', col: 'Done', title: 'LinkedIn connection campaign — 200 invites', points: 5 },
  { id: '7', col: 'Done', title: 'Set up email warmup sequence (Day 1–7)', points: 3 },
];

const SPRINT_COLS = ['Backlog', 'In Progress', 'Review', 'Done'];

const colColors = {
  Backlog: 'hsl(220 15% 45%)',
  'In Progress': 'hsl(234 89% 74%)',
  Review: 'hsl(43 96% 56%)',
  Done: 'hsl(142 71% 45%)',
};

const ASSET_REQUESTS = [
  { id: '1', client: 'TechVision Ltd', type: 'Social Media Carousel', stage: 'WIP', daysLeft: 2, priority: 'HIGH' },
  { id: '2', client: 'GreenEarth NGO', type: 'Logo Redesign', stage: 'Review', daysLeft: 1, priority: 'URGENT' },
  { id: '3', client: 'BrandBoosters Agency', type: 'Instagram Template Pack (10)', stage: 'Request', daysLeft: 5, priority: 'MEDIUM' },
  { id: '4', client: 'CafeRoast', type: 'Menu Board Design', stage: 'Delivered', daysLeft: 0, priority: 'LOW' },
  { id: '5', client: 'UrbanFit Gym', type: 'Brand Identity Presentation', stage: 'WIP', daysLeft: 3, priority: 'HIGH' },
];

const stageConfig = {
  Request: { color: 'hsl(220 15% 55%)', label: 'Requested' },
  WIP: { color: 'hsl(234 89% 74%)', label: 'In Progress' },
  Review: { color: 'hsl(43 96% 56%)', label: 'In Review' },
  Delivered: { color: 'hsl(142 71% 45%)', label: 'Delivered' },
};

const priorityColors = {
  URGENT: 'hsl(0 84% 60%)',
  HIGH: 'hsl(38 100% 56%)',
  MEDIUM: 'hsl(234 89% 74%)',
  LOW: 'hsl(220 15% 55%)',
};

const VIDEO_TASKS = [
  { id: '1', title: 'BrandBoosters "Agency Life" Reel (60s)', client: 'Internal', status: 'IN_PROGRESS', due: '2 days', complexity: 0.8 },
  { id: '2', title: 'TechVision Product Demo (2min)', client: 'TechVision Ltd', status: 'TODO', due: '5 days', complexity: 0.75 },
  { id: '3', title: 'GreenEarth Impact Testimonial (30s)', client: 'GreenEarth NGO', status: 'DONE', due: 'Delivered', complexity: 0.5 },
];

const statusColors = {
  TODO: 'hsl(220 15% 45%)',
  IN_PROGRESS: 'hsl(234 89% 74%)',
  DONE: 'hsl(142 71% 45%)',
};

const INITIAL_OPS_TASKS = {
  'To Do': [
    { id: '1', title: 'Follow up with 3 cold email replies', priority: 'HIGH', time: '30m' },
    { id: '2', title: 'Update agency Google My Business profile', priority: 'MEDIUM', time: '20m' },
    { id: '3', title: 'Compile weekly team hours report', priority: 'HIGH', time: '45m' },
  ],
  'In Progress': [
    { id: '4', title: 'Coordinate TechVision onboarding call', priority: 'URGENT', time: '1h' },
    { id: '5', title: 'Prepare project status deck for internal review', priority: 'MEDIUM', time: '2h' },
  ],
  'Done': [
    { id: '6', title: 'Send invoice reminders to 2 clients', priority: 'HIGH', time: '15m' },
    { id: '7', title: 'Book meeting room for Friday scrums', priority: 'LOW', time: '10m' },
  ],
};

const opsPriorityConfig = {
  URGENT: { color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.1)', label: 'Urgent' },
  HIGH: { color: 'hsl(38 100% 56%)', bg: 'hsl(38 100% 56% / 0.1)', label: 'High' },
  MEDIUM: { color: 'hsl(234 89% 74%)', bg: 'hsl(234 89% 74% / 0.1)', label: 'Medium' },
  LOW: { color: 'hsl(220 15% 45%)', bg: 'hsl(220 15% 45% / 0.1)', label: 'Low' },
};

const opsColConfig = {
  'To Do': { color: 'hsl(220 15% 45%)', icon: <Clock size={13} /> },
  'In Progress': { color: 'hsl(234 89% 74%)', icon: <Zap size={13} /> },
  'Done': { color: 'hsl(142 71% 45%)', icon: <CheckCircle2 size={13} /> },
};

const container: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

// ─── Component Prop Interface ──────────────────────────────────────────────────

interface Props {
  role: 'ADMIN' | 'DEV' | 'TECH' | 'DESIGN' | 'VIDEO' | 'OPS';
  initialTeam?: any[]; // Only passed for ADMIN
}

export default function UniversalDashboard({ role, initialTeam }: Props) {
  const { user } = useUser();

  // General user stats state
  const [showStandup, setShowStandup] = useState(false);
  const [todayPct, setTodayPct] = useState(0);
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);

  // ADMIN specific states
  const [team, setTeam] = useState<any[]>(initialTeam || []);
  const [allApproved, setAllApproved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // DEV specific states
  const [projectedPayout, setProjectedPayout] = useState(0);
  const [standupDone, setStandupDone] = useState(false);

  // VIDEO specific states
  const [showCreativeGen, setShowCreativeGen] = useState(false);
  const [brief, setBrief] = useState('');
  const [audience, setAudience] = useState('');
  const [loadingVideoAI, setLoadingVideoAI] = useState(false);
  const [creativePackage, setCreativePackage] = useState<VideoCreativePackage | null>(null);

  // OPS specific states
  const [opsTasks, setOpsTasks] = useState(INITIAL_OPS_TASKS);
  const [newTaskText, setNewTaskText] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [showAddForm, setShowAddForm] = useState(false);

  // Load user data & tasks
  useEffect(() => {
    if (role === 'ADMIN') {
      setIsLoading(false);
      return;
    }

    getUserDashboardStats().then((stats: any) => {
      if (stats) {
        setMonthlySalary(stats.monthlySalary);
        setTodayPct(stats.todayPct);
        setProjectedPayout(stats.monthlySalary * 0.35);
      }
      setIsLoading(false);
    });
  }, [role]);

  useEffect(() => {
    if (user?.id && role !== 'ADMIN') {
      getUserTasks(user.id).then(setTasks);
    }
  }, [user?.id, role]);

  // DEV standup check
  useEffect(() => {
    if (role === 'DEV') {
      const lastStandup = localStorage.getItem('lastStandupDate');
      const today = new Date().toDateString();
      if (lastStandup !== today) {
        setTimeout(() => setShowStandup(true), 800);
      } else {
        setStandupDone(true);
      }
    }
  }, [role]);

  // ─── ADMIN actions ─────────────────────────────────────────────────────────

  const totalEstMonthPay = team.reduce((sum, m) => sum + (m.estMonthPay || 0), 0);
  const avgAgencyEffort = team.length > 0 ? team.reduce((sum, m) => sum + (m.avgMonthEffort || 0), 0) / team.length : 0;
  const pendingApprovals = team.filter(m => m.standupId && !m.approved).length;

  const approveAll = () => {
    setTeam(prev => prev.map(m => ({ ...m, approved: true })));
    setAllApproved(true);
  };

  const approveMember = (id: string) => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, approved: true } : m));
  };

  const savePercentage = async (id: string) => {
    const val = parseInt(editValue);
    if (isNaN(val) || val < 0 || val > 100) {
      alert("Percentage must be between 0 and 100");
      return;
    }
    setEditingId(null);
    try {
      await overrideTodayPercentage(id, val / 100);
      setTeam(prev => prev.map(m => m.id === id ? { ...m, todayEffort: val / 100, approved: true } : m));
    } catch (e) {
      alert('Failed to override percentage');
    }
  };

  // ─── VIDEO actions ─────────────────────────────────────────────────────────

  const generateCreativePackage = async () => {
    if (!brief.trim()) return;
    setLoadingVideoAI(true);
    try {
      const res = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, targetAudience: audience || 'general social media audience' }),
      });
      const data = await res.json();
      setCreativePackage(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVideoAI(false);
    }
  };

  // ─── OPS actions ───────────────────────────────────────────────────────────

  const addOpsTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskText,
      priority: newPriority,
      time: '30m',
    };
    setOpsTasks(prev => ({ ...prev, 'To Do': [newTask, ...prev['To Do']] }));
    setNewTaskText('');
    setShowAddForm(false);
  };

  const moveOpsTask = (taskId: string, fromCol: string, toCol: string) => {
    const task = opsTasks[fromCol as keyof typeof opsTasks].find(t => t.id === taskId);
    if (!task) return;
    setOpsTasks(prev => ({
      ...prev,
      [fromCol]: prev[fromCol as keyof typeof opsTasks].filter(t => t.id !== taskId),
      [toCol]: [task, ...prev[toCol as keyof typeof opsTasks]],
    }));
  };

  if (isLoading) return <div className="p-8 text-center text-text-muted animate-pulse">Loading dashboard...</div>;

  // ─── Header Configuration ──────────────────────────────────────────────────

  const headers = {
    DEV: { title: 'Web Dev & Accounts', sub: 'Sprint + Github commit tracking' },
    TECH: { title: 'Tech & Lead Gen', sub: 'Sprint + CRM pipeline' },
    DESIGN: { title: 'Creative Graphic Design', sub: 'Asset delivery pipeline' },
    VIDEO: { title: 'Video Editing & Production', sub: 'AI creative brief toolkit' },
    OPS: { title: 'General Operations Hub', sub: 'Ad-hoc task execution & Kanban' },
    ADMIN: { title: 'Command Center', sub: 'Master Admin & Team Overview' },
  };

  const currentHeader = headers[role];

  // ─── Stats Row Configuration ────────────────────────────────────────────────

  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const totalTasks = tasks.length;

  const renderStats = () => {
    let stats: { label: string; value: string; icon: any; color: string; sub: string }[] = [];

    switch (role) {
      case 'DEV':
        stats = [
          { label: 'Week Earnings', value: formatINR(6200), icon: <TrendingUp size={16} />, color: 'hsl(43 96% 56%)', sub: '+₹800 from last week' },
          { label: 'Commits Today', value: '3', icon: <GitBranch size={16} />, color: 'hsl(234 89% 74%)', sub: '2 repos touched' },
          { label: 'Tasks Complete', value: `${completedTasks}/${totalTasks}`, icon: <CheckCircle2 size={16} />, color: 'hsl(142 71% 45%)', sub: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% done` },
          { label: 'Hours Logged', value: '4.5h', icon: <Clock size={16} />, color: 'hsl(271 91% 65%)', sub: 'via Discord VC' },
        ];
        break;
      case 'TECH':
        stats = [
          { label: 'Leads Sourced', value: '147', icon: <UserSearch size={16} />, color: 'hsl(234 89% 74%)', sub: 'This week' },
          { label: 'Calls Made', value: '38', icon: <Phone size={16} />, color: 'hsl(271 91% 65%)', sub: 'Today' },
          { label: 'Pipeline Value', value: '₹3.66L', icon: <TrendingUp size={16} />, color: 'hsl(43 96% 56%)', sub: '6 active deals' },
          { label: 'Conversion Rate', value: '8.2%', icon: <Flame size={16} />, color: 'hsl(14 90% 60%)', sub: '+1.4% vs last wk' },
        ];
        break;
      case 'DESIGN':
        stats = [
          { label: 'Assets Delivered', value: '12', icon: <CheckCircle2 size={16} />, color: 'hsl(142 71% 45%)', sub: 'This week' },
          { label: 'In Progress', value: '3', icon: <Layers size={16} />, color: 'hsl(234 89% 74%)', sub: 'Active requests' },
          { label: 'Avg Turnaround', value: '2.1d', icon: <Clock size={16} />, color: 'hsl(43 96% 56%)', sub: 'vs 3d target' },
          { label: 'Client Satisfaction', value: '4.8★', icon: <Eye size={16} />, color: 'hsl(320 80% 65%)', sub: 'Last 10 reviews' },
        ];
        break;
      case 'VIDEO':
        stats = [
          { label: 'Videos This Month', value: '8', icon: <Film size={16} />, color: 'hsl(234 89% 74%)', sub: 'Output stats' },
          { label: 'Avg Edit Time', value: '3.2h', icon: <Clock size={16} />, color: 'hsl(43 96% 56%)', sub: 'vs 4h target' },
          { label: 'Client Revisions', value: '1.4x', icon: <CheckCircle2 size={16} />, color: 'hsl(142 71% 45%)', sub: 'Low rate' },
          { label: 'Active Briefs', value: '2', icon: <Video size={16} />, color: 'hsl(271 91% 65%)', sub: 'AI Suggestions' },
        ];
        break;
      case 'OPS':
        const doneOpsCount = opsTasks['Done'].length;
        const totalOpsCount = Object.values(opsTasks).flat().length;
        const urgentCount = Object.values(opsTasks).flat().filter(t => t.priority === 'URGENT').length;
        stats = [
          { label: 'Tasks Completed', value: `${doneOpsCount}/${totalOpsCount}`, icon: <CheckCircle2 size={16} />, color: 'hsl(142 71% 45%)', sub: 'Ops execution' },
          { label: 'Urgent Items', value: urgentCount.toString(), icon: <AlertCircle size={16} />, color: 'hsl(0 84% 60%)', sub: 'Require attention' },
          { label: 'High Priority', value: Object.values(opsTasks).flat().filter(t => t.priority === 'HIGH').length.toString(), icon: <Flame size={16} />, color: 'hsl(38 100% 56%)', sub: 'Active queue' },
          { label: 'Active Blockers', value: '0', icon: <Zap size={16} />, color: 'hsl(234 89% 74%)', sub: 'Clear flow' },
        ];
        break;
      case 'ADMIN':
        stats = [
          { label: 'Est. Total Month Payroll', value: formatINR(totalEstMonthPay), icon: <DollarSign size={16} />, color: 'hsl(43 96% 56%)', sub: 'Based on current avg effort' },
          { label: 'Agency Month Effort', value: `${Math.round(avgAgencyEffort * 100)}%`, icon: <BarChart2 size={16} />, color: 'hsl(234 89% 74%)', sub: 'Team average this month' },
          { label: 'Active Team Members', value: `${team.length}/${team.length}`, icon: <Users size={16} />, color: 'hsl(142 71% 45%)', sub: 'All online' },
          { label: 'Revenue Pipeline', value: '₹3.66L', icon: <TrendingUp size={16} />, color: 'hsl(271 91% 65%)', sub: 'Active opportunities' },
        ];
        break;
    }

    return (
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="premium-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </div>
              <ArrowUpRight size={14} className="text-text-muted" />
            </div>
            <p className="text-2xl font-bold font-display text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className="text-[10px] mt-1" style={{ color: stat.color }}>{stat.sub}</p>
          </div>
        ))}
      </motion.div>
    );
  };

  return (
    <>
      <StandupModal
        isOpen={showStandup}
        onClose={() => setShowStandup(false)}
        onComplete={(r) => {
          if (role === 'DEV') {
            const pct = r.analysis.targetPercentage / 100;
            setTodayPct(pct);
            setProjectedPayout(r.analysis.projectedPayout);
            setStandupDone(true);
            localStorage.setItem('lastStandupDate', new Date().toDateString());
          } else {
            setTodayPct(r.analysis.targetPercentage / 100);
          }
        }}
        userRole={role}
        monthlySalary={monthlySalary}
        userName={user?.firstName || 'there'}
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1400px]">
        
        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-text-primary">
              {role === 'ADMIN' && <span className="gradient-text">Command Center</span>}
              {role !== 'ADMIN' && currentHeader.title}
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              {currentHeader.sub} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {role === 'ADMIN' && pendingApprovals > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl animate-pulse-danger"
                style={{ background: 'hsl(43 96% 56% / 0.1)', border: '1px solid hsl(43 96% 56% / 0.3)' }}
              >
                <AlertTriangle size={14} style={{ color: 'hsl(43 96% 56%)' }} />
                <span className="text-sm font-semibold" style={{ color: 'hsl(43 96% 56%)' }}>
                  {pendingApprovals} Payout{pendingApprovals > 1 ? 's' : ''} Pending
                </span>
              </div>
            )}
            {role === 'ADMIN' && !allApproved && pendingApprovals > 0 && (
              <button onClick={approveAll} className="btn-primary flex items-center gap-2">
                <ShieldCheck size={15} />
                Approve All Payouts
              </button>
            )}

            {role === 'DEV' && (
              <>
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
              </>
            )}

            {role !== 'ADMIN' && role !== 'DEV' && (
              <button onClick={() => setShowStandup(true)} className="btn-primary flex items-center gap-2">
                <Target size={15} />
                Daily Stand-up
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats Row */}
        {renderStats()}

        {/* Task Board */}
        <motion.div variants={item}>
          <UserTasksWidget clerkId={user?.id || ''} />
        </motion.div>

        {/* Split View: Left (7 cols) + Right (5 cols) */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* Left Side (7 columns) */}
          <motion.div variants={item} className="col-span-7 space-y-4">
            
            {role === 'ADMIN' && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold font-display text-text-primary">Team Payout Approvals</h2>
                  <span className="text-xs text-text-muted">AI Proposed · Admin Approved Paradigm</span>
                </div>

                <div className="grid grid-cols-12 gap-3 px-3 py-2 mb-1">
                  {['Member', 'Today %', 'Avg Month %', 'Monthly Sal.', 'Est. Month Pay', 'Action'].map((h, i) => (
                    <div
                      key={h}
                      className="text-[10px] font-bold uppercase text-text-muted tracking-wider"
                      style={{ gridColumn: i === 0 ? 'span 3' : i === 4 ? 'span 2' : 'span 1' }}
                    >
                      {h}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {team.map((member) => {
                    const roleColor = ROLE_COLORS[member.role] || '#fff';
                    const compPct = Math.round(member.avgMonthEffort * 100);

                    return (
                      <motion.div
                        key={member.id}
                        layout
                        className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl"
                        style={{
                          background: member.approved ? 'hsl(142 71% 45% / 0.05)' : 'hsl(220 20% 10%)',
                          border: `1px solid ${member.approved ? 'hsl(142 71% 45% / 0.2)' : 'hsl(220 20% 16%)'}`,
                        }}
                      >
                        <div className="col-span-3 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: roleColor }}>
                            {member.name[0]}
                          </div>
                          <span className="text-sm font-medium text-text-primary truncate">{member.name}</span>
                        </div>

                        <div className="col-span-1">
                          {editingId === member.id ? (
                            <input
                              type="number"
                              autoFocus
                              className="w-16 bg-bg-dark border border-white/20 rounded px-1.5 py-0.5 text-xs text-white"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => savePercentage(member.id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') savePercentage(member.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(member.id);
                                setEditValue(Math.round(member.todayEffort * 100).toString());
                              }}
                              className="text-xs font-bold text-text-primary hover:text-accent-primary transition-colors px-1 py-0.5 rounded hover:bg-white/5 border border-transparent hover:border-white/10"
                            >
                              {Math.round(member.todayEffort * 100)}%
                            </button>
                          )}
                        </div>

                        <div className="col-span-1">
                          <span className="text-xs font-bold" style={{ color: compPct >= 80 ? 'hsl(142 71% 45%)' : compPct >= 50 ? 'hsl(234 89% 74%)' : 'hsl(38 100% 56%)' }}>
                            {compPct}%
                          </span>
                        </div>

                        <div className="col-span-1">
                          <span className="text-xs text-text-muted">{formatINR(member.monthlySalary)}</span>
                        </div>

                        <div className="col-span-2">
                          <span className="text-sm font-bold font-display" style={{ color: 'hsl(43 96% 56%)' }}>
                            {formatINR(member.estMonthPay)}
                          </span>
                        </div>

                        <div className="col-span-3 flex justify-end">
                          {member.approved ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'hsl(142 71% 45%)' }}>
                              <CheckCircle2 size={13} />
                              Approved
                            </div>
                          ) : member.standupId ? (
                            <button
                              onClick={() => approveMember(member.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                              style={{ background: 'hsl(43 96% 56% / 0.1)', color: 'hsl(43 96% 56%)', border: '1px solid hsl(43 96% 56% / 0.25)' }}
                            >
                              <ShieldCheck size={12} />
                              Approve
                            </button>
                          ) : (
                            <span className="text-xs text-text-muted">Waiting...</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {role === 'DEV' && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="section-header">Recent Commits</p>
                  <GitBranch size={14} className="text-text-muted" />
                </div>
                <div className="space-y-2">
                  {MOCK_COMMITS.map((commit) => (
                    <div key={commit.sha} className="flex items-center justify-between p-3 rounded-lg border border-white/5" style={{ background: 'hsl(220 20% 8%)' }}>
                      <div>
                        <p className="text-xs font-bold text-text-primary">{commit.repo}</p>
                        <p className="text-xs text-text-muted mt-0.5">{commit.message}</p>
                      </div>
                      <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 text-text-secondary">{commit.sha}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {role === 'TECH' && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold font-display text-text-primary">Sprint Board — Week 24</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'hsl(234 89% 74% / 0.1)', color: 'hsl(234 89% 74%)', border: '1px solid hsl(234 89% 74% / 0.25)' }}>
                      Day 4/7
                    </span>
                    <button className="btn-ghost py-1 px-2 text-xs flex items-center gap-1">
                      <PlusCircle size={12} />
                      Add
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {SPRINT_COLS.map((col) => {
                    const colTasks = SPRINT_TASKS.filter(t => t.col === col);
                    const color = colColors[col as keyof typeof colColors];
                    return (
                      <div key={col}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-xs font-semibold text-text-secondary truncate">{col}</span>
                          <span className="text-[10px] text-text-muted">({colTasks.length})</span>
                        </div>
                        <div className="space-y-2">
                          {colTasks.map(task => (
                            <div
                              key={task.id}
                              className="p-2.5 rounded-lg cursor-pointer hover:border-opacity-50 transition-all"
                              style={{
                                background: 'hsl(220 20% 10%)',
                                border: `1px solid ${color}25`,
                              }}
                            >
                              <p className="text-xs text-text-primary leading-snug">{task.title}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${color}15`, color }}>
                                  {task.points}pts
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {role === 'DESIGN' && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold font-display text-text-primary">Asset Delivery Pipeline</h2>
                  <button className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5">
                    <PlusCircle size={12} />
                    New Request
                  </button>
                </div>

                <div className="space-y-2">
                  {ASSET_REQUESTS.map((req) => {
                    const stage = stageConfig[req.stage as keyof typeof stageConfig];
                    const priorityColor = priorityColors[req.priority as keyof typeof priorityColors];
                    return (
                      <div
                        key={req.id}
                        className="flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer"
                        style={{ background: 'hsl(220 20% 10%)', border: '1px solid hsl(220 20% 16%)' }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stage.color}15`, color: stage.color }}>
                          <Palette size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-text-primary truncate">{req.type}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0" style={{ background: `${priorityColor}15`, color: priorityColor, border: `1px solid ${priorityColor}30` }}>
                              {req.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted">{req.client}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-xs font-semibold" style={{ color: stage.color }}>{stage.label}</p>
                            {req.daysLeft > 0 && (
                              <p className="text-[10px] text-text-muted">{req.daysLeft}d left</p>
                            )}
                          </div>
                          {req.stage === 'Review' && (
                            <button className="btn-ghost py-1 px-2 text-xs flex items-center gap-1">
                              <Upload size={11} />
                              Submit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {role === 'VIDEO' && (
              <div className="space-y-4">
                <div className="glass-card p-4">
                  <h2 className="font-bold font-display text-text-primary mb-4">Assigned Videos</h2>
                  <div className="space-y-3">
                    {VIDEO_TASKS.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl"
                        style={{ background: 'hsl(220 20% 10%)', border: `1px solid ${statusColors[task.status as keyof typeof statusColors]}25` }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${statusColors[task.status as keyof typeof statusColors]}15`, color: statusColors[task.status as keyof typeof statusColors] }}
                          >
                            <Video size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-text-primary">{task.title}</p>
                            </div>
                            <p className="text-xs text-text-muted">{task.client} · Due: {task.due}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(220 20% 16%)' }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: task.status === 'DONE' ? '100%' : task.status === 'IN_PROGRESS' ? '55%' : '0%',
                                    background: statusColors[task.status as keyof typeof statusColors],
                                    boxShadow: `0 0 6px ${statusColors[task.status as keyof typeof statusColors]}50`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-bold" style={{ color: statusColors[task.status as keyof typeof statusColors] }}>
                                {task.status === 'DONE' ? 'Delivered' : task.status === 'IN_PROGRESS' ? '55%' : 'Not started'}
                              </span>
                            </div>
                          </div>
                          {task.status !== 'DONE' && (
                            <button
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
                              style={{ background: 'hsl(234 89% 74% / 0.1)', color: 'hsl(234 89% 74%)', border: '1px solid hsl(234 89% 74% / 0.25)' }}
                              onClick={() => { setBrief(task.title); setShowCreativeGen(true); }}
                            >
                              <Wand2 size={12} />
                              AI Brief
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {creativePackage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="glass-card p-4 overflow-hidden"
                      style={{ borderColor: 'hsl(271 91% 65% / 0.3)', boxShadow: '0 0 30px hsl(271 91% 65% / 0.1)' }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={16} style={{ color: 'hsl(271 91% 65%)' }} />
                        <h3 className="font-bold font-display text-text-primary">AI Creative Package</h3>
                      </div>

                      <div className="mb-4">
                        <p className="section-header mb-2">Mood Board</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex gap-2">
                            {creativePackage.moodBoard.palette.map((color, i) => (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-lg border border-white/10"
                                style={{ background: color }}
                                title={color}
                              />
                            ))}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-text-primary font-medium">{creativePackage.moodBoard.aesthetic}</p>
                            <p className="text-xs text-text-muted">{creativePackage.moodBoard.lightingStyle}</p>
                          </div>
                        </div>
                        <p className="text-xs mt-2 text-text-secondary italic">"{creativePackage.moodBoard.editingStyle}"</p>
                      </div>

                      <div className="mb-4">
                        <p className="section-header mb-2">Shot List</p>
                        <div className="space-y-1.5">
                          {creativePackage.shotList.slice(0, 5).map((shot) => (
                            <div key={shot.shot} className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'hsl(220 20% 10%)' }}>
                              <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'hsl(271 91% 65% / 0.15)', color: 'hsl(271 91% 65%)' }}>{shot.shot}</span>
                              <div>
                                <p className="text-xs font-medium text-text-primary">{shot.type} — {shot.description}</p>
                                <p className="text-[10px] text-text-muted">{shot.duration} · {shot.notes}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="section-header mb-2">Hook Ideas</p>
                        <div className="space-y-1.5">
                          {creativePackage.hookIdeas.map((hook, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'hsl(220 20% 10%)' }}>
                              <Lightbulb size={12} className="mt-0.5 shrink-0" style={{ color: 'hsl(43 96% 56%)' }} />
                              <p className="text-xs text-text-primary">{hook}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="section-header mb-2">Audio Suggestions</p>
                        {creativePackage.audioSuggestions.map((audio, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'hsl(220 20% 10%)' }}>
                            <Music size={14} style={{ color: 'hsl(162 100% 50%)' }} />
                            <div>
                              <p className="text-xs font-semibold text-text-primary">{audio.genre} · {audio.bpm}</p>
                              <p className="text-[10px] text-text-muted">{audio.platforms.join(', ')}</p>
                            </div>
                            <div className="ml-auto flex gap-1 flex-wrap">
                              {audio.searchTerms.slice(0, 2).map((term) => (
                                <span key={term} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'hsl(162 100% 50% / 0.1)', color: 'hsl(162 100% 50%)' }}>
                                  {term}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-text-muted mt-3 italic">Pacing: {creativePackage.pacingNotes}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {role === 'OPS' && (
              <div className="glass-card p-4">
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(opsTasks).map(([col, colTasks]) => {
                    const config = opsColConfig[col as keyof typeof opsColConfig];
                    const nextCol = col === 'To Do' ? 'In Progress' : col === 'In Progress' ? 'Done' : null;

                    return (
                      <div key={col} className="glass-card p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div style={{ color: config.color }}>{config.icon}</div>
                          <span className="text-sm font-semibold text-text-secondary">{col}</span>
                          <span
                            className="ml-auto text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: `${config.color}20`, color: config.color }}
                          >
                            {colTasks.length}
                          </span>
                        </div>

                        <div className="space-y-2 min-h-[300px]">
                          {colTasks.map(task => {
                            const priority = opsPriorityConfig[task.priority as keyof typeof opsPriorityConfig];
                            return (
                              <motion.div
                                key={task.id}
                                layout
                                className="p-3 rounded-xl cursor-pointer group"
                                style={{ background: 'hsl(220 20% 10%)', border: '1px solid hsl(220 20% 16%)' }}
                              >
                                <p className="text-xs font-medium text-text-primary mb-2 leading-snug">{task.title}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <Flag size={10} style={{ color: priority.color }} />
                                    <span className="text-[10px] font-semibold" style={{ color: priority.color }}>
                                      {priority.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                                      <Clock size={9} /> {task.time}
                                    </span>
                                    {nextCol && (
                                      <button
                                        onClick={() => moveOpsTask(task.id, col, nextCol)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                        style={{ background: `${config.color}15`, color: config.color }}
                                      >
                                        <MoveRight size={9} />
                                        Move
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </motion.div>

          {/* Right Side (5 columns) */}
          <motion.div variants={item} className="col-span-5 space-y-4">
            
            {/* Daily Performance Meter (for all except ADMIN) */}
            {role !== 'ADMIN' && (
              <div className="glass-card p-4 flex flex-col items-center">
                <p className="section-header mb-3 self-start">Today's Performance</p>
                <DailyPercentageMeter
                  percentage={todayPct}
                  projectedPayout={role === 'DEV' ? projectedPayout : (monthlySalary / 30) * todayPct}
                  monthlySalary={monthlySalary}
                  size="md"
                />

                {role === 'DEV' && (
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
                )}
              </div>
            )}

            {/* Radial Chart (ADMIN only) */}
            {role === 'ADMIN' && (
              <div className="glass-card p-4">
                <h3 className="font-bold font-display text-text-primary text-sm mb-3">Team Performance</h3>
                <div className="h-48">
                  {team.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="20%"
                        outerRadius="90%"
                        data={team.filter(m => m.avgMonthEffort > 0).map(m => ({
                          name: m.name,
                          value: Math.round(m.avgMonthEffort * 100),
                          fill: ROLE_COLORS[m.role] || '#fff',
                        }))}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar dataKey="value" background={{ fill: 'hsl(220 20% 12%)' }} />
                        <Tooltip
                          contentStyle={{ background: 'hsl(222 25% 8%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '8px', fontSize: '11px' }}
                          formatter={(v: any) => [`${v}%`, 'Completion']}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-text-muted">No standups submitted yet.</div>
                  )}
                </div>
                <div className="space-y-1.5 mt-2">
                  {team.map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ROLE_COLORS[m.role] || '#fff' }} />
                      <span className="text-xs text-text-secondary flex-1">{m.name}</span>
                      <span className="text-xs font-bold font-display" style={{ color: ROLE_COLORS[m.role] || '#fff' }}>
                        {Math.round(m.avgMonthEffort * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CRM Funnel (TECH only) */}
            {role === 'TECH' && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold font-display text-text-primary text-sm">CRM Pipeline</h2>
                  <span className="text-xs text-text-muted">₹3.66L total</span>
                </div>
                <div className="space-y-2">
                  {PIPELINE.map((stage) => {
                    const maxCount = PIPELINE[0].count;
                    const widthPct = (stage.count / maxCount) * 100;
                    return (
                      <div key={stage.stage}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-text-secondary">{stage.stage}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-text-muted">{formatINR(stage.value)}</span>
                            <span className="text-xs font-bold" style={{ color: stage.color }}>{stage.count}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(220 20% 12%)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                            className="h-full rounded-full"
                            style={{ background: stage.color, boxShadow: `0 0 8px ${stage.color}40` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'hsl(220 20% 14%)' }}>
                  <div className="flex items-center gap-2">
                    <Star size={13} style={{ color: 'hsl(43 96% 56%)' }} />
                    <span className="text-xs text-text-muted">Best opportunity</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'hsl(43 96% 56%)' }}>TechVision Ltd — ₹15K</span>
                </div>
              </div>
            )}

            {/* Read-only financial summary (DESIGN only) */}
            {role === 'DESIGN' && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 size={14} style={{ color: 'hsl(43 96% 56%)' }} />
                  <h3 className="text-sm font-bold text-text-primary">Financial Overview</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'hsl(234 89% 74% / 0.1)', color: 'hsl(234 89% 74%)' }}>READ-ONLY</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Revenue (June)', value: '₹2.4L', change: '+18%' },
                    { label: 'Outstanding Invoices', value: '₹45,000', change: '3 clients' },
                    { label: 'GST Collected', value: '₹43,200', change: '18% GST' },
                    { label: 'Team Payroll (Est.)', value: '₹78,000', change: 'This month' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'hsl(220 20% 14%)' }}>
                      <span className="text-xs text-text-secondary">{row.label}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-text-primary">{row.value}</span>
                        <span className="text-[10px] text-text-muted block">{row.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Creative Generator (VIDEO only) */}
            {role === 'VIDEO' && (
              <div
                className="glass-card p-4"
                style={{ borderColor: 'hsl(271 91% 65% / 0.2)', boxShadow: '0 0 20px hsl(271 91% 65% / 0.05)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 size={14} style={{ color: 'hsl(271 91% 65%)' }} />
                  <h3 className="text-sm font-bold text-text-primary">AI Creative Generator</h3>
                </div>

                {!showCreativeGen ? (
                  <button
                    onClick={() => setShowCreativeGen(true)}
                    className="w-full p-3 rounded-xl text-sm font-medium text-center transition-all"
                    style={{ background: 'hsl(271 91% 65% / 0.08)', border: '1px dashed hsl(271 91% 65% / 0.3)', color: 'hsl(271 91% 65%)' }}
                  >
                    <Sparkles size={16} className="mx-auto mb-1" />
                    Generate Creative Package
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase font-semibold block mb-1">Video Brief</label>
                      <textarea
                        value={brief}
                        onChange={e => setBrief(e.target.value)}
                        placeholder="e.g. 60-second agency life reel for Instagram Reels..."
                        rows={3}
                        className="input-field resize-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase font-semibold block mb-1">Target Audience</label>
                      <input
                        value={audience}
                        onChange={e => setAudience(e.target.value)}
                        placeholder="e.g. young entrepreneurs, 18-30"
                        className="input-field text-xs"
                      />
                    </div>
                    <button
                      onClick={generateCreativePackage}
                      disabled={loadingVideoAI || !brief.trim()}
                      className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                      style={{ background: 'linear-gradient(135deg, hsl(271 91% 65%), hsl(234 89% 74%))' }}
                    >
                      {loadingVideoAI ? <Loader2 size={14} className="animate-spin" /> : <Film size={14} />}
                      {loadingVideoAI ? 'Generating...' : 'Generate Package'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Add Form & Ops Stats (OPS only) */}
            {role === 'OPS' && (
              <div className="space-y-4">
                <div
                  className="glass-card p-4"
                  style={{ borderColor: 'hsl(162 100% 50% / 0.2)', boxShadow: '0 0 20px hsl(162 100% 50% / 0.05)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Plus size={14} style={{ color: 'hsl(162 100% 50%)' }} />
                    <h3 className="text-sm font-bold text-text-primary">Ops Task Manager</h3>
                  </div>

                  {!showAddForm ? (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full p-3 rounded-xl text-sm font-medium text-center transition-all"
                      style={{ background: 'hsl(162 100% 50% / 0.08)', border: '1px dashed hsl(162 100% 50% / 0.3)', color: 'hsl(162 100% 50%)' }}
                    >
                      <Plus size={16} className="mx-auto mb-1" />
                      Quick Add Task
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-text-muted uppercase font-semibold block mb-1">Task Title</label>
                        <input
                          type="text"
                          value={newTaskText}
                          onChange={e => setNewTaskText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addOpsTask()}
                          placeholder="Quick-add a task..."
                          className="input-field text-xs"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted uppercase font-semibold block mb-1">Priority</label>
                        <select
                          value={newPriority}
                          onChange={e => setNewPriority(e.target.value)}
                          className="input-field text-xs"
                        >
                          <option value="URGENT">🔴 Urgent</option>
                          <option value="HIGH">🟠 High</option>
                          <option value="MEDIUM">🔵 Medium</option>
                          <option value="LOW">⚫ Low</option>
                        </select>
                      </div>
                      <button onClick={addOpsTask} className="btn-primary w-full py-2 text-xs">
                        Add Task
                      </button>
                    </div>
                  )}
                </div>

                {Object.values(opsTasks).flat().filter(t => t.priority === 'URGENT').length > 0 && (
                  <div
                    className="p-3 rounded-xl"
                    style={{ background: 'hsl(0 84% 60% / 0.08)', border: '1px solid hsl(0 84% 60% / 0.25)' }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} style={{ color: 'hsl(0 84% 60%)' }} />
                      <p className="text-xs font-semibold" style={{ color: 'hsl(0 84% 60%)' }}>
                        {Object.values(opsTasks).flat().filter(t => t.priority === 'URGENT').length} urgent task(s) need attention
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GST Widget (DEV, DESIGN, ADMIN only) */}
            {(role === 'DEV' || role === 'DESIGN' || role === 'ADMIN') && (
              <GSTAlertWidget />
            )}

          </motion.div>

        </div>

      </motion.div>
    </>
  );
}
