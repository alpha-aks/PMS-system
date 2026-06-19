'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Loader2, Target, Clock, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: StandupResult) => void;
  userRole: string;
  monthlySalary: number;
  userName: string;
}

interface StandupResult {
  rawText: string;
  analysis: {
    totalComplexityWeight: number;
    targetPercentage: number;
    projectedPayout: number;
    aiSummary: string;
    motivationalMessage: string;
    tasks: {
      title: string;
      cognitiveLoad: number;
      estimatedHours: number;
      complexityWeight: number;
      category: string;
      suggestions: string;
    }[];
  };
}

const PLACEHOLDER_PROMPTS = [
  'e.g. Fix auth bug on client portal (3h), Review and submit GST returns for May, Update homepage hero section...',
  'e.g. 50 cold calls to real estate leads, Scrape 100 new B2B contacts, Follow up on 20 hot prospects...',
  'e.g. Design carousel for client brand, Create 3 social media templates, Finalize logo revisions for ABC Corp...',
];

export default function StandupModal({
  isOpen,
  onClose,
  onComplete,
  userRole,
  monthlySalary,
  userName,
}: StandupModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'analyzing' | 'result'>('input');
  const [result, setResult] = useState<StandupResult | null>(null);
  const [error, setError] = useState('');

  const placeholder = PLACEHOLDER_PROMPTS[Math.floor(Math.random() * PLACEHOLDER_PROMPTS.length)];

  const handleSubmit = async () => {
    if (!text.trim() || text.length < 10) {
      setError('Please describe your tasks in more detail.');
      return;
    }
    setError('');
    setLoading(true);
    setStep('analyzing');

    try {
      const res = await fetch('/api/ai/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text, role: userRole }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      const standupResult: StandupResult = { rawText: text, analysis: data };
      setResult(standupResult);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onComplete(result);
      onClose();
    }
  };

  const resetModal = () => {
    setText('');
    setStep('input');
    setResult(null);
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="glass-card w-full max-w-xl pointer-events-auto overflow-hidden"
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
              {/* Header */}
              <div
                className="p-5 border-b relative"
                style={{
                  borderColor: 'hsl(220 20% 18%)',
                  background: 'linear-gradient(135deg, hsl(234 89% 74% / 0.08), hsl(271 91% 65% / 0.05))',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, hsl(234 89% 74%), hsl(271 91% 65%))' }}
                  >
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-primary">Good morning, {userName}! 👋</h2>
                    <p className="text-xs text-text-muted">AI CEO Daily Stand-up — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Input step */}
              {step === 'input' && (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="section-header block mb-2">
                      🎯 What is your focus for today?
                    </label>
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder={placeholder}
                      rows={5}
                      className="input-field resize-none"
                      style={{ fontFamily: 'inherit' }}
                    />
                    {error && (
                      <p className="text-xs mt-1" style={{ color: 'hsl(0 84% 60%)' }}>{error}</p>
                    )}
                  </div>

                  <div
                    className="p-3 rounded-xl text-xs"
                    style={{
                      background: 'hsl(234 89% 74% / 0.06)',
                      border: '1px solid hsl(234 89% 74% / 0.15)',
                      color: 'hsl(215 25% 65%)',
                    }}
                  >
                    💡 <strong>Tip:</strong> Be specific. Include estimated time, client names, or task details. The AI will assess complexity and calculate your daily target percentage.
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!text.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Send size={15} />
                    Analyze with AI CEO
                  </button>
                </div>
              )}

              {/* Analyzing step */}
              {step === 'analyzing' && (
                <div className="p-10 flex flex-col items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, hsl(234 89% 74% / 0.2), hsl(271 91% 65% / 0.15))' }}
                  >
                    <Loader2 size={28} className="animate-spin" style={{ color: 'hsl(234 89% 74%)' }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-text-primary">AI CEO is analyzing...</p>
                    <p className="text-sm text-text-muted mt-1">Scoring complexity, estimating hours, projecting payout</p>
                  </div>
                  <div className="w-full space-y-2 mt-2">
                    {['Parsing task descriptions...', 'Calculating complexity weights...', 'Projecting daily payout...'].map((step, i) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.4 }}
                        className="flex items-center gap-2 text-xs text-text-muted"
                      >
                        <Loader2 size={12} className="animate-spin shrink-0" style={{ color: 'hsl(234 89% 74%)' }} />
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Result step */}
              {step === 'result' && result && (
                <div className="p-5 space-y-4">
                  {/* Summary metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div
                      className="p-3 rounded-xl text-center"
                      style={{ background: 'hsl(234 89% 74% / 0.08)', border: '1px solid hsl(234 89% 74% / 0.2)' }}
                    >
                      <Target size={16} className="mx-auto mb-1" style={{ color: 'hsl(234 89% 74%)' }} />
                      <p className="text-lg font-bold font-display" style={{ color: 'hsl(234 89% 74%)' }}>
                        {Math.round(result.analysis.targetPercentage)}%
                      </p>
                      <p className="text-[10px] text-text-muted">Target</p>
                    </div>
                    <div
                      className="p-3 rounded-xl text-center"
                      style={{ background: 'hsl(162 100% 50% / 0.08)', border: '1px solid hsl(162 100% 50% / 0.2)' }}
                    >
                      <Brain size={16} className="mx-auto mb-1" style={{ color: 'hsl(162 100% 50%)' }} />
                      <p className="text-lg font-bold font-display" style={{ color: 'hsl(162 100% 50%)' }}>
                        {(result.analysis.totalComplexityWeight * 10).toFixed(1)}
                      </p>
                      <p className="text-[10px] text-text-muted">Complexity</p>
                    </div>
                    <div
                      className="p-3 rounded-xl text-center"
                      style={{ background: 'hsl(43 96% 56% / 0.08)', border: '1px solid hsl(43 96% 56% / 0.2)' }}
                    >
                      <Clock size={16} className="mx-auto mb-1" style={{ color: 'hsl(43 96% 56%)' }} />
                      <p className="text-base font-bold font-display" style={{ color: 'hsl(43 96% 56%)' }}>
                        ₹{result.analysis.projectedPayout.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-text-muted">Projected</p>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div
                    className="p-3 rounded-xl"
                    style={{ background: 'hsl(220 20% 10%)', border: '1px solid hsl(220 20% 18%)' }}
                  >
                    <p className="text-xs font-semibold text-text-secondary mb-1">AI CEO Assessment</p>
                    <p className="text-sm text-text-primary">{result.analysis.aiSummary}</p>
                  </div>

                  {/* Task breakdown */}
                  <div>
                    <p className="section-header mb-2">Task Breakdown</p>
                    <div className="space-y-2">
                      {result.analysis.tasks.map((task, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg flex items-start gap-3"
                          style={{ background: 'hsl(220 20% 10%)', border: '1px solid hsl(220 20% 18%)' }}
                        >
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                            style={{ background: 'hsl(234 89% 74% / 0.15)', color: 'hsl(234 89% 74%)' }}
                          >
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
                            <p className="text-xs text-text-muted mt-0.5">{task.suggestions}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold" style={{ color: 'hsl(234 89% 74%)' }}>
                              {Math.round(task.complexityWeight * 100)}%
                            </p>
                            <p className="text-[10px] text-text-muted">{task.estimatedHours}h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Motivational message */}
                  <div
                    className="p-3 rounded-xl text-center"
                    style={{ background: 'linear-gradient(135deg, hsl(234 89% 74% / 0.06), hsl(271 91% 65% / 0.04))' }}
                  >
                    <p className="text-sm font-medium gradient-text">
                      ✨ {result.analysis.motivationalMessage}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={resetModal}
                      className="btn-ghost flex-1"
                    >
                      Re-enter Tasks
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} />
                      Lock in My Day
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
