'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getClientProjects() {
  return await prisma.clientProject.findMany({
    include: {
      assignedUsers: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function createClientProject(name: string, description: string) {
  try {
    const project = await prisma.clientProject.create({
      data: {
        name,
        description,
      },
    });
    revalidatePath('/dashboard/clients');
    return { success: true, project };
  } catch (error) {
    console.error('Failed to create project:', error);
    throw new Error('Failed to create client project.');
  }
}

export async function assignUserToProject(projectId: string, userId: string) {
  try {
    await prisma.clientProject.update({
      where: { id: projectId },
      data: {
        assignedUsers: {
          connect: { id: userId },
        },
      },
    });
    revalidatePath('/dashboard/clients');
    return { success: true };
  } catch (error) {
    console.error('Failed to assign user:', error);
    throw new Error('Failed to assign user to project.');
  }
}

export async function removeUserFromProject(projectId: string, userId: string) {
  try {
    await prisma.clientProject.update({
      where: { id: projectId },
      data: {
        assignedUsers: {
          disconnect: { id: userId },
        },
      },
    });
    revalidatePath('/dashboard/clients');
    return { success: true };
  } catch (error) {
    console.error('Failed to remove user:', error);
    throw new Error('Failed to remove user from project.');
  }
}
