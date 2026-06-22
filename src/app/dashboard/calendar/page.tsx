import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import ContentCalendarClient from './ContentCalendarClient';

export const metadata = {
  title: 'Task Calendar | AI CEO',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export default async function ContentCalendarPage() {
  const { userId } = await auth();
  if (!userId) {
    return <div className="p-8 text-center text-text-muted">Unauthorized</div>;
  }

  // Fetch dbUser to get the user's database entry and role
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, name: true, role: true, clerkId: true }
  });

  if (!dbUser) {
    return <div className="p-8 text-center text-text-muted font-semibold">User not found in database.</div>;
  }

  // Fetch all tasks for the calendar
  const tasks = await prisma.task.findMany({
    include: {
      user: {
        select: {
          id: true,
          clerkId: true,
          name: true,
          avatarUrl: true,
          role: true,
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  });

  // Fetch all users to support task assignment (especially for admins)
  const users = await prisma.user.findMany({
    select: {
      id: true,
      clerkId: true,
      name: true,
      role: true,
      avatarUrl: true,
    },
    orderBy: { name: 'asc' }
  });

  return (
    <ContentCalendarClient 
      initialTasks={tasks} 
      currentUser={dbUser}
      users={users}
    />
  );
}
