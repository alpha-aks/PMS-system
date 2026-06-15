import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { analyzeStandup } from '@/lib/ai/standup';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rawText, role } = await req.json();

    if (!rawText || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: rawText, role' },
        { status: 400 }
      );
    }

    // 1. Fetch user from DB to get their monthly salary and assigned projects
    let dbUser = await prisma.user.findUnique({ 
      where: { clerkId: userId },
      include: { projects: true } 
    });
    const monthlySalary = dbUser?.monthlySalary || 0;
    const assignedProjects = dbUser?.projects || [];

    // 2. Analyze using Google Gemini SDK
    const analysis = await analyzeStandup(rawText, role, monthlySalary, assignedProjects);

    // 3. Sync user to Prisma if they don't exist
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    
    const upsertedUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        role: role as UserRole,
        avatarUrl: clerkUser.imageUrl,
      },
      create: {
        clerkId: userId,
        email,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        role: role as UserRole,
        monthlySalary: 0,
        avatarUrl: clerkUser.imageUrl,
      },
    });

    // 3. Save DailyStandup to DB
    const standup = await prisma.dailyStandup.create({
      data: {
        userId: upsertedUser.id,
        plannedTasksRaw: rawText,
        complexityScore: analysis.totalComplexityWeight,
        targetWeight: analysis.targetPercentage / 100,
        aiSuggestions: analysis.aiSummary,
        projectedPayout: analysis.projectedPayout,
      },
    });

    // 4. Save individual Tasks to DB
    for (const task of analysis.tasks) {
      await prisma.task.create({
        data: {
          userId: upsertedUser.id,
          title: task.title,
          description: task.suggestions,
          complexityWeight: task.complexityWeight,
          estimatedHours: task.estimatedHours,
          tags: [task.category],
        },
      });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Standup API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze standup or save to DB.' },
      { status: 500 }
    );
  }
}
