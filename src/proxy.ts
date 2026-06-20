import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/cron(.*)',
]);

const roleRoutes: Record<string, string[]> = {
  '/dashboard/admin': ['ADMIN'],
  '/dashboard/dev': ['ADMIN', 'DEV'],
  '/dashboard/tech': ['ADMIN', 'TECH'],
  '/dashboard/design': ['ADMIN', 'DESIGN'],
  '/dashboard/video': ['ADMIN', 'VIDEO'],
  '/dashboard/ops': ['ADMIN', 'OPS'],
};

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role as string | undefined;
  const pathname = req.nextUrl.pathname;

  // Redirect root to dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect exact legacy dashboards to the consolidated universal dashboard
  const legacyDashboards = [
    '/dashboard/admin',
    '/dashboard/dev',
    '/dashboard/tech',
    '/dashboard/design',
    '/dashboard/video',
    '/dashboard/ops',
  ];
  if (legacyDashboards.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Enforce route-level role access
  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};

