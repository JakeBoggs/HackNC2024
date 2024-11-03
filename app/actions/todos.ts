'use server'

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface TodoList {
  name: string;
  isCompleted: boolean;
  items: Array<{
    id?: string;
    name: string;
    notes?: string;
    deadline?: string;
    isCompleted: boolean;
    subItems: Array<{
      id?: string;
      name: string;
      isCompleted: boolean;
    }>;
  }>;
}

export async function createTodoList(name: string) {
  'use server';
  
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

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
      items: {
        include: {
          subItems: true
        }
      },
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
  const existingList = await prisma.todoList.findFirst({
    where: {
      id: todoListId,
      userId: user.userId,
    },
    include: {
      items: {
        include: {
          subItems: true,
        },
      },
      messages: true,
    },
  });

  if (!existingList) {
    throw new Error('Todo list not found or access denied');
  }

  try {
    // Start a transaction to update the list
    const result = await prisma.$transaction(async (tx) => {
      // Update the list's basic info
      await tx.todoList.update({
        where: { id: todoListId },
        data: {
          name: updatedList.name,
          isCompleted: updatedList.isCompleted ?? false,
        },
      });

      // Remove deleted items
      const keepItemIds = updatedList.items
        .filter(i => i.id)
        .map(i => i.id);

      await tx.item.deleteMany({
        where: {
          todoListId,
          id: {
            notIn: keepItemIds as string[],
          },
        },
      });

      // Handle each item in the updated list
      for (const item of updatedList.items) {
        if (item.id) {
          // Update existing item
          const updatedItem = await tx.item.update({
            where: { id: item.id },
            data: {
              name: item.name,
              notes: item.notes || null,
              deadline: item.deadline ? new Date(item.deadline) : null,
              isCompleted: item.isCompleted,
            },
          });

          // Update or create subItems
          for (const subItem of item.subItems) {
            if (subItem.id) {
              await tx.subItem.update({
                where: { id: subItem.id },
                data: {
                  name: subItem.name,
                  isCompleted: subItem.isCompleted,
                },
              });
            } else {
              await tx.subItem.create({
                data: {
                  name: subItem.name,
                  isCompleted: subItem.isCompleted,
                  itemId: updatedItem.id,
                },
              });
            }
          }

          // Remove deleted subItems
          const keepSubItemIds = item.subItems
            .filter(si => si.id)
            .map(si => si.id);

          await tx.subItem.deleteMany({
            where: {
              itemId: item.id,
              id: {
                notIn: keepSubItemIds as string[],
              },
            },
          });
        } else {
          // Create new item with its subItems
          await tx.item.create({
            data: {
              name: item.name,
              notes: item.notes || null,
              deadline: item.deadline ? new Date(item.deadline) : null,
              isCompleted: item.isCompleted,
              todoListId: todoListId,
              subItems: {
                create: item.subItems.map(subItem => ({
                  name: subItem.name,
                  isCompleted: subItem.isCompleted,
                })),
              },
            },
          });
        }
      }
      // Return the updated list with all relations
      return await tx.todoList.findUnique({
        where: { id: todoListId },
        include: {
          items: {
            include: {
              subItems: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
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

export async function scheduleCheckIn(itemId: string, scheduledAt: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  try {
    // Verify the item exists and belongs to the user
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        todoList: {
          userId: user.userId,
        },
      },
    });

    if (!item) {
      throw new Error('Item not found or access denied');
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        scheduledAt: new Date(scheduledAt),
        item: {
          connect: {
            id: itemId,
          },
        },
        user: {
          connect: {
            id: user.userId,
          },
        },
      },
      include: {
        item: {
          include: {
            todoList: true,
          },
        },
      },
    });

    revalidatePath('/dashboard');
    return checkIn;
  } catch (error) {
    console.error('Error scheduling check-in:', error);
    throw new Error('Failed to schedule check-in');
  }
}

export async function getCheckIns() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const checkIns = await prisma.checkIn.findMany({
    where: {
      userId: user.userId,
      scheduledAt: {
        gte: new Date(),
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    include: {
      item: {
        include: {
          todoList: true,
        },
      },
    },
  });

  return checkIns.map(checkIn => ({
    id: checkIn.id,
    scheduledAt: checkIn.scheduledAt.toISOString(),
    itemId: checkIn.itemId,
    item: {
      name: checkIn.item.name,
      todoList: {
        name: checkIn.item.todoList.name,
      },
    },
  }));
}