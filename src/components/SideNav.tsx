'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Settings,
  LogOut,
  Zap,
  ChevronRight,
  Bell,
  Bot,
  FolderGit2,
  CheckSquare,
} from 'lucide-react';
import { cn, ROLE_COLORS, ROLE_LABELS } from '@/lib/utils';

interface NavSection {
  label: string;
  items: {
    icon: React.ReactNode;
    label: string;
    href: string;
    badge?: string;
  }[];
}

const getNavSections = (role: string): NavSection[] => {
  const shared = [
    {
      label: 'Workspace',
      items: [
        ...(role !== 'ADMIN' ? [{ icon: <LayoutDashboard size={16} />, label: 'My Dashboard', href: '/dashboard' }] : []),
        { icon: <FolderGit2 size={16} />, label: 'Client Projects', href: '/dashboard/clients' },
        { icon: <ShoppingBag size={16} />, label: 'Lead Market', href: '/dashboard/market', badge: 'LIVE' },
        { icon: <Calendar size={16} />, label: 'Task Calendar', href: '/dashboard/calendar' },
      ],
    },
  ];

  if (role === 'ADMIN') {
    return [
      {
        label: 'Command Center',
        items: [
          { icon: <LayoutDashboard size={16} />, label: 'Agency Overview', href: '/dashboard' },
          { icon: <Users size={16} />, label: 'Team Management', href: '/dashboard/admin/team' },
          { icon: <CheckSquare size={16} />, label: 'Task Management', href: '/dashboard/admin/tasks' },
          { icon: <TrendingUp size={16} />, label: 'Payroll Approvals', href: '/dashboard/admin/payroll', badge: 'PENDING' },
        ],
      },
      ...shared,
    ];
  }

  return shared;
};

export default function SideNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();

  const role = (user?.publicMetadata?.role as string) || 'OPS';
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.OPS;
  const roleLabel = ROLE_LABELS[role] || 'Team Member';
  const sections = getNavSections(role);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed left-0 top-0 h-screen w-[260px] flex flex-col z-40"
      style={{
        background: 'linear-gradient(180deg, hsl(222 25% 7%) 0%, hsl(220 27% 5%) 100%)',
        borderRight: '1px solid hsl(220 20% 14%)',
      }}
      suppressHydrationWarning
    >
      {/* Logo */}
      <div className="p-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(234 89% 74%), hsl(271 91% 65%))' }}
          >
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary font-display leading-none">BrandBoosters</p>
            <p className="text-[10px] text-text-muted mt-0.5">AI CEO Platform</p>
          </div>
        </Link>
      </div>

      <div className="divider mx-4 my-0" />

      {/* User profile card */}
      <div className="p-4">
        <div
          className="p-3 rounded-xl"
          style={{ background: 'hsl(220 20% 11%)', border: '1px solid hsl(220 20% 16%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.firstName || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: roleColor }}
                >
                  {(user?.firstName?.[0] || '?').toUpperCase()}
                </div>
              )}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: 'hsl(142 71% 45%)', borderColor: 'hsl(220 20% 11%)' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] truncate" style={{ color: roleColor }}>
                {roleLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="section-header px-2 mb-2">{section.label}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn('nav-item relative', isActive && 'active')}
                  >
                    <span className={cn(
                      'transition-colors',
                      isActive ? 'text-brand-primary' : 'text-text-muted'
                    )}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: item.badge === 'PENDING'
                            ? 'hsl(43 96% 56% / 0.15)'
                            : 'hsl(162 100% 50% / 0.15)',
                          color: item.badge === 'PENDING'
                            ? 'hsl(43 96% 56%)'
                            : 'hsl(162 100% 50%)',
                          border: `1px solid ${item.badge === 'PENDING' ? 'hsl(43 96% 56% / 0.3)' : 'hsl(162 100% 50% / 0.3)'}`,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight size={12} className="text-brand-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t" style={{ borderColor: 'hsl(220 20% 14%)' }}>
        <div className="space-y-1">
          <Link href="/dashboard/notifications" className="nav-item">
            <Bell size={16} className="text-text-muted" />
            <span>Notifications</span>
          </Link>
          <Link href="/dashboard/settings" className="nav-item">
            <Settings size={16} className="text-text-muted" />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => signOut({ redirectUrl: '/sign-in' })}
            className="nav-item w-full text-left"
            style={{ color: 'hsl(0 84% 60%)' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* AI CEO status indicator */}
        <div
          className="mt-3 p-2.5 rounded-lg flex items-center gap-2"
          style={{ background: 'hsl(234 89% 74% / 0.08)', border: '1px solid hsl(234 89% 74% / 0.15)' }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'hsl(234 89% 74% / 0.2)' }}
          >
            <Zap size={12} style={{ color: 'hsl(234 89% 74%)' }} />
          </div>
          <div>
            <p className="text-[11px] font-semibold" style={{ color: 'hsl(234 89% 74%)' }}>AI CEO Active</p>
            <p className="text-[10px] text-text-muted">Monitoring performance</p>
          </div>
          <div
            className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'hsl(162 100% 50%)' }}
          />
        </div>
      </div>
    </motion.aside>
  );
}
