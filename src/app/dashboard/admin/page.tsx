import { prisma } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export default async function AdminDashboardPage() {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  // 1. Fetch all agency users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
  });

  // 2. Fetch ALL standups for this month
  const monthStandups = await prisma.dailyStandup.findMany({
    where: {
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  // Group standups by user
  const userStandups = new Map<string, typeof monthStandups>();
  const todaysStandupMap = new Map<string, typeof monthStandups[0]>();

  for (const s of monthStandups) {
    if (!userStandups.has(s.userId)) userStandups.set(s.userId, []);
    userStandups.get(s.userId)!.push(s);

    if (s.date >= todayStart && s.date <= todayEnd) {
      todaysStandupMap.set(s.userId, s);
    }
  }

  // 3. Construct Team Member Data for the client
  const teamData = users.map(user => {
    const allUserStandups = userStandups.get(user.id) || [];
    const todayStandup = todaysStandupMap.get(user.id);
    
    // Fallback to alias if present, else use name
    const displayName = user.alias || user.name || 'Unknown User';

    // Calculate month average effort
    const totalMonthEffort = allUserStandups.reduce((sum, s) => sum + (s.targetWeight || 0), 0);
    const avgMonthEffort = allUserStandups.length > 0 ? totalMonthEffort / allUserStandups.length : 0;

    // Projected Monthly Pay = Average Month Effort * Monthly Salary
    const estMonthPay = avgMonthEffort * user.monthlySalary;

    return {
      id: user.clerkId, // Using clerkId as stable key for UI
      standupId: todayStandup ? todayStandup.id : null,
      name: displayName,
      role: user.role,
      monthlySalary: user.monthlySalary,
      todayEffort: todayStandup?.targetWeight || 0,
      avgMonthEffort: avgMonthEffort,
      estMonthPay: estMonthPay,
      approved: todayStandup?.adminApproved || false,
    };
  });

  return <AdminDashboardClient initialTeam={teamData} />;
}
