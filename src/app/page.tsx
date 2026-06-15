import Link from 'next/link';
import { Bot, Zap, Shield, TrendingUp, Users, BarChart2 } from 'lucide-react';
import AuthButtons from '@/components/AuthButtons';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-surface-base flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Gradient orbs */}
      <div
        className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'hsl(234 89% 74%)' }}
      />
      <div
        className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl animate-float"
        style={{ background: 'hsl(271 91% 65%)', animationDelay: '2s' }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: 'hsl(220 20% 14%)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(234 89% 74%), hsl(271 91% 65%))' }}
          >
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-text-primary font-display">BrandBoosters</p>
            <p className="text-[10px] text-text-muted">AI CEO Platform</p>
          </div>
        </div>
        <AuthButtons />
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'hsl(234 89% 74% / 0.1)', border: '1px solid hsl(234 89% 74% / 0.25)', color: 'hsl(234 89% 74%)' }}
        >
          <Zap size={11} />
          Powered by Google Gemini AI
        </div>

        <h1 className="text-5xl md:text-7xl font-black font-display mb-6 leading-tight max-w-5xl">
          Your Agency's{' '}
          <span className="gradient-text">AI CEO</span>
          <br />is Ready
        </h1>

        <p className="text-lg text-text-secondary max-w-2xl mb-10">
          BrandBoosters' intelligent operating system. AI-driven task delegation, real-time productivity tracking, gamified sales pipelines, and Discord-integrated team management — all in one place.
        </p>

        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="btn-primary py-3 px-8 text-base flex items-center gap-2">
            <Zap size={17} />
            Launch Dashboard
          </Link>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-16 max-w-3xl">
          {[
            { icon: <Bot size={15} />, label: 'AI Daily Stand-up', desc: 'Complexity scoring & payout projection' },
            { icon: <Shield size={15} />, label: 'Role-Based Access', desc: '6 custom dashboards per team member' },
            { icon: <TrendingUp size={15} />, label: 'Lead Marketplace', desc: 'Gamified 50/50 daily slot system' },
            { icon: <Users size={15} />, label: 'Discord Bot', desc: 'VC tracking & EOD logging' },
            { icon: <BarChart2 size={15} />, label: 'Payroll Engine', desc: 'AI proposed, admin approved' },
            { icon: <Zap size={15} />, label: 'Content AI', desc: 'Weekly social media scheduler' },
          ].map((f) => (
            <div
              key={f.label}
              className="glass-card p-4 text-left"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: 'hsl(234 89% 74% / 0.1)', color: 'hsl(234 89% 74%)' }}>
                {f.icon}
              </div>
              <p className="text-sm font-semibold text-text-primary">{f.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
