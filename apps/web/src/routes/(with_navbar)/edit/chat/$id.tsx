import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/(with_navbar)/edit/chat/$id")({
  beforeLoad: ({ context, location }) => {
    // Access userId from parent route context (set in __root.tsx beforeLoad)
    const userId = (context as any).userId;

    if (!userId) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const overlay = useQuery(api.overlays.getById, { id: id as any });
  const updateOverlay = useMutation(api.overlays.update);

  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");
  const [testMessagesEnabled, setTestMessagesEnabled] = useState(false);

  // Sync state when overlay loads or changes
  useEffect(() => {
    if (overlay) {
      setName(overlay.name || "");
      setChannel(overlay.channel || "");
      setTestMessagesEnabled(
        (overlay.settings as { testMessagesEnabled?: boolean })
          ?.testMessagesEnabled ?? false
      );
    }
  }, [overlay]);

  const siteUrl =
    (import.meta as any).env.VITE_SITE_URL || window.location.origin;
  const chatUrl = `${siteUrl}/chat/${id}`;
  const obsUrl = chatUrl;

  const handleUpdate = async () => {
    if (!overlay) return;

    try {
      const currentSettings = (overlay.settings || {}) as Record<
        string,
        unknown
      >;
      await updateOverlay({
        id: id as any,
        name: name.trim() || undefined,
        channel: channel.trim() || undefined,
        settings: {
          ...currentSettings,
          testMessagesEnabled,
        },
      });
      toast.success("Overlay updated successfully");
    } catch (error) {
      toast.error("Failed to update overlay");
      console.error(error);
    }
  };

  const handleCopyOBSLink = () => {
    navigator.clipboard.writeText(obsUrl);
    toast.success("OBS link copied to clipboard");
  };

  if (!overlay) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const settings = overlay.settings as {
    fontSize?: number;
    fontFamily?: string;
    textColor?: string;
    backgroundColor?: string;
    maxMessages?: number;
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Edit Chat Overlay</h1>
          <p className="mt-2 text-muted-foreground">
            Configure your chat overlay settings
          </p>
        </div>
        <Link to="/overlays">
          <Button variant="outline">Back to Overlays</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure your chat overlay settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="My Chat Overlay"
                value={name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Twitch Channel</Label>
              <Input
                id="channel"
                onChange={(e) => setChannel(e.target.value)}
                placeholder="channelname"
                value={channel}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="test-messages">Test Messages</Label>
                <p className="text-muted-foreground text-sm">
                  Enable automatic test messages in the preview
                </p>
              </div>
              <Checkbox
                checked={testMessagesEnabled}
                id="test-messages"
                onCheckedChange={(checked) => {
                  setTestMessagesEnabled(checked === true);
                }}
              />
            </div>

            <Button className="w-full" onClick={handleUpdate}>
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Preview & Links</CardTitle>
            <CardDescription>
              View your overlay and copy the OBS link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>OBS Browser Source URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={obsUrl} />
                <Button
                  onClick={handleCopyOBSLink}
                  size="icon"
                  variant="outline"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Use this URL in OBS as a Browser Source
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
                <iframe
                  className="h-full w-full"
                  src={chatUrl}
                  title="Chat Overlay Preview"
                />
              </div>
              <Link target="_blank" to={chatUrl}>
                <Button className="w-full" variant="outline">
                  Open Full Preview
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
