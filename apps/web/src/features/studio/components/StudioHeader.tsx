import { House, Record, Stop } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import {
  streamDurationAtom,
  streamHealthAtom,
  streamStatusAtom,
} from "@/atoms/studio-atoms";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { StreamSettingsButton } from "./StreamSettingsDialog";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

interface StudioHeaderProps {
  onGoLive: () => void;
  onStopStream: () => void;
}

export function StudioHeader({ onGoLive, onStopStream }: StudioHeaderProps) {
  const status = useAtomValue(streamStatusAtom);
  const duration = useAtomValue(streamDurationAtom);
  const health = useAtomValue(streamHealthAtom);

  const isLive = status === "live";
  const isConnecting = status === "connecting";

  return (
    <div className="flex h-12 items-center justify-between border-border/50 border-b bg-background/95 px-3 backdrop-blur-sm">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
            <Link to="/home">
              <Button
                className="text-muted-foreground"
                size="icon-sm"
                variant="ghost"
              >
                <House className="h-4 w-4" weight="regular" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">Home</TooltipContent>
        </Tooltip>

        <div className="mx-0.5 h-4 w-px bg-border/50" />

        <span className="font-semibold text-sm">Studio</span>
      </div>

      {/* Center: Stream status */}
      <div className="flex items-center gap-2">
        {isLive && (
          <>
            <span className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 font-semibold text-red-500 text-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              LIVE
            </span>
            <span className="font-mono text-muted-foreground text-xs tabular-nums">
              {formatDuration(duration)}
            </span>
            {health.fps > 0 && (
              <>
                <div className="h-3 w-px bg-border/40" />
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(health.fps)} fps
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(health.bitrate)} kbps
                </span>
              </>
            )}
          </>
        )}
        {isLive || isConnecting ? null : (
          <span className="text-muted-foreground text-xs">Offline</span>
        )}
        {isConnecting && (
          <span className="animate-pulse text-muted-foreground text-xs">
            Connecting...
          </span>
        )}
      </div>

      {/* Right: Settings + Go Live */}
      <div className="flex items-center gap-1.5">
        <StreamSettingsButton />

        <Button
          className={cn(
            "min-w-24 gap-1.5",
            isLive
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-red-600 text-white hover:bg-red-700"
          )}
          disabled={isConnecting}
          onClick={isLive ? onStopStream : onGoLive}
          size="sm"
        >
          {isLive ? (
            <>
              <Stop className="h-3.5 w-3.5" weight="fill" />
              End Stream
            </>
          ) : null}
          {isConnecting ? "Connecting..." : null}
          {isLive || isConnecting ? null : (
            <>
              <Record className="h-3.5 w-3.5" weight="fill" />
              Go Live
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
