import SideNav from '@/components/SideNav';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ClientOnly from '@/components/ClientOnly';
import { ensureUserInDb } from '@/app/actions/user';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  await ensureUserInDb(userId);

  return (
    <ClientOnly>
      <div className="flex min-h-screen bg-surface-base" suppressHydrationWarning>
        {/* Fixed sidebar */}
        <SideNav />

        {/* Main content */}
        <main
          className="flex-1 min-h-screen overflow-auto"
          style={{ marginLeft: '260px' }}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </ClientOnly>
  );
}
