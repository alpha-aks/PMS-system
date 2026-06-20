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

export async function pruneCompletedTasks() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await prisma.task.deleteMany({
      where: {
        status: 'DONE',
        completedAt: {
          lt: twentyFourHoursAgo,
        },
      },
    });
    if (result.count > 0) {
      console.log(`Pruned ${result.count} completed task(s) older than 24 hours.`);
      revalidatePath('/dashboard/admin/tasks');
    }
  } catch (error) {
    console.error('Failed to prune completed tasks:', error);
  }
}

export async function getUserTasks(clerkId: string) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId }
    });
    if (!dbUser) return [];

    // Automatically prune any completed tasks older than 24 hours
    await pruneCompletedTasks();

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

export async function sendWorkReportToDiscord(
  taskId: string,
  taskTitle: string,
  userEmail: string,
  userName: string,
  reportText: string,
  proofUrl: string,
  timeSpent?: string
) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn("DISCORD_WEBHOOK_URL is not set in environment variables");
      return { success: false, error: "Discord webhook not configured." };
    }

    const fields: any[] = [
      { name: "Task Title", value: taskTitle || "N/A", inline: false },
      { name: "Task ID", value: taskId || "N/A", inline: true },
      { name: "Submitted By", value: `${userName} (${userEmail})`, inline: true },
    ];

    if (timeSpent) {
      fields.push({ name: "⏱️ Time Spent", value: timeSpent, inline: true });
    }

    fields.push(
      { name: "Report of Work", value: reportText || "No description provided.", inline: false },
      { name: "Proof of Work / Link", value: proofUrl || "No proof links provided.", inline: false }
    );

    const payload = {
      username: "BrandBoosters PMS Bot",
      avatar_url: "https://brandboosters.in/wp-content/uploads/2023/07/logo.png",
      embeds: [
        {
          title: "🚀 Work Report & Proof of Work Submitted",
          color: 0x4f46e5, // indigo / #4f46e5
          fields,
          timestamp: new Date().toISOString(),
          footer: {
            text: "BrandBoosters Project Management System"
          }
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send webhook to Discord:", errorText);
      return { success: false, error: "Failed to send message to Discord." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending Discord webhook:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
