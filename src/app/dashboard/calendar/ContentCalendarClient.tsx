'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Loader2, CheckCircle2, Sparkles, Video, Camera, Briefcase, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ContentStatus, ContentPlatform, ContentSchedule } from '@prisma/client';
import toast from 'react-hot-toast';

type ContentItemWithUser = ContentSchedule & { user: { name: string; avatarUrl: string | null } };

export default function ContentCalendarClient({ initialItems, isAdmin }: { initialItems: ContentItemWithUser[]; isAdmin: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<ContentItemWithUser[]>(initialItems);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/content-plan', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate plan');
      toast.success('Weekly Content Plan Generated!');
      router.refresh();
    } catch (error) {
      toast.error('Failed to generate plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ContentStatus) => {
    // Optimistic update
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
    try {
      const res = await fetch('/api/ai/content-plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update status');
      // Revert optimistic update
      setItems(initialItems);
    }
  };

  const getPlatformIcon = (platform: ContentPlatform) => {
    switch (platform) {
      case 'YOUTUBE': return <Video size={16} className="text-red-500" />;
      case 'INSTAGRAM': return <Camera size={16} className="text-pink-500" />;
      case 'LINKEDIN': return <Briefcase size={16} className="text-blue-500" />;
      default: return null;
    }
  };

  const columns = [
    { id: ContentStatus.SUGGESTED, title: 'AI Suggestions', color: 'border-purple-500/30' },
    { id: ContentStatus.APPROVED, title: 'Approved / Production', color: 'border-blue-500/30' },
    { id: ContentStatus.PUBLISHED, title: 'Published', color: 'border-green-500/30' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(271 91% 65% / 0.15)', color: 'hsl(271 91% 65%)' }}
            >
              <CalendarIcon size={20} />
            </div>
            <h1 className="text-2xl font-bold font-display text-text-primary">Content Calendar</h1>
          </div>
          <p className="text-text-secondary text-sm">
            AI-generated weekly social media plans.
          </p>
        </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Weekly Plan
              </>
            )}
          </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colItems = items.filter((item) => item.status === col.id);
          return (
            <div key={col.id} className={`glass-panel p-4 border-t-4 ${col.color} flex flex-col h-full`}>
              <h3 className="font-bold text-text-primary mb-4">{col.title} ({colItems.length})</h3>
              
              <div className="flex-1 space-y-4">
                {colItems.length === 0 ? (
                  <div className="text-center p-8 text-text-muted text-sm border border-dashed border-white/10 rounded-xl">
                    No items here
                  </div>
                ) : (
                  colItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-bg-dark border border-white/5 p-4 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-bg-secondary flex items-center justify-center overflow-hidden">
                            {item.user.avatarUrl ? (
                              <img src={item.user.avatarUrl} alt={item.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-text-secondary">{item.user.name[0]}</span>
                            )}
                          </div>
                          <span className="text-xs text-text-secondary">{item.user.name}</span>
                        </div>
                        {getPlatformIcon(item.platform)}
                      </div>
                      
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-accent-primary font-bold">{item.contentType}</span>
                        <p className="text-sm text-text-primary mt-1 line-clamp-3">{item.suggestion}</p>
                      </div>

                      {item.caption && (
                        <p className="text-xs text-text-muted italic line-clamp-2">"{item.caption}"</p>
                      )}

                      <div className="pt-2 border-t border-white/5 flex gap-2">
                        {item.status === 'SUGGESTED' && (
                          <button 
                            onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                            className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors w-full justify-center p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20"
                          >
                            Approve <ArrowRight size={12} />
                          </button>
                        )}
                        {item.status === 'APPROVED' && (
                          <button 
                            onClick={() => handleUpdateStatus(item.id, 'PUBLISHED')}
                            className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors w-full justify-center p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20"
                          >
                            Publish <CheckCircle2 size={12} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
