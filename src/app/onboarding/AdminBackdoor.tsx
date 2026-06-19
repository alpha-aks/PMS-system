'use client';

import { useState } from 'react';
import { updateUserRole } from '@/app/actions/user';
import { useSession } from '@clerk/nextjs';
import { Loader2, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminBackdoor() {
  const [loading, setLoading] = useState(false);
  const { session } = useSession();
  const router = useRouter();

  const handleMakeAdmin = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      await updateUserRole(session.user.id, 'ADMIN');
      // Force Clerk to refresh the JWT token with the new role!
      await session.reload();
      // Now redirect!
      window.location.href = '/dashboard/admin';
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMakeAdmin}
      disabled={loading}
      className="mt-6 flex items-center gap-2 px-4 py-2 mx-auto rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
      style={{ border: '1px dashed hsl(43 96% 56% / 0.5)', color: 'hsl(43 96% 56%)' }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
      {loading ? 'Assigning Role...' : 'Developer Override: Make me Master Admin'}
    </button>
  );
}
