'use client';

import { useState, useEffect, useTransition } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  getUserNotifications, 
  markNotificationRead, 
  markAllNotificationsRead 
} from '@/app/actions/notification';
import { Bell, Check, Loader2, Mail, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export default function NotificationsPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      const data = await getUserNotifications(user.id);
      const mapped = data.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));
      setNotifications(mapped);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const res = await markNotificationRead(id);
      if (res.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      }
    });
  };

  const handleMarkAllRead = () => {
    if (!user?.id) return;
    startTransition(async () => {
      const res = await markAllNotificationsRead(user.id);
      if (res.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
      }
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(234 89% 74% / 0.15)', color: 'hsl(234 89% 74%)' }}
            >
              <Bell size={20} />
            </div>
            <h1 className="text-2xl font-bold font-display text-text-primary">Notifications</h1>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-xs font-semibold px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-text-primary hover:text-white transition-all flex items-center gap-1.5"
          >
            <Check size={13} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="glass-card p-12 text-center text-text-muted text-sm border border-dashed border-white/10 rounded-2xl">
            You don't have any notifications yet.
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((notif) => {
              const isAiTask = notif.title.includes('AI');
              const isNewTask = notif.title.includes('New Task');

              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl border transition-all duration-200 relative group flex items-start gap-4"
                  style={{
                    background: notif.read ? 'hsl(220 20% 8%)' : 'hsl(220 20% 11%)',
                    borderColor: notif.read ? 'hsl(220 20% 12%)' : 'hsl(220 20% 18%)',
                  }}
                >
                  {/* Status Unread Glow indicator */}
                  {!notif.read && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                      style={{ background: 'hsl(234 89% 74%)' }}
                    />
                  )}

                  {/* Icon depending on notification type */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: isAiTask 
                        ? 'hsl(142 71% 45% / 0.1)' 
                        : isNewTask 
                        ? 'hsl(271 91% 65% / 0.1)' 
                        : 'hsl(220 10% 20% / 0.3)',
                      color: isAiTask 
                        ? 'hsl(142 71% 45%)' 
                        : isNewTask 
                        ? 'hsl(271 91% 65%)' 
                        : 'hsl(220 10% 60%)',
                    }}
                  >
                    {isAiTask ? (
                      <Sparkles size={16} />
                    ) : isNewTask ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Mail size={16} />
                    )}
                  </div>

                  {/* Content details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className={`text-sm font-bold ${notif.read ? 'text-text-secondary' : 'text-text-primary'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-text-muted whitespace-nowrap">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* Mark single as read option */}
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-white rounded-lg hover:bg-white/5 transition-all shrink-0 ml-2"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
