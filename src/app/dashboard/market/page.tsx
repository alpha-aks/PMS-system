'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserSearch, Phone, Timer, Lock, CheckCircle2,
  Zap, TrendingUp, Clock, ArrowRight, AlertCircle,
  Trophy, Flame
} from 'lucide-react';
import { cn, formatINR } from '@/lib/utils';

// Simulated slot state (replace with real DB data)
const TOTAL_SLOTS = 10; // 5 sourcing + 5 calling per example

type SlotType = 'SOURCING' | 'CALLING';

interface Slot {
  id: string;
  type: SlotType;
  lockedBy: string | null;
  quota: number;
  completedCount: number;
  payScale: number;
}

function generateSlots(): Slot[] {
  return [
    ...Array(5).fill(null).map((_, i) => ({
      id: `sourcing-${i + 1}`,
      type: 'SOURCING' as SlotType,
      lockedBy: i === 0 ? 'Rishabh' : null,
      quota: 100,
      completedCount: i === 0 ? 67 : 0,
      payScale: 1.0,
    })),
    ...Array(5).fill(null).map((_, i) => ({
      id: `calling-${i + 1}`,
      type: 'CALLING' as SlotType,
      lockedBy: i === 0 ? 'Nishant' : null,
      quota: 50,
      completedCount: i === 0 ? 23 : 0,
      payScale: 1.2, // Calling is paying 20% more today
    })),
  ];
}

const typeConfig = {
  SOURCING: {
    icon: <UserSearch size={20} />,
    color: 'hsl(234 89% 74%)',
    label: 'Lead Sourcing',
    description: 'Scrape & qualify 100 leads from target niche',
    quota: '100 leads',
    estimatedTime: '3–4 hours',
  },
  CALLING: {
    icon: <Phone size={20} />,
    color: 'hsl(162 100% 50%)',
    label: 'Cold Calling',
    description: 'Make 50 outbound calls & log outcomes in CRM',
    quota: '50 calls',
    estimatedTime: '4–5 hours',
    hotLabel: '🔥 +20% pay today',
  },
};

const container: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

export default function MarketPage() {
  const [slots, setSlots] = useState<Slot[]>(generateSlots());
  const [myLockedSlot, setMyLockedSlot] = useState<Slot | null>(null);
  const [selectedType, setSelectedType] = useState<SlotType | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [marketOpen, setMarketOpen] = useState(true);
  const [myProgress, setMyProgress] = useState(0);

  // Countdown to market close (end of day 9 PM)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const close = new Date();
      close.setHours(21, 0, 0, 0);
      const diff = close.getTime() - now.getTime();
      if (diff <= 0) {
        setMarketOpen(false);
        setTimeLeft('Closed');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const availableSlots = (type: SlotType) => slots.filter(s => s.type === type && !s.lockedBy);
  const lockedSlots = (type: SlotType) => slots.filter(s => s.type === type && s.lockedBy);

  const lockSlot = () => {
    if (!selectedType) return;
    const available = slots.find(s => s.type === selectedType && !s.lockedBy);
    if (!available) return;

    setSlots(prev =>
      prev.map(s => s.id === available.id ? { ...s, lockedBy: 'You' } : s)
    );
    setMyLockedSlot({ ...available, lockedBy: 'You' });
    setConfirmOpen(false);
    setSelectedType(null);
  };

  const logProgress = (count: number) => {
    if (!myLockedSlot) return;
    setMyProgress(count);
    setSlots(prev =>
      prev.map(s => s.id === myLockedSlot.id ? { ...s, completedCount: count } : s)
    );
  };

  const isComplete = myLockedSlot && myProgress >= myLockedSlot.quota;
  const availableSourceCount = availableSlots('SOURCING').length;
  const availableCallCount = availableSlots('CALLING').length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary">
            Lead Generation Market
          </h1>
          <p className="text-sm text-text-muted mt-0.5">Daily 50/50 marketplace · First-come, first-served</p>
        </div>

        {/* Market status + timer */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="section-header">Market Closes In</p>
            <p className="text-xl font-bold font-display" style={{ color: 'hsl(162 100% 50%)' }}>{timeLeft}</p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: marketOpen ? 'hsl(162 100% 50% / 0.08)' : 'hsl(0 84% 60% / 0.08)',
              border: `1px solid ${marketOpen ? 'hsl(162 100% 50% / 0.25)' : 'hsl(0 84% 60% / 0.25)'}`,
            }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: marketOpen ? 'hsl(162 100% 50%)' : 'hsl(0 84% 60%)' }} />
            <span className="text-sm font-semibold" style={{ color: marketOpen ? 'hsl(162 100% 50%)' : 'hsl(0 84% 60%)' }}>
              Market {marketOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* If user has locked a slot, show quota tracker */}
      {myLockedSlot && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-5"
          style={{
            borderColor: `${typeConfig[myLockedSlot.type].color}40`,
            boxShadow: `0 0 30px ${typeConfig[myLockedSlot.type].color}15`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${typeConfig[myLockedSlot.type].color}20`, color: typeConfig[myLockedSlot.type].color }}
            >
              {typeConfig[myLockedSlot.type].icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold font-display text-text-primary">{typeConfig[myLockedSlot.type].label} — Active</h2>
                <Lock size={13} style={{ color: typeConfig[myLockedSlot.type].color }} />
              </div>
              <p className="text-xs text-text-muted">Quota: {myLockedSlot.quota} · Pay scale: {myLockedSlot.payScale}x</p>
            </div>
            {isComplete && (
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'hsl(142 71% 45% / 0.1)', border: '1px solid hsl(142 71% 45% / 0.3)' }}>
                <Trophy size={14} style={{ color: 'hsl(142 71% 45%)' }} />
                <span className="text-sm font-bold" style={{ color: 'hsl(142 71% 45%)' }}>Quota Complete!</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Progress</span>
              <span className="text-sm font-bold font-display" style={{ color: typeConfig[myLockedSlot.type].color }}>
                {myProgress} / {myLockedSlot.quota}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'hsl(220 20% 14%)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((myProgress / myLockedSlot.quota) * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${typeConfig[myLockedSlot.type].color}80, ${typeConfig[myLockedSlot.type].color})`,
                  boxShadow: `0 0 10px ${typeConfig[myLockedSlot.type].color}50`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-text-muted">0</span>
              <span className="text-[10px] text-text-muted">{myLockedSlot.quota}</span>
            </div>
          </div>

          {/* Log progress */}
          {!isComplete && (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={myLockedSlot.quota}
                value={myProgress}
                onChange={e => logProgress(parseInt(e.target.value) || 0)}
                className="input-field w-32"
                placeholder="Count..."
              />
              <span className="text-sm text-text-muted">
                {myLockedSlot.type === 'CALLING' ? 'calls made' : 'leads scraped'}
              </span>
              <div className="ml-auto text-right">
                <p className="text-xs text-text-muted">Projected earning</p>
                <p className="text-lg font-bold font-display" style={{ color: 'hsl(43 96% 56%)' }}>
                  {formatINR(Math.round((myProgress / myLockedSlot.quota) * 1400 * myLockedSlot.payScale))}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Slot marketplace */}
      {!myLockedSlot && (
        <div className="grid grid-cols-2 gap-6">
          {(['SOURCING', 'CALLING'] as SlotType[]).map((type) => {
            const config = typeConfig[type];
            const available = availableSlots(type);
            const locked = lockedSlots(type);
            const isFull = available.length === 0;

            return (
              <motion.div
                key={type}
                variants={item}
                className="glass-card p-5 relative overflow-hidden"
                style={{
                  borderColor: `${config.color}25`,
                  ...(type === 'CALLING' ? { boxShadow: `0 0 30px hsl(162 100% 50% / 0.08)` } : {}),
                }}
              >
                {type === 'CALLING' && (
                  <div
                    className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: 'hsl(162 100% 50% / 0.15)', color: 'hsl(162 100% 50%)', border: '1px solid hsl(162 100% 50% / 0.3)' }}
                  >
                    <Flame size={10} className="inline mr-1" />
                    +20% PAY TODAY
                  </div>
                )}

                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${config.color}15`, color: config.color }}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <h2 className="font-bold font-display text-text-primary">{config.label}</h2>
                    <p className="text-xs text-text-muted mt-0.5">{config.description}</p>
                  </div>
                </div>

                {/* Slot availability */}
                <div className="grid grid-cols-5 gap-1.5 mb-4">
                  {Array(5).fill(null).map((_, i) => {
                    const slot = [...locked, ...available][i];
                    const isLocked = i < locked.length;
                    return (
                      <div
                        key={i}
                        className="h-2 rounded-full transition-all"
                        style={{
                          background: isLocked
                            ? config.color
                            : 'hsl(220 20% 16%)',
                          boxShadow: isLocked ? `0 0 6px ${config.color}50` : 'none',
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-text-muted mb-4">
                  <span className="font-bold" style={{ color: config.color }}>{available.length}</span> of 5 slots available
                </p>

                <div className="space-y-2 mb-4">
                  {[
                    { label: 'Quota', value: config.quota },
                    { label: 'Est. Time', value: config.estimatedTime },
                    { label: 'Pay Scale', value: `${type === 'CALLING' ? '1.2x' : '1.0x'} base` },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">{row.label}</span>
                      <span className="font-semibold text-text-primary">{row.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={isFull || !marketOpen}
                  onClick={() => { setSelectedType(type); setConfirmOpen(true); }}
                  className={cn('w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all', isFull || !marketOpen ? 'opacity-50 cursor-not-allowed' : '')}
                  style={{
                    background: isFull ? 'hsl(220 20% 14%)' : `linear-gradient(135deg, ${config.color}30, ${config.color}20)`,
                    border: `1px solid ${config.color}${isFull ? '20' : '40'}`,
                    color: isFull ? 'hsl(220 15% 45%)' : config.color,
                  }}
                >
                  {isFull ? (
                    <><Lock size={14} /> All Slots Taken</>
                  ) : (
                    <><Zap size={14} /> Lock In This Slot<ArrowRight size={14} /></>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmOpen && selectedType && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="glass-card p-6 max-w-sm w-full pointer-events-auto">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${typeConfig[selectedType].color}20`, color: typeConfig[selectedType].color }}
                >
                  {typeConfig[selectedType].icon}
                </div>
                <h3 className="text-lg font-bold font-display text-text-primary text-center">
                  Lock in {typeConfig[selectedType].label}?
                </h3>
                <p className="text-sm text-text-muted text-center mt-2 mb-5">
                  Your dashboard will lock to this task until you complete your quota of{' '}
                  <strong className="text-text-primary">{typeConfig[selectedType].quota}</strong>.
                  This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmOpen(false)} className="btn-ghost flex-1">Cancel</button>
                  <button
                    onClick={lockSlot}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${typeConfig[selectedType].color}, ${typeConfig[selectedType].color}cc)`,
                      color: 'hsl(220 27% 5%)',
                    }}
                  >
                    Confirm & Lock
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Current market activity */}
      <motion.div variants={item} className="glass-card p-4">
        <h3 className="font-bold font-display text-text-primary mb-3">Today's Market Activity</h3>
        <div className="grid grid-cols-2 gap-4">
          {(['SOURCING', 'CALLING'] as SlotType[]).map(type => {
            const locked = lockedSlots(type);
            return (
              <div key={type}>
                <p className="section-header mb-2" style={{ color: typeConfig[type].color }}>{typeConfig[type].label}</p>
                {locked.length === 0 ? (
                  <p className="text-xs text-text-muted italic">No one has locked in yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {locked.map(slot => {
                      const pct = Math.round((slot.completedCount / slot.quota) * 100);
                      return (
                        <div key={slot.id} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-text-primary w-16 truncate">{slot.lockedBy}</span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(220 20% 14%)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: typeConfig[type].color }}
                            />
                          </div>
                          <span className="text-xs font-bold" style={{ color: typeConfig[type].color }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
