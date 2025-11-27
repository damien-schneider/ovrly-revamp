import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OverlayListCompactProps {
  typeFilter: "chat" | "emoji-wall" | "ad";
}

export default function OverlayListCompact({
  typeFilter,
}: OverlayListCompactProps) {
  const overlaysQuery = useSuspenseQuery(convexQuery(api.overlays.list, {}));
  const allOverlays = overlaysQuery.data ?? [];
  const overlays = allOverlays.filter((overlay) => overlay.type === typeFilter);

  const removeOverlay = useMutation(api.overlays.remove);
  const updateOverlay = useMutation(api.overlays.update);

  const [renamingId, setRenamingId] = useState<Id<"overlays"> | null>(null);
  const [newName, setNewName] = useState("");

  const handleDelete = async (id: Id<"overlays">, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await removeOverlay({ id });
      toast.success("Overlay deleted successfully");
    } catch (error) {
      toast.error("Failed to delete overlay");
      console.error(error);
    }
  };

  const handleRename = async (id: Id<"overlays">) => {
    if (!newName.trim()) return;

    try {
      await updateOverlay({
        id,
        name: newName.trim(),
      });
      toast.success("Overlay renamed successfully");
      setRenamingId(null);
    } catch (error) {
      toast.error("Failed to rename overlay");
      console.error(error);
    }
  };

  const params = useParams({ strict: false });
  const selectedId = params.id as Id<"overlays"> | undefined;

  const getEmptyMessage = () => {
    switch (typeFilter) {
      case "chat":
        return "chat";
      case "emoji-wall":
        return "wall emote";
      case "ad":
        return "ad";
    }
  };

  if (overlays.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No {getEmptyMessage()} overlays yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {overlays.map((overlay) => {
        let editPath: string;
        if (overlay.type === "chat") {
          editPath = `/overlays/chat/${overlay._id}`;
        } else if (overlay.type === "emoji-wall") {
          editPath = `/overlays/wall-emote/${overlay._id}`;
        } else {
          editPath = `/overlays/ad/${overlay._id}`;
        }

        const isSelected = selectedId === overlay._id;

        return (
          <div
            className={cn(
              "group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent/50",
              isSelected && "bg-accent text-accent-foreground"
            )}
            key={overlay._id}
          >
            {renamingId === overlay._id ? (
              <div className="flex flex-1 items-center gap-1">
                <Input
                  autoFocus
                  className="h-7 flex-1 text-sm"
                  onBlur={() => handleRename(overlay._id)}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRename(overlay._id);
                    } else if (e.key === "Escape") {
                      setRenamingId(null);
                    }
                  }}
                  value={newName}
                />
              </div>
            ) : (
              <Link
                className="flex-1 truncate font-medium text-sm hover:underline"
                to={editPath}
              >
                {overlay.name}
              </Link>
            )}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  setRenamingId(overlay._id);
                  setNewName(overlay.name || "");
                }}
                size="sm"
                variant="ghost"
              >
                <PencilSimple className="h-3 w-3" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="h-6 w-6 p-0"
                    onClick={(e) => e.stopPropagation()}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the overlay.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e: React.MouseEvent) =>
                        handleDelete(overlay._id, e)
                      }
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
}
