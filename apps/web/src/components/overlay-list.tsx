import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Copy, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OverlayListProps {
  typeFilter?: "chat" | "emoji-wall";
}

export default function OverlayList({ typeFilter }: OverlayListProps = {}) {
  const overlaysQuery = useSuspenseQuery(convexQuery(api.overlays.list, {}));
  const allOverlays = overlaysQuery.data ?? [];
  const overlays = typeFilter
    ? allOverlays.filter((overlay) => overlay.type === typeFilter)
    : allOverlays;

  const removeOverlay = useMutation(api.overlays.remove);

  const siteUrl =
    (import.meta as any).env.VITE_SITE_URL || window.location.origin;

  const handleDelete = async (id: Id<"overlays">) => {
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

  const handleCopyOBSLink = (overlay: {
    _id: Id<"overlays">;
    type: string;
  }) => {
    const obsUrl =
      overlay.type === "chat"
        ? `${siteUrl}/chat/${overlay._id}`
        : `${siteUrl}/wall-emote/${overlay._id}`;
    navigator.clipboard.writeText(obsUrl);
    toast.success("OBS link copied to clipboard");
  };

  if (overlays.length === 0) {
    const emptyMessage = typeFilter
      ? `No ${typeFilter === "chat" ? "chat" : "wall emote"} overlays yet. Create one to get started!`
      : "No overlays yet. Create one to get started!";
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Overlays</CardTitle>
          <CardDescription>{emptyMessage}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Your Overlays</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {overlays.map((overlay) => (
          <Card key={overlay._id}>
            <CardHeader>
              <CardTitle>{overlay.name}</CardTitle>
              <CardDescription>
                Type: {overlay.type}{" "}
                {overlay.channel && `• Channel: ${overlay.channel}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {overlay.type === "chat" ? (
                  <Link asChild to={`/overlays/chat/${overlay._id}`}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>
                ) : overlay.type === "emoji-wall" ? (
                  <Link asChild to={`/overlays/wall-emote/${overlay._id}`}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>
                ) : (
                  <Button disabled size="sm" variant="outline">
                    Edit
                  </Button>
                )}
                <Button
                  onClick={() => handleCopyOBSLink(overlay)}
                  size="sm"
                  variant="outline"
                >
                  <Copy className="h-4 w-4" />
                  Copy OBS Link
                </Button>
                <Button
                  onClick={() => handleDelete(overlay._id)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
