'use server'

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface TodoList {
  name: string;
  isCompleted: boolean;
  items: Array<{
    name: string;
    notes?: string;
    deadline?: string;
    isCompleted: boolean;
    subItems: Array<{
      name: string;
      isCompleted: boolean;
    }>;
  }>;
}

export async function createTodoList(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const name = formData.get('name') as string;
  if (!name) throw new Error('Name is required');
  
  const list = await prisma.todoList.create({
    data: {
      name,
      user: {
        connect: {
          id: user.userId
        }
      },
      messages: {
        create: []
      }
    },
    include: {
      user: true,
      items: true,
      checkIns: true,
      messages: true,
    },
  });

  revalidatePath('/dashboard');
  return list;
}

export async function addChatMessage(
  todoListId: string,
  role: 'system' | 'user' | 'assistant',
  content: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Verify the todo list belongs to the user
  const todoList = await prisma.todoList.findFirst({
    where: {
      id: todoListId,
      userId: user.userId,
    },
  });

  if (!todoList) {
    throw new Error('Todo list not found or access denied');
  }

  const message = await prisma.chatMessage.create({
    data: {
      role,
      content,
      todoListId,
    },
  });

  revalidatePath('/dashboard');
  return message;
}

export async function updateTodoList(
  todoListId: string, 
  updatedList: TodoList
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  if (!todoListId || !updatedList) {
    throw new Error('Invalid input data');
  }

  // Verify the todo list belongs to the user
  const todoList = await prisma.todoList.findFirst({
    where: {
      id: todoListId,
      userId: user.userId,
    },
  });

  if (!todoList) {
    throw new Error('Todo list not found or access denied');
  }

  try {
    // Start a transaction to update both list and chat history
    const result = await prisma.$transaction(async (tx) => {
      // Update the list and items
      const list = await tx.todoList.update({
        where: {
          id: todoListId,
        },
        data: {
          name: updatedList.name,
          isCompleted: updatedList.isCompleted ?? false,
          items: {
            deleteMany: {}, // This will cascade to subItems
            create: updatedList.items?.map(item => ({
              name: item.name,
              notes: item.notes || null,
              deadline: item.deadline ? new Date(item.deadline) : null,
              isCompleted: item.isCompleted ?? false,
              subItems: {
                create: item.subItems?.map(subItem => ({
                  name: subItem.name,
                  isCompleted: subItem.isCompleted ?? false,
                })) || [],
              },
            })) || [],
          },
        },
        include: {
          items: {
            include: {
              subItems: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          messages: true,
        },
      });

      return list;
    });

    revalidatePath('/dashboard');
    return result;
  } catch (error) {
    console.error('Error updating todo list:', error);
    throw new Error('Failed to update todo list');
  }
}

export async function deleteTodoList(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  try {
    // First delete all related records
    await prisma.$transaction([
      // Delete all sub-items
      prisma.subItem.deleteMany({
        where: {
          item: {
            todoListId: id,
          },
        },
      }),
      // Delete all items
      prisma.item.deleteMany({
        where: {
          todoListId: id,
        },
      }),
      // Delete all messages
      prisma.chatMessage.deleteMany({
        where: {
          todoListId: id,
        },
      }),
      // Delete the list itself
      prisma.todoList.deleteMany({
        where: {
          id,
          userId: user.userId,
        },
      }),
    ]);
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting list:', error);
    throw new Error('Failed to delete list');
  }
}