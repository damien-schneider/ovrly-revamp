import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

/**
 * Hook to fetch all commands for the current user
 */
export function useCommandList() {
  const commands = useQuery(api.commands.list);
  return {
    commands: commands ?? [],
    isLoading: commands === undefined,
  };
}

/**
 * Hook to create a new command
 */
export function useCreateCommand() {
  const createCommand = useMutation(api.commands.create);
  return createCommand;
}

/**
 * Hook to update an existing command
 */
export function useUpdateCommand() {
  const updateCommand = useMutation(api.commands.update);
  return updateCommand;
}

/**
 * Hook to delete a command
 */
export function useDeleteCommand() {
  const deleteCommand = useMutation(api.commands.remove);
  return deleteCommand;
}

/**
 * Hook to toggle a command's enabled status
 */
export function useToggleCommand() {
  const toggleCommand = useMutation(api.commands.toggle);
  return toggleCommand;
}

/**
 * Hook to get a specific command by ID
 */
export function useCommand(commandId: Id<"commands"> | null) {
  const command = useQuery(
    api.commands.get,
    commandId ? { id: commandId } : "skip"
  );
  return {
    command,
    isLoading: command === undefined && commandId !== null,
  };
}
