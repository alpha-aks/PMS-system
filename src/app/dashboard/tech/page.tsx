'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserSearch, Phone, TrendingUp, Users, Star,
  ChevronRight, PlusCircle, ArrowUpRight, Target, Flame
} from 'lucide-react';
import DailyPercentageMeter from '@/components/DailyPercentageMeter';
import StandupModal from '@/components/StandupModal';
import { formatINR } from '@/lib/utils';
import { getUserDashboardStats } from '@/app/actions/user';

// Mock CRM pipeline data
const PIPELINE = [
  { stage: 'Prospect', count: 24, value: 180000, color: 'hsl(220 15% 55%)' },
  { stage: 'Contacted', count: 12, value: 90000, color: 'hsl(234 89% 74%)' },
  { stage: 'Qualified', count: 6, value: 54000, color: 'hsl(43 96% 56%)' },
  { stage: 'Proposal', count: 3, value: 27000, color: 'hsl(271 91% 65%)' },
  { stage: 'Closed Won', count: 1, value: 15000, color: 'hsl(142 71% 45%)' },
];

// Mock sprint tasks
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function TechDashboard() {
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

  if (isLoading) return <div className="p-8 text-center text-text-muted animate-pulse">Loading dashboard...</div>;

  return (
    <>
      <StandupModal
        isOpen={showStandup}
        onClose={() => setShowStandup(false)}
        onComplete={(r) => setTodayPct(r.analysis.targetPercentage / 100)}
        userRole="TECH"
        monthlySalary={monthlySalary}
        userName="Nishant"
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1400px]">
        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-text-primary">Tech & Lead Gen</h1>
            <p className="text-sm text-text-muted mt-0.5">Sprint + CRM pipeline — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <button onClick={() => setShowStandup(true)} className="btn-primary flex items-center gap-2">
            <Target size={15} />
            Daily Stand-up
          </button>
        </motion.div>

        {/* Top stats */}
        <motion.div variants={item} className="grid grid-cols-4 gap-4">
          {[
            { label: 'Leads Sourced', value: '147', icon: <UserSearch size={16} />, color: 'hsl(234 89% 74%)', sub: 'This week' },
            { label: 'Calls Made', value: '38', icon: <Phone size={16} />, color: 'hsl(271 91% 65%)', sub: 'Today' },
            { label: 'Pipeline Value', value: '₹3.66L', icon: <TrendingUp size={16} />, color: 'hsl(43 96% 56%)', sub: '6 active deals' },
            { label: 'Conversion Rate', value: '8.2%', icon: <Flame size={16} />, color: 'hsl(14 90% 60%)', sub: '+1.4% vs last wk' },
          ].map((stat) => (
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

        {/* Split view: Sprint (left) + CRM Pipeline (right) */}
        <div className="grid grid-cols-12 gap-4">
          {/* Sprint Board */}
          <motion.div variants={item} className="col-span-7">
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
                        <span className="text-xs font-semibold text-text-secondary">{col}</span>
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
          </motion.div>

          {/* CRM Pipeline + Meter */}
          <motion.div variants={item} className="col-span-5 space-y-4">
            {/* Performance meter */}
            <div className="glass-card p-4 flex flex-col items-center">
              <p className="section-header mb-3 self-start">Today's Performance</p>
              <DailyPercentageMeter
                percentage={todayPct}
                projectedPayout={(monthlySalary / 30) * todayPct}
                monthlySalary={monthlySalary}
                size="md"
              />
            </div>

            {/* CRM Funnel */}
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
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
