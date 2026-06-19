'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

import { ensureUserInDb } from './user';
import { createNotification } from './notification';

export async function adminAssignTask(clerkId: string, title: string, description: string, dueDate: Date | null) {
  try {
    const dbUser = await ensureUserInDb(clerkId);

    const task = await prisma.task.create({
      data: {
        userId: dbUser.id,
        title,
        description,
        dueDate,
        tags: ['ADMIN'],
      }
    });

    // Send task notification to user
    await createNotification(clerkId, 'New Task Assigned', `You have been assigned a new task: "${title}".`);

    revalidatePath('/dashboard/admin/team');
    revalidatePath('/dashboard/admin/tasks');
    return { success: true, task };
  } catch (error) {
    console.error('Failed to assign task:', error);
    throw new Error('Failed to assign task');
  }
}

export async function adminUpdateTaskStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE') {
  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { 
        status,
        completedAt: status === 'DONE' ? new Date() : null,
      }
    });
    revalidatePath('/dashboard/admin/tasks');
    return { success: true, task };
  } catch (error) {
    console.error('Failed to update task status:', error);
    throw new Error('Failed to update task status');
  }
}

export async function adminDeleteTask(taskId: string) {
  try {
    await prisma.task.delete({
      where: { id: taskId }
    });
    revalidatePath('/dashboard/admin/tasks');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete task:', error);
    throw new Error('Failed to delete task');
  }
}

export async function getUserTasks(clerkId: string) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId }
    });
    if (!dbUser) return [];

    const tasks = await prisma.task.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' }
    });
    return tasks;
  } catch (error) {
    console.error('Failed to get user tasks:', error);
    return [];
  }
}

export async function userUpdateTaskStatus(
  taskId: string, 
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE',
  blockerReason?: string
) {
  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === 'DONE' ? new Date() : null,
        blockedAt: status === 'BLOCKED' ? new Date() : null,
        blockerReason: status === 'BLOCKED' ? (blockerReason || 'No reason specified') : null,
      }
    });
    revalidatePath('/dashboard/admin/tasks');
    return { success: true, task };
  } catch (error) {
    console.error('Failed to update user task status:', error);
    throw new Error('Failed to update task status');
  }
}
