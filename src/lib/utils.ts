import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays } from 'date-fns';

// ─── CSS class merger ─────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency formatting ──────────────────────────────────────────────────────
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Percentage formatting ────────────────────────────────────────────────────
export function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// ─── GST alert utilities ──────────────────────────────────────────────────────
export type GSTAlertLevel = 'safe' | 'caution' | 'warning' | 'danger' | 'critical';

export interface GSTStatus {
  filingDaysLeft: number;
  paymentDaysLeft: number;
  filingLevel: GSTAlertLevel;
  paymentLevel: GSTAlertLevel;
  filingDate: string;
  paymentDate: string;
}

function getAlertLevel(daysLeft: number): GSTAlertLevel {
  if (daysLeft <= 0) return 'critical';
  if (daysLeft <= 1) return 'critical';
  if (daysLeft <= 3) return 'danger';
  if (daysLeft <= 5) return 'warning';
  if (daysLeft <= 7) return 'caution';
  return 'safe';
}

export function getGSTStatus(): GSTStatus {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Filing due: 10th of current month (for previous month's GST)
  const filingDate = new Date(year, month, 10);
  // Payment due: 20th of current month
  const paymentDate = new Date(year, month, 20);

  // If we're past the date, calculate for next month's cycle
  const filingTarget = now > filingDate
    ? new Date(year, month + 1, 10)
    : filingDate;
  const paymentTarget = now > paymentDate
    ? new Date(year, month + 1, 20)
    : paymentDate;

  const filingDaysLeft = differenceInDays(filingTarget, now);
  const paymentDaysLeft = differenceInDays(paymentTarget, now);

  return {
    filingDaysLeft,
    paymentDaysLeft,
    filingLevel: getAlertLevel(filingDaysLeft),
    paymentLevel: getAlertLevel(paymentDaysLeft),
    filingDate: format(filingTarget, 'MMM d, yyyy'),
    paymentDate: format(paymentTarget, 'MMM d, yyyy'),
  };
}

// ─── Complexity weight formula ────────────────────────────────────────────────
export interface ComplexityFactors {
  cognitiveLoad: number;   // 0-10
  timeEstimateHours: number;
  revenueImpact: number;   // 0-10
  verifiabilityScore: number; // 0-10
}

export function calculateComplexityWeight(factors: ComplexityFactors): number {
  const { cognitiveLoad, timeEstimateHours, revenueImpact, verifiabilityScore } = factors;
  const normalizedTime = Math.min(timeEstimateHours / 8, 1) * 10; // normalize to 0-10
  return (
    (cognitiveLoad * 0.35) +
    (normalizedTime * 0.30) +
    (revenueImpact * 0.20) +
    (verifiabilityScore * 0.15)
  ) / 10; // normalize to 0-1
}

// ─── Daily payout calculation ─────────────────────────────────────────────────
export function calculateDailyPayout(
  dailyRate: number,
  completionPct: number,
  bonusMultiplier: number = 1.0
): number {
  const base = dailyRate * Math.min(completionPct, 1.0);
  // Bonus for exceeding 100%: 10% bonus for each 10% over target
  const overage = Math.max(0, completionPct - 1.0);
  const bonus = overage > 0 ? dailyRate * overage * 0.5 * bonusMultiplier : 0;
  return Math.round(base + bonus);
}

// ─── Role display helpers ─────────────────────────────────────────────────────
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Master Admin',
  DEV: 'Web Dev & Accounts',
  TECH: 'Tech & Lead Gen',
  DESIGN: 'Graphic Design',
  VIDEO: 'Video Editing',
  OPS: 'Operations',
};

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'hsl(43 96% 56%)',       // Gold
  DEV: 'hsl(234 89% 74%)',        // Blue
  TECH: 'hsl(271 91% 65%)',       // Violet
  DESIGN: 'hsl(320 80% 65%)',     // Pink
  VIDEO: 'hsl(14 90% 60%)',       // Orange
  OPS: 'hsl(162 100% 50%)',       // Mint
};

export const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/dashboard/admin',
  DEV: '/dashboard/dev',
  TECH: '/dashboard/tech',
  DESIGN: '/dashboard/design',
  VIDEO: '/dashboard/video',
  OPS: '/dashboard/ops',
};

// ─── Time formatting ──────────────────────────────────────────────────────────
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
