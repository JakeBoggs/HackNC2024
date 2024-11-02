import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, PlusIcon, XIcon, GripVertical, CheckIcon } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DraggableItem = React.memo(({ item, index, moveItem, onUpdate, onDelete, disabled }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'TODO_ITEM',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !disabled,
  });

  const [, drop] = useDrop({
    accept: 'TODO_ITEM',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const handleNameChange = useCallback((e) => {
    onUpdate({ ...item, name: e.target.value });
  }, [item, onUpdate]);

  const handleNotesChange = useCallback((e) => {
    onUpdate({ ...item, notes: e.target.value });
  }, [item, onUpdate]);

  const handleDeadlineChange = useCallback((e) => {
    onUpdate({ ...item, deadline: e.target.value });
  }, [item, onUpdate]);

  return (
    <div ref={(node) => drag(drop(node))} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Card className="p-4 mb-4">
        <div className="flex gap-2">
          {!disabled && (
            <div className="cursor-move mt-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={item.isCompleted}
                disabled={disabled}
                onCheckedChange={(checked) => onUpdate({ ...item, isCompleted: !!checked })}
              />
              <Input
                value={item.name}
                disabled={disabled}
                onChange={handleNameChange}
                className="flex-1"
              />
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-500 hover:text-red-600"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <Textarea
              value={item.notes || ''}
              disabled={disabled}
              onChange={handleNotesChange}
              placeholder="Add notes..."
              className="min-h-[60px]"
            />
            
            <Input
              type="date"
              // value={item.deadline?.split('T')[0] || ''}
              disabled={disabled}
              onChange={handleDeadlineChange}
              className="w-full"
            />

            {/* Sub-items section */}
            <div className="ml-6 space-y-2">
              {item.subItems.map((subItem, subIndex) => (
                <div key={subIndex} className="flex items-center gap-2">
                  <Checkbox
                    checked={subItem.isCompleted}
                    disabled={disabled}
                    onCheckedChange={(checked) => {
                      const newSubItems = [...item.subItems];
                      newSubItems[subIndex] = {
                        ...subItem,
                        isCompleted: !!checked,
                      };
                      onUpdate({ ...item, subItems: newSubItems });
                    }}
                  />
                  <Input
                    value={subItem.name}
                    disabled={disabled}
                    onChange={(e) => {
                      const newSubItems = [...item.subItems];
                      newSubItems[subIndex] = {
                        ...subItem,
                        name: e.target.value,
                      };
                      onUpdate({ ...item, subItems: newSubItems });
                    }}
                    className="flex-1"
                  />
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSubItems = item.subItems.filter((_, i) => i !== subIndex);
                        onUpdate({ ...item, subItems: newSubItems });
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!disabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSubItems = [
                      ...item.subItems,
                      { name: '', isCompleted: false },
                    ];
                    onUpdate({ ...item, subItems: newSubItems });
                  }}
                  className="ml-6"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Sub-item
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

DraggableItem.displayName = 'DraggableItem';

export default function TodoList({
  currentList,
  proposedList,
  onAcceptList,
  onRejectList,
  onUpdate,
}) {
  const list = proposedList || currentList;
  const [items, setItems] = useState(list.items || []);
  const [listName, setListName] = useState(list.name || '');
  const [isCompleted, setIsCompleted] = useState(list.isCompleted || false);
  const disabled = !!proposedList;

  useEffect(() => {
    setItems(list.items || []);
    setListName(list.name || '');
    setIsCompleted(list.isCompleted || false);
  }, [list]);

  // Create a stable reference for the debounced save function
  const debouncedSave = useCallback(
    (() => {
      let timeout;
      return (updatedList) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (!proposedList && onUpdate) {
            onUpdate(updatedList);
          }
        }, 1000); // Increased debounce time to 1 second
      };
    })(),
    [proposedList, onUpdate]
  );

  const saveChanges = useCallback((newItems, newName, newIsCompleted) => {
    const updatedList = {
      ...list,
      items: newItems,
      name: newName,
      isCompleted: newIsCompleted,
    };
    debouncedSave(updatedList);
  }, [list, debouncedSave]);

  const moveItem = useCallback((fromIndex, toIndex) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      saveChanges(newItems, listName, isCompleted);
      return newItems;
    });
  }, [saveChanges, listName, isCompleted]);

  const handleAddItem = useCallback(() => {
    const newItem = {
      name: '',
      notes: '',
      isCompleted: false,
      subItems: [],
    };
    setItems(prevItems => {
      const newItems = [...prevItems, newItem];
      saveChanges(newItems, listName, isCompleted);
      return newItems;
    });
  }, [saveChanges, listName, isCompleted]);

  const handleUpdateItem = useCallback((index, updatedItem) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = updatedItem;
      saveChanges(newItems, listName, isCompleted);
      return newItems;
    });
  }, [saveChanges, listName, isCompleted]);

  const handleDeleteItem = useCallback((index) => {
    setItems(prevItems => {
      const newItems = prevItems.filter((_, i) => i !== index);
      saveChanges(newItems, listName, isCompleted);
      return newItems;
    });
  }, [saveChanges, listName, isCompleted]);

  const handleNameChange = useCallback((e) => {
    const newName = e.target.value;
    setListName(newName);
    saveChanges(items, newName, isCompleted);
  }, [saveChanges, items, isCompleted]);

  const handleCompletedChange = useCallback((checked) => {
    setIsCompleted(checked);
    saveChanges(items, listName, checked);
  }, [saveChanges, items, listName]);

  if (!list) return null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b">
          <Input
            value={listName}
            disabled={disabled}
            onChange={handleNameChange}
            className="text-2xl font-semibold"
          />
          <Checkbox
            checked={isCompleted}
            disabled={disabled}
            onCheckedChange={handleCompletedChange}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items in this list yet
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <DraggableItem
                  key={item.id || index}
                  item={item}
                  index={index}
                  moveItem={moveItem}
                  onUpdate={(updatedItem) => handleUpdateItem(index, updatedItem)}
                  onDelete={() => handleDeleteItem(index)}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          {!disabled && (
            <Button onClick={handleAddItem} className="w-full">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>

        {proposedList && (
          <div className="sticky bottom-4 right-4 flex gap-2 justify-end px-4">
            <Button onClick={onAcceptList} className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4" />
              Accept Changes
            </Button>
            <Button
              variant="outline"
              onClick={onRejectList}
              className="flex items-center gap-2"
            >
              <XIcon className="w-4 h-4" />
              Reject Changes
            </Button>
          </div>
        )}
      </div>
    </DndProvider>
  );
}