import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  // Only allow users with the 'ADMIN' role to access any route within /dashboard/admin
  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
