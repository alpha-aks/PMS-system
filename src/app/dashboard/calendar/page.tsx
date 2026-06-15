import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import ContentCalendarClient from './ContentCalendarClient';

export const metadata = {
  title: 'Content Calendar | AI CEO',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export default async function ContentCalendarPage() {
  const { userId } = await auth();

  // Determine if admin
  let isAdmin = false;
  if (userId) {
    // First check DB
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });
    if (dbUser?.role === 'ADMIN') isAdmin = true;

    // Fallback to Clerk metadata (matches SideNav logic)
    const cUser = await currentUser();
    if (cUser?.publicMetadata?.role === 'ADMIN') isAdmin = true;

    console.log('--- CALENDAR PAGE DEBUG ---');
    console.log('dbUser role:', dbUser?.role);
    console.log('cUser role:', cUser?.publicMetadata?.role);
    console.log('Final isAdmin:', isAdmin);
  }

  // Determine current week
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const weekStarting = new Date(today.setDate(diff));
  weekStarting.setHours(0, 0, 0, 0);

  // Fetch current week's content schedule
  const items = await prisma.contentSchedule.findMany({
    where: {
      weekStarting: weekStarting,
    },
    include: {
      user: {
        select: { name: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <ContentCalendarClient initialItems={items} isAdmin={isAdmin} />;
}
