'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTodoList } from '@/app/actions/todos';

export default function NewListDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createTodoList(formData);
            onOpenChange(false);
            setName('');
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">List Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter list name..."
            />
          </div>
          <Button type="submit" className="w-full">
            Create List
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}