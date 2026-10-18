import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { Eye, EyeSlash, GearSix } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { useAtom } from "jotai";
import { useState } from "react";
import { toast } from "sonner";
import { settingsDialogOpenAtom } from "@/atoms/studio-atoms";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MIN_BITRATE = 1000;
const MAX_BITRATE = 8000;
const BITRATE_STEP = 500;

export function StreamSettingsButton() {
  const [open, setOpen] = useAtom(settingsDialogOpenAtom);

  return (
    <>
      <Tooltip>
        <TooltipTrigger>
          <Button
            className="text-muted-foreground"
            onClick={() => setOpen(true)}
            size="icon"
            variant="ghost"
          >
            <GearSix className="h-4 w-4" weight="regular" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Stream settings</TooltipContent>
      </Tooltip>

      <StreamSettingsDialog onOpenChange={setOpen} open={open} />
    </>
  );
}

interface StreamSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StreamSettingsDialog({
  open,
  onOpenChange,
}: StreamSettingsDialogProps) {
  const settings = useQuery(api.studio.getSettings);
  const upsert = useMutation(api.studio.upsertSettings);

  const [streamKey, setStreamKey] = useState("");
  const [resolution, setResolution] = useState<"1080p" | "720p">("1080p");
  const [framerate, setFramerate] = useState<30 | 60>(30);
  const [bitrate, setBitrate] = useState(4500);
  const [showKey, setShowKey] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load settings when dialog opens
  if (open && settings && !initialized) {
    setStreamKey(settings.streamKey ?? "");
    setResolution(settings.resolution ?? "1080p");
    setFramerate(settings.framerate ?? 30);
    setBitrate(settings.bitrate ?? 4500);
    setInitialized(true);
  }

  // Reset when dialog closes
  if (!open && initialized) {
    setInitialized(false);
    setShowKey(false);
  }

  const handleSave = async () => {
    try {
      await upsert({
        streamKey,
        resolution,
        framerate,
        bitrate,
      });
      toast.success("Settings saved");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stream Settings</DialogTitle>
          <DialogDescription>
            Configure your stream output for Twitch.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Stream Key */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs" htmlFor="stream-key">
              Stream Key
            </Label>
            <div className="relative">
              <Input
                id="stream-key"
                onChange={(e) => setStreamKey(e.target.value)}
                placeholder="live_xxxxxxxxxxxx"
                type={showKey ? "text" : "password"}
                value={streamKey}
              />
              <button
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? (
                  <EyeSlash className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Find it in your Twitch Dashboard → Stream → Stream Key
            </p>
          </div>

          {/* Resolution */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Resolution</Label>
            <Select
              onValueChange={(v) => setResolution(v as "1080p" | "720p")}
              value={resolution}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1080p">1080p (1920×1080)</SelectItem>
                <SelectItem value="720p">720p (1280×720)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Framerate */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Framerate</Label>
            <Select
              onValueChange={(v) => setFramerate(Number(v) as 30 | 60)}
              value={String(framerate)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 fps</SelectItem>
                <SelectItem value="60">60 fps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bitrate */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Bitrate</Label>
              <span className="text-muted-foreground text-xs">
                {bitrate} kbps
              </span>
            </div>
            <Slider
              max={MAX_BITRATE}
              min={MIN_BITRATE}
              onValueChange={(v) => {
                const val = Array.isArray(v) ? v[0] : v;
                setBitrate(val ?? MIN_BITRATE);
              }}
              step={BITRATE_STEP}
              value={[bitrate]}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} size="sm">
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
