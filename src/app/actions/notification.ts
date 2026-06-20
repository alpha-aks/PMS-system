'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

interface InMemoryNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const globalForNotifications = globalThis as unknown as {
  notifications: InMemoryNotification[] | undefined;
};

if (!globalForNotifications.notifications) {
  globalForNotifications.notifications = [];
}

function cleanExpiredNotifications() {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (globalForNotifications.notifications) {
    globalForNotifications.notifications = globalForNotifications.notifications.filter(
      (notif) => now - new Date(notif.createdAt).getTime() < twentyFourHours
    );
  }
}

export async function createNotification(clerkId: string, title: string, message: string) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId }
    });
    if (!dbUser) return { success: false, error: 'User not found' };

    const id = `notif_${randomUUID().replace(/-/g, '')}`;
    
    cleanExpiredNotifications();

    globalForNotifications.notifications!.push({
      id,
      userId: dbUser.id,
      title,
      message,
      read: false,
      createdAt: new Date()
    });

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

    cleanExpiredNotifications();

    const notifications = globalForNotifications.notifications!
      .filter(n => n.userId === dbUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return notifications;
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    cleanExpiredNotifications();

    const notif = globalForNotifications.notifications!.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
    }

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

    cleanExpiredNotifications();

    globalForNotifications.notifications!.forEach(n => {
      if (n.userId === dbUser.id) {
        n.read = true;
      }
    });

    revalidatePath('/dashboard/notifications');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark all notifications read:', error);
    return { success: false };
  }
}
