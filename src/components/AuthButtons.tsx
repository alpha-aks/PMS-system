'use client';

import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function AuthButtons() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    // Skeleton while Clerk loads
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-20 rounded-lg shimmer-bg" />
        <div className="h-8 w-28 rounded-lg shimmer-bg" />
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="btn-primary py-2 px-4 text-sm"
        >
          Go to Dashboard
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8 ring-2 ring-brand-primary ring-offset-2 ring-offset-surface-base',
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <SignInButton mode="redirect">
        <button className="btn-ghost py-2 px-4 text-sm">Sign In</button>
      </SignInButton>
      <SignUpButton mode="redirect">
        <button className="btn-primary py-2 px-4 text-sm">Get Started</button>
      </SignUpButton>
    </div>
  );
}
