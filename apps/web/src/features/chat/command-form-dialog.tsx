import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCommand, useUpdateCommand } from "@/hooks/use-commands";

type CommandFormData = {
  trigger: string;
  response: string;
};

type CommandFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  command?: {
    _id: Id<"commands">;
    trigger: string;
    response: string;
  } | null;
};

export function CommandFormDialog({
  open,
  onOpenChange,
  command,
}: CommandFormDialogProps) {
  const isEdit = !!command;
  const createCommand = useCreateCommand();
  const updateCommand = useUpdateCommand();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<CommandFormData>({
    defaultValues: {
      trigger: "",
      response: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (command) {
      setValue("trigger", command.trigger);
      setValue("response", command.response);
    } else {
      reset();
    }
  }, [command, setValue, reset]);

  const onSubmit = async (data: CommandFormData) => {
    try {
      // Ensure trigger starts with !
      const trigger = data.trigger.trim();
      const finalTrigger = trigger.startsWith("!") ? trigger : `!${trigger}`;

      if (isEdit && command) {
        await updateCommand({
          id: command._id,
          trigger: finalTrigger,
          response: data.response.trim(),
        });
        toast.success("Command updated successfully");
      } else {
        await createCommand({
          trigger: finalTrigger,
          response: data.response.trim(),
        });
        toast.success("Command created successfully");
      }

      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save command"
      );
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Command" : "Create Command"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your chat command and response"
              : "Create a new custom chat command"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trigger">Command Trigger</Label>
              <div className="relative">
                <span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
                  !
                </span>
                <Input
                  className="pl-7"
                  id="trigger"
                  placeholder="projects"
                  {...register("trigger", {
                    required: "Trigger is required",
                    pattern: {
                      value: /^!?[a-zA-Z0-9_]+$/,
                      message:
                        "Trigger can only contain letters, numbers, and underscores",
                    },
                    minLength: {
                      value: 1,
                      message: "Trigger must be at least 1 character",
                    },
                  })}
                />
              </div>
              {errors.trigger && (
                <p className="text-destructive text-sm">
                  {errors.trigger.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="response">Response</Label>
              <Textarea
                id="response"
                placeholder="Check out my projects at https://..."
                rows={4}
                {...register("response", {
                  required: "Response is required",
                  minLength: {
                    value: 1,
                    message: "Response cannot be empty",
                  },
                })}
              />
              {errors.response && (
                <p className="text-destructive text-sm">
                  {errors.response.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={isSubmitting}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Update Command"
                  : "Create Command"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
