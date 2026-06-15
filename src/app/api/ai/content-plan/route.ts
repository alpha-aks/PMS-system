import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { generateWeeklyContentPlan } from '@/lib/ai/content';
import { ContentStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Must be admin to generate the plan
    const cUser = await currentUser();
    const isClerkAdmin = cUser?.publicMetadata?.role === 'ADMIN';

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    const isDbAdmin = dbUser?.role === 'ADMIN';

    if (!isClerkAdmin && !isDbAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Fetch all active users to generate content for
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, role: true },
    });

    if (allUsers.length === 0) {
      return NextResponse.json({ error: 'No team members found.' }, { status: 400 });
    }

    // 2. Determine the start of the current week (Monday)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const weekStarting = new Date(today.setDate(diff));
    weekStarting.setHours(0, 0, 0, 0);

    // 3. Generate Content
    const plan = await generateWeeklyContentPlan(allUsers);

    // 4. Save to Database
    const records = plan.contentItems.map((item) => ({
      userId: item.userId,
      weekStarting: weekStarting,
      platform: item.platform,
      contentType: item.contentType,
      suggestion: item.suggestion,
      caption: item.caption,
      status: ContentStatus.SUGGESTED,
    }));

    await prisma.contentSchedule.createMany({
      data: records,
    });

    return NextResponse.json({ success: true, count: records.length });
  } catch (error) {
    console.error('Content Generation API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate weekly content plan.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const validStatuses = Object.values(ContentStatus);
    if (!validStatuses.includes(status as ContentStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.contentSchedule.update({
      where: { id },
      data: {
        status: status as ContentStatus,
        publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Content Update API Error:', error);
    return NextResponse.json(
      { error: 'Failed to update content status.' },
      { status: 500 }
    );
  }
}
