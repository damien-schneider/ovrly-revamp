import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface OverlayListCompactProps {
  typeFilter: "chat" | "emoji-wall";
}

export default function OverlayListCompact({
  typeFilter,
}: OverlayListCompactProps) {
  const overlaysQuery = useSuspenseQuery(convexQuery(api.overlays.list, {}));
  const allOverlays = overlaysQuery.data ?? [];
  const overlays = allOverlays.filter((overlay) => overlay.type === typeFilter);

  const removeOverlay = useMutation(api.overlays.remove);

  const handleDelete = async (id: Id<"overlays">, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this overlay?")) {
      return;
    }
    try {
      await removeOverlay({ id });
      toast.success("Overlay deleted successfully");
    } catch (error) {
      toast.error("Failed to delete overlay");
      console.error(error);
    }
  };

  if (overlays.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No {typeFilter === "chat" ? "chat" : "wall emote"} overlays yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {overlays.map((overlay) => {
        const editPath =
          overlay.type === "chat"
            ? `/overlays/chat/${overlay._id}`
            : `/overlays/wall-emote/${overlay._id}`;

        return (
          <div
            key={overlay._id}
            className="group flex items-center justify-between rounded-lg p-2 hover:bg-background"
          >
            <Link
              to={editPath}
              className="flex-1 truncate text-sm font-medium hover:underline"
            >
              {overlay.name}
            </Link>
            <Button
              onClick={(e) => handleDelete(overlay._id, e)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

