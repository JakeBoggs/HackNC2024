import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [lists, checkIns] = await Promise.all([
    prisma.todoList.findMany({
      where: { userId: user.userId },
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
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    prisma.checkIn.findMany({
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
    }),
  ]);

  const transformedLists = lists.map(list => ({
    id: list.id,
    name: list.name,
    isCompleted: list.isCompleted,
    items: list.items.map(item => ({
      id: item.id,
      name: item.name,
      notes: item.notes || undefined,
      deadline: item.deadline?.toISOString() || undefined,
      isCompleted: item.isCompleted,
      subItems: item.subItems.map(subItem => ({
        id: subItem.id,
        name: subItem.name,
        isCompleted: subItem.isCompleted,
      })),
    })),
    messages: list.messages.map(message => ({
      id: message.id,
      role: message.role,
      content: message.content
    })),
  }));

  const transformedCheckIns = checkIns.map(checkIn => ({
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

  return (
    <DashboardClient
      initialLists={transformedLists}
      initialCheckIns={transformedCheckIns}
    />
  );
}