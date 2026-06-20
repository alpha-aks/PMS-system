'use server';

import { clerkClient, auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

export type UserRole = 'ADMIN' | 'DEV' | 'TECH' | 'DESIGN' | 'VIDEO' | 'OPS';

export interface UserData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string;
  role: UserRole | null;
  createdAt: number;
  alias: string | null;
  monthlySalary: number;
}

export async function getAllUsers(): Promise<UserData[]> {
  try {
    const client = await clerkClient();
    const response = await client.users.getUserList({
      limit: 100,
    });

    const dbUsers = await prisma.user.findMany();
    const dbUserMap = new Map(dbUsers.map(u => [u.clerkId, u]));

    const users = response.data.map((u) => {
      const email = u.emailAddresses[0]?.emailAddress || 'No Email';
      const role = (u.publicMetadata.role as UserRole) || null;
      const dbUser = dbUserMap.get(u.id);

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email,
        imageUrl: u.imageUrl,
        role,
        createdAt: u.createdAt,
        alias: dbUser?.alias || null,
        monthlySalary: dbUser?.monthlySalary || 0,
      };
    });

    return users.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Failed to fetch users from Clerk:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function updateUserRole(userId: string, role: UserRole) {
  try {
    const { userId: callerId } = await auth();
    if (!callerId) throw new Error('Unauthorized');
    
    const caller = await prisma.user.findUnique({ where: { clerkId: callerId } });
    if (caller?.role !== 'ADMIN') throw new Error('Forbidden: Only admins can change roles');

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role,
      },
    });

    revalidatePath('/dashboard/admin/team');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user role:', error);
    throw new Error('Failed to update user role');
  }
}

export async function ensureUserInDb(clerkId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId }
  });
  if (dbUser) return dbUser;

  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const role = (clerkUser.publicMetadata.role as UserRole) || 'DEV';

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown User',
        role: role as any,
        monthlySalary: 0,
        avatarUrl: clerkUser.imageUrl,
      }
    });
    return newUser;
  } catch (error) {
    console.error('Failed to auto-create user in DB from Clerk:', error);
    throw new Error('Failed to synchronize user with DB');
  }
}

export async function updateUserAlias(clerkId: string, alias: string | null) {
  try {
    await ensureUserInDb(clerkId);
    await prisma.user.update({
      where: { clerkId },
      data: { alias },
    });
    revalidatePath('/dashboard/admin/team');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user alias:', error);
    throw new Error('Failed to update user alias');
  }
}

export async function updateUserName(clerkId: string, name: string) {
  try {
    await ensureUserInDb(clerkId);
    
    // Split name into first and last name for Clerk
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Update in database
    await prisma.user.update({
      where: { clerkId },
      data: { name },
    });

    // Update in Clerk
    const client = await clerkClient();
    await client.users.updateUser(clerkId, {
      firstName,
      lastName: lastName || undefined,
    });

    revalidatePath('/dashboard/admin/team');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user name:', error);
    throw new Error('Failed to update name');
  }
}

export async function getUserProfile(clerkId: string) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        projects: true
      }
    });
    return dbUser;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

export async function updateUserDiscordId(clerkId: string, discordId: string | null) {
  try {
    await ensureUserInDb(clerkId);
    await prisma.user.update({
      where: { clerkId },
      data: { discordId },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to update user discordId:', error);
    throw new Error('Failed to update discord ID');
  }
}

export async function updateUserMonthlySalary(clerkId: string, monthlySalary: number) {
  try {
    await ensureUserInDb(clerkId);
    await prisma.user.update({
      where: { clerkId },
      data: { monthlySalary },
    });
    revalidatePath('/dashboard/admin/team');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user monthly salary:', error);
    throw new Error('Failed to update user monthly salary');
  }
}

export async function getUserDashboardStats() {
  const { userId } = await auth();
  if (!userId) return null;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId }
  });

  if (!dbUser) return null;

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const todayStandup = await prisma.dailyStandup.findFirst({
    where: {
      userId: dbUser.id,
      date: { gte: todayStart, lte: todayEnd }
    }
  });

  return {
    monthlySalary: dbUser.monthlySalary,
    todayPct: todayStandup?.targetWeight || 0
  };
}

export async function overrideTodayPercentage(clerkId: string, percentage: number) {
  const dbUser = await prisma.user.findUnique({
    where: { clerkId }
  });
  if (!dbUser) throw new Error('User not found');

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const standup = await prisma.dailyStandup.findFirst({
    where: {
      userId: dbUser.id,
      date: { gte: todayStart, lte: todayEnd }
    }
  });

  if (standup) {
    await prisma.dailyStandup.update({
      where: { id: standup.id },
      data: { targetWeight: percentage, completionPct: percentage, adminApproved: true }
    });
  } else {
    await prisma.dailyStandup.create({
      data: {
        userId: dbUser.id,
        date: new Date(),
        plannedTasksRaw: 'Admin Manual Override',
        complexityScore: 1,
        targetWeight: percentage,
        completionPct: percentage,
        adminApproved: true,
        aiSuggestions: 'Percentage was manually computed/overridden by the Admin.'
      }
    });
  }
  
  revalidatePath('/dashboard/admin');
  return { success: true };
}
