import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // Layout will handle redirect

  const lists = await prisma.todoList.findMany({
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
  });

  // Transform the database results to match the expected TodoList interface
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
      content: message.content,
      listState: message.listState,
    })),
  }));

  return <DashboardClient user={user} initialLists={transformedLists} />;
}