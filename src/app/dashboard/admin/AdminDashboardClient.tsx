'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, CheckCircle2, Clock,
  AlertTriangle, DollarSign, BarChart2,
  ShieldCheck, Zap, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { formatINR, ROLE_COLORS, ROLE_LABELS } from '@/lib/utils';
import GSTAlertWidget from '@/components/GSTAlertWidget';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { overrideTodayPercentage } from '@/app/actions/user';

interface TeamMemberData {
  id: string; // The User ID or Clerk ID
  standupId: string | null;
  name: string;
  role: string;
  monthlySalary: number;
  todayEffort: number;
  avgMonthEffort: number;
  estMonthPay: number;
  approved: boolean;
}

interface Props {
  initialTeam: TeamMemberData[];
}

const container: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

export default function AdminDashboardClient({ initialTeam }: Props) {
  const [team, setTeam] = useState(initialTeam);
  const [allApproved, setAllApproved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const totalEstMonthPay = team.reduce((sum, m) => sum + m.estMonthPay, 0);
  const avgAgencyEffort = team.length > 0 ? team.reduce((sum, m) => sum + m.avgMonthEffort, 0) / team.length : 0;
  const pendingApprovals = team.filter(m => m.standupId && !m.approved).length;

  const approveAll = () => {
    setTeam(prev => prev.map(m => ({ ...m, approved: true })));
    setAllApproved(true);
    // TODO: Add server action call to approve all
  };

  const approveMember = (id: string) => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, approved: true } : m));
    // TODO: Add server action call to approve member
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

  const radialData = team.filter(m => m.avgMonthEffort > 0).map(m => ({
    name: m.name,
    value: Math.round(m.avgMonthEffort * 100),
    fill: ROLE_COLORS[m.role as keyof typeof ROLE_COLORS] || '#fff',
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary">
            <span className="gradient-text">Command Center</span> — Agency Overview
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Master Admin · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingApprovals > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl animate-pulse-danger"
              style={{ background: 'hsl(43 96% 56% / 0.1)', border: '1px solid hsl(43 96% 56% / 0.3)' }}
            >
              <AlertTriangle size={14} style={{ color: 'hsl(43 96% 56%)' }} />
              <span className="text-sm font-semibold" style={{ color: 'hsl(43 96% 56%)' }}>
                {pendingApprovals} Payout{pendingApprovals > 1 ? 's' : ''} Pending Approval
              </span>
            </div>
          )}
          {!allApproved && pendingApprovals > 0 && (
            <button onClick={approveAll} className="btn-primary flex items-center gap-2">
              <ShieldCheck size={15} />
              Approve All Payouts
            </button>
          )}
        </div>
      </motion.div>

      {/* Agency KPI row */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {[
          { label: 'Est. Total Month Payroll', value: formatINR(totalEstMonthPay), icon: <DollarSign size={16} />, color: 'hsl(43 96% 56%)', sub: 'Based on current avg effort', badge: null },
          { label: 'Agency Month Effort', value: `${Math.round(avgAgencyEffort * 100)}%`, icon: <BarChart2 size={16} />, color: 'hsl(234 89% 74%)', sub: 'Team average this month', badge: null },
          { label: 'Active Team Members', value: `${team.length}/${team.length}`, icon: <Users size={16} />, color: 'hsl(142 71% 45%)', sub: 'All online', badge: 'LIVE' },
          { label: 'Revenue Pipeline', value: '₹3.66L', icon: <TrendingUp size={16} />, color: 'hsl(271 91% 65%)', sub: 'Active opportunities', badge: null },
        ].map((stat) => (
          <div key={stat.label} className="premium-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </div>
              {stat.badge && (
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: stat.badge === 'PENDING' ? 'hsl(43 96% 56% / 0.15)' : stat.badge === 'LIVE' ? 'hsl(162 100% 50% / 0.15)' : 'hsl(142 71% 45% / 0.15)',
                    color: stat.badge === 'PENDING' ? 'hsl(43 96% 56%)' : stat.badge === 'LIVE' ? 'hsl(162 100% 50%)' : 'hsl(142 71% 45%)',
                    border: `1px solid ${stat.badge === 'PENDING' ? 'hsl(43 96% 56% / 0.3)' : stat.badge === 'LIVE' ? 'hsl(162 100% 50% / 0.3)' : 'hsl(142 71% 45% / 0.3)'}`,
                  }}
                >
                  {stat.badge}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold font-display text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className="text-[10px] mt-1" style={{ color: stat.color }}>{stat.sub}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-12 gap-4">
        {/* Team payout approval table */}
        <motion.div variants={item} className="col-span-8">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold font-display text-text-primary">Team Payout Approvals</h2>
              <span className="text-xs text-text-muted">AI Proposed · Admin Approved Paradigm</span>
            </div>

            {/* Table header */}
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
                const roleColor = ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] || '#fff';
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
                    {/* Name */}
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: roleColor }}>
                        {member.name[0]}
                      </div>
                      <span className="text-sm font-medium text-text-primary truncate">{member.name}</span>
                    </div>

                    {/* Today % */}
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

                    {/* Avg Month % bar */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: compPct >= 80 ? 'hsl(142 71% 45%)' : compPct >= 50 ? 'hsl(234 89% 74%)' : 'hsl(38 100% 56%)' }}>
                          {compPct}%
                        </span>
                      </div>
                    </div>

                    {/* Monthly Salary */}
                    <div className="col-span-1">
                      <span className="text-xs text-text-muted">{formatINR(member.monthlySalary)}</span>
                    </div>

                    {/* Est Month pay */}
                    <div className="col-span-2">
                      <span className="text-sm font-bold font-display" style={{ color: 'hsl(43 96% 56%)' }}>
                        {formatINR(member.estMonthPay)}
                      </span>
                    </div>

                    {/* Action */}
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

            {/* Total */}
            <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'hsl(220 20% 18%)' }}>
              <span className="text-sm font-semibold text-text-secondary">Est. Monthly Payroll based on Avg Effort</span>
              <span className="text-xl font-bold font-display" style={{ color: 'hsl(43 96% 56%)' }}>
                {formatINR(totalEstMonthPay)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right column */}
        <motion.div variants={item} className="col-span-4 space-y-4">
          {/* Team completion radial chart */}
          <div className="glass-card p-4">
            <h3 className="font-bold font-display text-text-primary text-sm mb-3">Team Performance</h3>
            <div className="h-48">
              {radialData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="90%"
                    data={radialData}
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
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ROLE_COLORS[m.role as keyof typeof ROLE_COLORS] || '#fff' }} />
                  <span className="text-xs text-text-secondary flex-1">{m.name}</span>
                  <span className="text-xs font-bold font-display" style={{ color: ROLE_COLORS[m.role as keyof typeof ROLE_COLORS] || '#fff' }}>
                    {Math.round(m.avgMonthEffort * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <GSTAlertWidget />
        </motion.div>
      </div>
    </motion.div>
  );
}
