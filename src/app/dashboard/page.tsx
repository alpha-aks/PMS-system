import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import UniversalDashboard from '@/components/UniversalDashboard';

export default async function DashboardPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const validRoles = ['ADMIN', 'DEV', 'TECH', 'DESIGN', 'VIDEO', 'OPS'];
  if (!role || !validRoles.includes(role)) {
    redirect('/onboarding');
  }

  if (role === 'ADMIN') {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Fetch all agency users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Fetch ALL standups for this month
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

    // Construct Team Member Data
    const teamData = users.map(user => {
      const allUserStandups = userStandups.get(user.id) || [];
      const todayStandup = todaysStandupMap.get(user.id);
      
      const displayName = user.alias || user.name || 'Unknown User';

      const totalMonthEffort = allUserStandups.reduce((sum, s) => sum + (s.targetWeight || 0), 0);
      const avgMonthEffort = allUserStandups.length > 0 ? totalMonthEffort / allUserStandups.length : 0;

      const estMonthPay = avgMonthEffort * user.monthlySalary;

      return {
        id: user.clerkId,
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

    return <UniversalDashboard role="ADMIN" initialTeam={teamData} />;
  }

  return <UniversalDashboard role={role as any} />;
}
