'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TodoList from '@/components/TodoList';
import ChatInterface from '@/components/ChatInterface';
import NewListDialog from '@/components/NewListDialog';
import { 
  PlusIcon, 
  MessageSquareIcon, 
  XIcon, 
  TrashIcon,
  LogOutIcon,
  CheckIcon,
  XCircleIcon 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { updateTodoList, deleteTodoList, createTodoList } from '@/app/actions/todos';
import { signOut } from '@/app/actions/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubItem {
  name: string;
  isCompleted: boolean;
}

interface TodoItem {
  name: string;
  notes?: string;
  deadline?: string;
  isCompleted: boolean;
  subItems: SubItem[];
}

interface TodoList {
  id: string;
  name: string;
  items: TodoItem[];
  isCompleted: boolean;
  messages: Array<{
    role: string;
    content: string;
    listState: string | null;
  }>;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DashboardClientProps {
  user: User;
  initialLists: TodoList[];
}

export function DashboardClient({ user, initialLists }: DashboardClientProps) {
  const [lists, setLists] = useState<TodoList[]>(initialLists);
  const [selectedList, setSelectedList] = useState<TodoList | null>(null);
  const [workingList, setWorkingList] = useState<TodoList | null>(null);
  const [proposedList, setProposedList] = useState<TodoList | null>(null);
  const [isNewListOpen, setIsNewListOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<TodoList | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleListSelect = (list: TodoList) => {
    if (hasUnsavedChanges && selectedList) {
      if (confirm('You have unsaved changes. Do you want to discard them?')) {
        setHasUnsavedChanges(false);
        setSelectedList(list);
        setWorkingList(structuredClone(list));
        setProposedList(null);
      }
    } else {
      setSelectedList(list);
      setWorkingList(structuredClone(list));
      setProposedList(null);
    }
  };

  const handleNewList = async (newList: TodoList) => {
    try {
      const createdList = await createTodoList(newList);
      setLists((prev) => [...prev, createdList]);
      setIsNewListOpen(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleDeleteClick = (list: TodoList, event: React.MouseEvent) => {
    event.stopPropagation();
    setListToDelete(list);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!listToDelete) return;

    try {
      await deleteTodoList(listToDelete.id);
      setLists((prev) => prev.filter((l) => l.id !== listToDelete.id));
      if (selectedList?.id === listToDelete.id) {
        setSelectedList(null);
        setWorkingList(null);
        setProposedList(null);
      }
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
    setDeleteConfirmOpen(false);
    setListToDelete(null);
  };

  const handleManualListUpdate = async (updatedList: TodoList) => {
    try {
      const savedList = await updateTodoList(selectedList.id, updatedList);
      
      setLists(prevLists => 
        prevLists.map(list => 
          list.id === savedList.id ? savedList : list
        )
      );
      
      setSelectedList(savedList);
      setWorkingList(structuredClone(savedList));
    } catch (error) {
      console.error('Failed to update list:', error);
    }
  };

  // Handle updates from chat
  const handleChatUpdate = async (updatedList: TodoList) => {
    setProposedList(updatedList);
  };

  const handleAcceptChanges = async () => {
    if (!proposedList || !selectedList) return;

    try {
      const savedList = await updateTodoList(selectedList.id, proposedList);
      
      setLists(prevLists => 
        prevLists.map(list => 
          list.id === savedList.id ? savedList : list
        )
      );
      
      setSelectedList(savedList);
      setWorkingList(structuredClone(savedList));
      setProposedList(null);
    } catch (error) {
      console.error('Failed to update list:', error);
    }
  };

  const handleRejectChanges = () => {
    setProposedList(null);
  };

  if (selectedList) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (proposedList) {
                  if (confirm('You have proposed changes. Do you want to discard them?')) {
                    setSelectedList(null);
                  }
                } else {
                  setSelectedList(null);
                }
              }}
            >
              <XIcon className="h-4 w-4 mr-2" />
              Back to Lists
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {proposedList && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectChanges}
                  className="text-red-500"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Reject Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptChanges}
                  className="text-green-500"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Accept Changes
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-red-500 hover:text-red-600"
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex min-h-0">
          <div className="w-1/2 border-r flex flex-col min-h-0">
            <ChatInterface
              list={selectedList}
              onUpdateList={handleChatUpdate}
            />
          </div>
          <div className="w-1/2 flex flex-col min-h-0">
            <TodoList
              currentList={selectedList}
              proposedList={proposedList}
              onAcceptList={handleAcceptChanges}
              onRejectList={handleRejectChanges}
              onUpdate={handleManualListUpdate}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Lists</h2>
        <div className="flex gap-4">
          <Button onClick={() => setIsNewListOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New List
          </Button>
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="text-red-500 hover:text-red-600"
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Create your first list</h3>
          <p className="text-gray-600 mb-4">
            Get started by creating a new todo list
          </p>
          <Button onClick={() => setIsNewListOpen(true)}>
            Create New List
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <Card
              key={list.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleListSelect(list)}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="truncate">{list.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteClick(list, e)}
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                    <MessageSquareIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    {list.items.filter(item => item.isCompleted).length} of {list.items.length} items completed
                  </div>
                  <div className="space-y-2">
                    {list.items.slice(0, 3).map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                    ))}
                    {list.items.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{list.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewListDialog
        open={isNewListOpen}
        onOpenChange={setIsNewListOpen}
        onCreateList={handleNewList}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{listToDelete?.name}" and all of its items.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}