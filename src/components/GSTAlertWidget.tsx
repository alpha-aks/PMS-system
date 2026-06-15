'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, AlertOctagon } from 'lucide-react';
import { getGSTStatus, type GSTAlertLevel } from '@/lib/utils';

const alertConfig: Record<GSTAlertLevel, {
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
  pulse: boolean;
  label: string;
}> = {
  safe: {
    bg: 'hsl(142 71% 45% / 0.08)',
    border: 'hsl(142 71% 45% / 0.25)',
    text: 'hsl(142 71% 55%)',
    icon: <CheckCircle size={14} />,
    pulse: false,
    label: 'All clear',
  },
  caution: {
    bg: 'hsl(199 89% 48% / 0.08)',
    border: 'hsl(199 89% 48% / 0.25)',
    text: 'hsl(199 89% 58%)',
    icon: <Clock size={14} />,
    pulse: false,
    label: 'Upcoming',
  },
  warning: {
    bg: 'hsl(43 96% 56% / 0.1)',
    border: 'hsl(43 96% 56% / 0.3)',
    text: 'hsl(43 96% 66%)',
    icon: <Clock size={14} />,
    pulse: false,
    label: 'This week',
  },
  danger: {
    bg: 'hsl(38 100% 56% / 0.1)',
    border: 'hsl(38 100% 56% / 0.35)',
    text: 'hsl(38 100% 66%)',
    icon: <AlertTriangle size={14} />,
    pulse: true,
    label: 'Due soon',
  },
  critical: {
    bg: 'hsl(0 84% 60% / 0.12)',
    border: 'hsl(0 84% 60% / 0.4)',
    text: 'hsl(0 84% 70%)',
    icon: <AlertOctagon size={14} />,
    pulse: true,
    label: '⚠️ URGENT',
  },
};

interface GSTAlertRowProps {
  type: 'Filing' | 'Payment';
  daysLeft: number;
  dueDate: string;
  level: GSTAlertLevel;
}

function GSTAlertRow({ type, daysLeft, dueDate, level }: GSTAlertRowProps) {
  const config = alertConfig[level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <div
        className={config.pulse ? 'animate-pulse-danger' : ''}
        style={{ color: config.text }}
      >
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">
            GST {type}
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: config.bg,
              color: config.text,
              border: `1px solid ${config.border}`,
            }}
          >
            {config.label}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-0.5">Due: {dueDate}</p>
      </div>
      <div className="text-right shrink-0">
        <p
          className="text-lg font-bold font-display leading-none"
          style={{ color: config.text }}
        >
          {daysLeft <= 0 ? 'TODAY' : `${daysLeft}d`}
        </p>
        <p className="text-[10px] text-text-muted">left</p>
      </div>
    </motion.div>
  );
}

export default function GSTAlertWidget() {
  const status = getGSTStatus();

  const maxLevel = (['critical', 'danger', 'warning', 'caution', 'safe'] as GSTAlertLevel[])
    .find(l => status.filingLevel === l || status.paymentLevel === l) || 'safe';

  const isUrgent = maxLevel === 'critical' || maxLevel === 'danger';

  return (
    <div
      className="glass-card p-4 relative overflow-hidden"
      style={isUrgent ? {
        borderColor: 'hsl(0 84% 60% / 0.3)',
        boxShadow: '0 0 30px hsl(0 84% 60% / 0.1)',
      } : {}}
    >
      {/* Urgent background pulse */}
      {isUrgent && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          animate={{ opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ background: 'hsl(0 84% 60%)' }}
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary">GST Calendar</h3>
            <p className="text-[11px] text-text-muted">GSTIN filing deadlines</p>
          </div>
          {isUrgent && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: 'hsl(0 84% 60% / 0.15)',
                border: '1px solid hsl(0 84% 60% / 0.3)',
                color: 'hsl(0 84% 70%)',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'hsl(0 84% 60%)' }}
              />
              <span className="text-[10px] font-bold">ACTION NEEDED</span>
            </motion.div>
          )}
        </div>

        {/* Alert rows */}
        <div className="space-y-2">
          <GSTAlertRow
            type="Filing"
            daysLeft={status.filingDaysLeft}
            dueDate={status.filingDate}
            level={status.filingLevel}
          />
          <GSTAlertRow
            type="Payment"
            daysLeft={status.paymentDaysLeft}
            dueDate={status.paymentDate}
            level={status.paymentLevel}
          />
        </div>

        {/* Info note */}
        <p className="text-[10px] text-text-muted mt-3 text-center">
          Filing due 10th · Payment due 20th · Penalties apply after deadline
        </p>
      </div>
    </div>
  );
}
