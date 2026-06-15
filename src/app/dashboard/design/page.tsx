'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Palette, Image, CheckCircle2, Clock, Upload,
  ArrowUpRight, PlusCircle, Eye, BarChart3, Layers
} from 'lucide-react';
import DailyPercentageMeter from '@/components/DailyPercentageMeter';
import GSTAlertWidget from '@/components/GSTAlertWidget';
import StandupModal from '@/components/StandupModal';
import { formatINR } from '@/lib/utils';
import { getUserDashboardStats } from '@/app/actions/user';


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

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

export default function DesignDashboard() {
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
        userRole="DESIGN"
        monthlySalary={monthlySalary}
        userName="Pruthul"
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1400px]">
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-text-primary">Graphic Design</h1>
            <p className="text-sm text-text-muted mt-0.5">Asset delivery pipeline · Accounts read-only</p>
          </div>
          <button onClick={() => setShowStandup(true)} className="btn-primary flex items-center gap-2">
            <Palette size={15} />
            Daily Stand-up
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={item} className="grid grid-cols-4 gap-4">
          {[
            { label: 'Assets Delivered', value: '12', icon: <CheckCircle2 size={16} />, color: 'hsl(142 71% 45%)', sub: 'This week' },
            { label: 'In Progress', value: '3', icon: <Layers size={16} />, color: 'hsl(234 89% 74%)', sub: 'Active requests' },
            { label: 'Avg Turnaround', value: '2.1d', icon: <Clock size={16} />, color: 'hsl(43 96% 56%)', sub: 'vs 3d target' },
            { label: 'Client Satisfaction', value: '4.8★', icon: <Eye size={16} />, color: 'hsl(320 80% 65%)', sub: 'Last 10 reviews' },
          ].map((stat) => (
            <div key={stat.label} className="premium-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}20`, color: stat.color }}>{stat.icon}</div>
                <ArrowUpRight size={14} className="text-text-muted" />
              </div>
              <p className="text-2xl font-bold font-display text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted">{stat.label}</p>
              <p className="text-[10px] mt-1" style={{ color: stat.color }}>{stat.sub}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-12 gap-4">
          {/* Asset pipeline */}
          <motion.div variants={item} className="col-span-8">
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
                        <Image size={14} />
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
          </motion.div>

          {/* Right column: Meter + GST (read-only access for Pruthul) */}
          <motion.div variants={item} className="col-span-4 space-y-4">
            <div className="glass-card p-4 flex flex-col items-center">
              <p className="section-header mb-3 self-start">Today's Performance</p>
              <DailyPercentageMeter percentage={todayPct} projectedPayout={(monthlySalary / 30) * todayPct} monthlySalary={monthlySalary} size="md" />
            </div>

            {/* Read-only financial summary (Pruthul as Accounts Backup) */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} style={{ color: 'hsl(43 96% 56%)' }} />
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

            <GSTAlertWidget />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
