'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Wand2, Music, Film, Lightbulb,
  Loader2, Palette, Clock, CheckCircle2,
  Clapperboard, ArrowRight, Sparkles
} from 'lucide-react';
import DailyPercentageMeter from '@/components/DailyPercentageMeter';
import StandupModal from '@/components/StandupModal';
import type { VideoCreativePackage } from '@/lib/ai/gemini';


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

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

export default function VideoDashboard() {
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
  const [showCreativeGen, setShowCreativeGen] = useState(false);
  const [brief, setBrief] = useState('');
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [creativePackage, setCreativePackage] = useState<VideoCreativePackage | null>(null);

  const generateCreativePackage = async () => {
    if (!brief.trim()) return;
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <>
      <StandupModal
        isOpen={showStandup}
        onClose={() => setShowStandup(false)}
        onComplete={(r) => setTodayPct(r.analysis.targetPercentage / 100)}
        userRole="VIDEO"
        monthlySalary={monthlySalary}
        userName="Om"
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1400px]">
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-text-primary">Video Editing</h1>
            <p className="text-sm text-text-muted mt-0.5">AI-powered creative toolkit · Assignment tracker</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCreativeGen(true)} className="btn-ghost flex items-center gap-2">
              <Wand2 size={15} />
              AI Creative Toolkit
            </button>
            <button onClick={() => setShowStandup(true)} className="btn-primary flex items-center gap-2">
              <Clapperboard size={15} />
              Daily Stand-up
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left: Video tasks */}
          <motion.div variants={item} className="col-span-8 space-y-4">
            {/* Assigned videos */}
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

            {/* Creative package result */}
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

                  {/* Mood board */}
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

                  {/* Shot list */}
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

                  {/* Hooks */}
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

                  {/* Audio */}
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
          </motion.div>

          {/* Right: Meter + AI generator */}
          <motion.div variants={item} className="col-span-4 space-y-4">
            <div className="glass-card p-4 flex flex-col items-center">
              <p className="section-header mb-3 self-start">Today's Performance</p>
              <DailyPercentageMeter percentage={todayPct} projectedPayout={(monthlySalary / 30) * todayPct} monthlySalary={monthlySalary} size="md" />
            </div>

            {/* AI Creative Generator panel */}
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
                    disabled={loading || !brief.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                    style={{ background: 'linear-gradient(135deg, hsl(271 91% 65%), hsl(234 89% 74%))' }}
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Film size={14} />}
                    {loading ? 'Generating...' : 'Generate Package'}
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="glass-card p-4 space-y-3">
              <p className="section-header">Output Stats</p>
              {[
                { label: 'Videos This Month', value: '8', icon: <Film size={13} />, color: 'hsl(234 89% 74%)' },
                { label: 'Avg Edit Time', value: '3.2h', icon: <Clock size={13} />, color: 'hsl(43 96% 56%)' },
                { label: 'Client Revisions', value: '1.4x', icon: <CheckCircle2 size={13} />, color: 'hsl(142 71% 45%)' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                  <span className="text-xs text-text-secondary flex-1">{s.label}</span>
                  <span className="text-sm font-bold font-display" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
