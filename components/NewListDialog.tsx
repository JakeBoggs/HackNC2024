'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTodoList } from '@/app/actions/todos';

interface NewListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateList: (newList) => void;
}

export default function NewListDialog({ open, onOpenChange, onCreateList }: NewListDialogProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newList = await createTodoList(name);
      onCreateList(newList); // Call onCreateList with the new list
      setName('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="List name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name || isSubmitting}>
              Create List
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
