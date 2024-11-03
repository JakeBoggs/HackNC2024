'use client';

import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, Calendar } from 'lucide-react';
import { CheckInDialog } from './CheckInDialog';
import { scheduleCheckIn } from '@/app/actions/todos';

function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    const newTimeoutId = setTimeout(() => callback(...args), delay);
    setTimeoutId(newTimeoutId);
  }, [callback, delay, timeoutId]);
}

interface SubItem {
  id?: string;
  name: string;
  isCompleted: boolean;
}

interface TodoItem {
  id?: string;
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

interface CheckIn {
  id: string;
  scheduledAt: string;
  itemId: string;
  item: {
    name: string;
    todoList: {
      name: string;
    };
  };
}

interface TodoListProps {
  currentList: TodoList;
  proposedList: TodoList | null;
  onAcceptList: () => void;
  onRejectList: () => void;
  onUpdate: (list: TodoList) => void;
  onCheckInScheduled: (checkIn: CheckIn) => void;
}

export default function TodoList({
  currentList,
  proposedList,
  onAcceptList,
  onRejectList,
  onUpdate,
  onCheckInScheduled
}: TodoListProps) {
  const [list, setList] = useState(currentList);
  const [editingList, setEditingList] = useState<TodoList | null>(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  // Update local state when currentList or proposedList changes
  useEffect(() => {
    if (proposedList) {
      setList(proposedList);
    } else if (!editingList) {
      setList(currentList);
    }
  }, [currentList, proposedList]);

  // Debounced update function
  const debouncedUpdate = useDebounce((updatedList: TodoList) => {
    onUpdate(updatedList);
    setEditingList(null);
  }, 1000);

  const handleListChange = (updatedList: TodoList) => {
    setList(updatedList);
    setEditingList(updatedList);
    debouncedUpdate(updatedList);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(list.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    handleListChange({
      ...list,
      items
    });
  };

  const handleAddItem = () => {
    handleListChange({
      ...list,
      items: [
        ...list.items,
        {
          name: '',
          notes: '',
          isCompleted: false,
          subItems: []
        }
      ]
    });
  };

  const handleRemoveItem = (index: number) => {
    handleListChange({
      ...list,
      items: list.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index: number, field: keyof TodoItem, value: any) => {
    handleListChange({
      ...list,
      items: list.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    });
  };

  const handleItemComplete = (index: number, checked: boolean) => {
    handleListChange({
      ...list,
      items: list.items.map((item, i) =>
        i === index
          ? {
              ...item,
              isCompleted: checked,
              subItems: item.subItems.map(subItem => ({
                ...subItem,
                isCompleted: checked
              }))
            }
          : item
      )
    });
  };

  const handleAddSubItem = (itemIndex: number) => {
    handleListChange({
      ...list,
      items: list.items.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              subItems: [
                ...item.subItems,
                { name: '', isCompleted: false }
              ]
            }
          : item
      )
    });
  };

  const handleRemoveSubItem = (itemIndex: number, subItemIndex: number) => {
    handleListChange({
      ...list,
      items: list.items.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              subItems: item.subItems.filter((_, j) => j !== subItemIndex)
            }
          : item
      )
    });
  };

  const handleSubItemChange = (
    itemIndex: number,
    subItemIndex: number,
    field: keyof SubItem,
    value: any
  ) => {
    handleListChange({
      ...list,
      items: list.items.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              subItems: item.subItems.map((subItem, j) =>
                j === subItemIndex ? { ...subItem, [field]: value } : subItem
              )
            }
          : item
      )
    });
  };

  const handleSubItemComplete = (
    itemIndex: number,
    subItemIndex: number,
    checked: boolean
  ) => {
    const updatedList = {
      ...list,
      items: list.items.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              subItems: item.subItems.map((subItem, j) =>
                j === subItemIndex
                  ? { ...subItem, isCompleted: checked }
                  : subItem
              ),
              isCompleted: checked && 
                item.subItems.every((subItem, j) => 
                  j === subItemIndex ? checked : subItem.isCompleted
                )
            }
          : item
      )
    };
    handleListChange(updatedList);
  };

  const handleScheduleCheckIn = async (dateTime: string) => {
    if (!selectedItemId) return;
    
    try {
      const formData = new FormData();
      formData.append('itemId', selectedItemId);
      formData.append('scheduledAt', dateTime);
      
      const response = await scheduleCheckIn(selectedItemId, dateTime);
      if (response) {
        onCheckInScheduled(response);
        setCheckInDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to schedule check-in:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {proposedList && (
        <div className="flex justify-end gap-2 p-4 border-b">
          <Button
            variant="outline"
            onClick={onRejectList}
            className="text-red-500"
          >
            Reject Changes
          </Button>
          <Button
            variant="outline"
            onClick={onAcceptList}
            className="text-green-500"
          >
            Accept Changes
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="items">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {list.items.map((item, index) => (
                  <Draggable
                    key={item.id || index}
                    draggableId={item.id || `temp-${index}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`p-4 rounded-lg border ${
                          snapshot.isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                        } ${proposedList ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            {...provided.dragHandleProps}
                            className="mt-1 cursor-grab hover:text-blue-500"
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>

                          <Checkbox
                            checked={item.isCompleted}
                            onCheckedChange={(checked) =>
                              handleItemComplete(index, checked as boolean)
                            }
                          />

                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              className={`w-full ${item.isCompleted ? 'line-through text-gray-500' : ''}`}
                            />
                            
                            {item.notes !== undefined && (
                              <Textarea
                                value={item.notes || ''}
                                onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                                placeholder="Add notes..."
                                className={`w-full min-h-[100px] ${item.isCompleted ? 'line-through text-gray-500' : ''}`}
                              />
                            )}

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <Input
                                type="date"
                                value={item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                  const date = e.target.value;
                                  handleItemChange(
                                    index,
                                    'deadline',
                                    date ? new Date(date).toISOString() : undefined
                                  );
                                }}
                                className={`w-full ${item.isCompleted ? 'text-gray-500' : ''}`}
                              />
                            </div>

                            <div className="pl-6 space-y-2">
                              {item.subItems?.map((subItem, subIndex) => (
                                <div key={subIndex} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={subItem.isCompleted}
                                    onCheckedChange={(checked) =>
                                      handleSubItemComplete(index, subIndex, checked as boolean)
                                    }
                                  />
                                  <Input
                                    value={subItem.name}
                                    onChange={(e) =>
                                      handleSubItemChange(index, subIndex, 'name', e.target.value)
                                    }
                                    className={`flex-1 ${subItem.isCompleted ? 'line-through text-gray-500' : ''}`}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSubItem(index, subIndex)}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddSubItem(index)}
                                >
                                  + Add Sub-item
                                </Button>
                                {item.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedItemId(item.id);
                                      setCheckInDialogOpen(true);
                                    }}
                                  >
                                    Schedule Check-in
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="p-4 border-t bg-white">
        <Button
          className="w-full"
          onClick={handleAddItem}
        >
          + Add Item
        </Button>
      </div>

      <CheckInDialog
        open={checkInDialogOpen}
        onOpenChange={setCheckInDialogOpen}
        onScheduleCheckIn={handleScheduleCheckIn}
      />
    </div>
  );
}