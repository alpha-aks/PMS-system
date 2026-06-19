'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function createNotification(clerkId: string, title: string, message: string) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId }
    });
    if (!dbUser) return { success: false, error: 'User not found' };

    const id = `notif_${randomUUID().replace(/-/g, '')}`;
    
    // Use raw query to bypass any EPERM/generation typescript limits
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Notification" ("id", "userId", "title", "message", "read", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      id,
      dbUser.id,
      title,
      message,
      false,
      new Date()
    );

    revalidatePath('/dashboard/notifications');
    return { success: true };
  } catch (error) {
    console.error('Failed to create notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

export async function getUserNotifications(clerkId: string) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId }
    });
    if (!dbUser) return [];

    const notifications: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Notification" 
       WHERE "userId" = $1 
       ORDER BY "createdAt" DESC`,
      dbUser.id
    );

    return notifications;
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Notification" 
       SET "read" = true 
       WHERE "id" = $1`,
      notificationId
    );
    revalidatePath('/dashboard/notifications');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark notification read:', error);
    return { success: false };
  }
}

export async function markAllNotificationsRead(clerkId: string) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId }
    });
    if (!dbUser) return { success: false };

    await prisma.$executeRawUnsafe(
      `UPDATE "Notification" 
       SET "read" = true 
       WHERE "userId" = $1`,
      dbUser.id
    );
    revalidatePath('/dashboard/notifications');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark all notifications read:', error);
    return { success: false };
  }
}
