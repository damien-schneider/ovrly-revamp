import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { Pencil, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCommandList,
  useDeleteCommand,
  useToggleCommand,
} from "@/hooks/use-commands";
import { CommandFormDialog } from "./command-form-dialog";

interface Command {
  _id: Id<"commands">;
  trigger: string;
  response: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export function CommandList() {
  const { commands, isLoading } = useCommandList();
  const deleteCommand = useDeleteCommand();
  const toggleCommand = useToggleCommand();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commandToDelete, setCommandToDelete] = useState<Id<"commands"> | null>(
    null
  );

  const handleEdit = (command: Command) => {
    setEditingCommand(command);
    setIsFormOpen(true);
  };

  const handleDelete = (commandId: Id<"commands">) => {
    setCommandToDelete(commandId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!commandToDelete) return;

    try {
      await deleteCommand({ id: commandToDelete });
      toast.success("Command deleted successfully");
      setDeleteDialogOpen(false);
      setCommandToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete command"
      );
    }
  };

  const handleToggle = async (commandId: Id<"commands">) => {
    try {
      await toggleCommand({ id: commandId });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to toggle command"
      );
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCommand(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading commands...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {commands.length} command{commands.length !== 1 ? "s" : ""} total
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Command
          </Button>
        </div>

        {commands.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <h3 className="font-semibold text-lg">No commands yet</h3>
            <p className="mt-2 text-muted-foreground text-sm">
              Get started by creating your first custom command
            </p>
            <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Command
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Trigger</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead className="w-[100px]">Enabled</TableHead>
                  <TableHead className="w-[100px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commands.map((command) => (
                  <TableRow key={command._id}>
                    <TableCell className="font-medium font-mono">
                      {command.trigger}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {command.response}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={command.enabled}
                        onCheckedChange={() => handleToggle(command._id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleEdit(command)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(command._id)}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CommandFormDialog
        command={editingCommand}
        onOpenChange={handleFormClose}
        open={isFormOpen}
      />

      <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              command.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
