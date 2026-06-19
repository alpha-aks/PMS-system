'use client';

import { useState, useEffect, useTransition } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserProfile, updateUserAlias, updateUserDiscordId } from '@/app/actions/user';
import { Settings, User, Shield, DollarSign, MessageSquare, Loader2, Save, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [alias, setAlias] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      try {
        const data = await getUserProfile(user.id);
        if (data) {
          setProfile(data);
          setAlias(data.alias || '');
          setDiscordId(data.discordId || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaveSuccess(false);
    startTransition(async () => {
      try {
        await updateUserAlias(user.id, alias.trim() || null);
        await updateUserDiscordId(user.id, discordId.trim() || null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        alert('Failed to save settings.');
      }
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'hsl(234 89% 74% / 0.15)', color: 'hsl(234 89% 74%)' }}
          >
            <Settings size={20} />
          </div>
          <h1 className="text-2xl font-bold font-display text-text-primary">Profile Settings</h1>
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          Configure your personal details and platform preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Profile Card Info (Read-only) */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-text-primary border-b pb-2 mb-3" style={{ borderColor: 'hsl(220 20% 14%)' }}>
            Account Overview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Full Name</span>
              <div className="flex items-center gap-2 text-sm text-text-primary bg-bg-dark/40 px-3 py-2 rounded-xl border border-white/5">
                <User size={14} className="text-text-muted" />
                <span>{profile?.name || user?.fullName || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Email Address</span>
              <div className="flex items-center gap-2 text-sm text-text-primary bg-bg-dark/40 px-3 py-2 rounded-xl border border-white/5">
                <User size={14} className="text-text-muted" />
                <span>{profile?.email || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Role</span>
              <div className="flex items-center gap-2 text-sm text-text-primary bg-bg-dark/40 px-3 py-2 rounded-xl border border-white/5">
                <Shield size={14} className="text-text-muted" />
                <span className="uppercase text-xs font-semibold text-accent-primary">{profile?.role || 'DEV'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Monthly Salary Rate</span>
              <div className="flex items-center gap-2 text-sm text-text-primary bg-bg-dark/40 px-3 py-2 rounded-xl border border-white/5">
                <DollarSign size={14} className="text-text-muted" />
                <span>₹{profile?.monthlySalary?.toLocaleString('en-IN') || '0'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customizable Preferences */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-text-primary border-b pb-2 mb-3" style={{ borderColor: 'hsl(220 20% 14%)' }}>
            Custom Preferences
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary font-semibold">
                Display Alias
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="e.g. Nickname or display name..."
                className="w-full bg-bg-dark/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-all"
              />
              <p className="text-[10px] text-text-muted">
                Overrides your full Clerk name in internal team lists and dashboard widgets.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary font-semibold">
                Discord User ID
              </label>
              <div className="relative">
                <MessageSquare size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                  placeholder="e.g. 102435492193850123"
                  className="w-full bg-bg-dark/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-all"
                />
              </div>
              <p className="text-[10px] text-text-muted">
                Used to match standups, log payroll bonuses, or trigger webhook alerts.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 justify-end pt-2">
          {saveSuccess && (
            <span className="text-emerald-400 text-xs flex items-center gap-1.5 animate-pulse">
              <CheckCircle size={14} />
              Settings saved successfully!
            </span>
          )}
          
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
