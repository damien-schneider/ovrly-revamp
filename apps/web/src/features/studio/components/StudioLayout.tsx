import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useSetAtom } from "jotai";
import { settingsDialogOpenAtom } from "@/atoms/studio-atoms";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAudioMixer } from "../hooks/use-audio-mixer";
import { useStream } from "../hooks/use-stream";
import { AudioMixer } from "./AudioMixer";
import { ChatPanel } from "./ChatPanel";
import { ScenePanel } from "./ScenePanel";
import { SourceControls } from "./SourceControls";
import { StudioHeader } from "./StudioHeader";
import { StudioPreview } from "./StudioPreview";

const SCENE_PANEL_DEFAULT_SIZE = 14;
const SCENE_PANEL_MIN_SIZE = 10;
const SCENE_PANEL_MAX_SIZE = 20;
const CHAT_PANEL_DEFAULT_SIZE = 22;
const CHAT_PANEL_MIN_SIZE = 15;
const CHAT_PANEL_MAX_SIZE = 35;

export function StudioLayout() {
  const settings = useQuery(api.studio.getSettings);
  const { goLive, stopStream } = useStream();
  const openSettings = useSetAtom(settingsDialogOpenAtom);

  // Initialize audio mixer (runs AudioContext, updates VU meters)
  useAudioMixer();

  const resolution = settings?.resolution ?? "1080p";

  const handleGoLive = () => {
    if (!settings?.streamKey) {
      openSettings(true);
      return;
    }

    // Get compositor output stream from canvas element
    const canvas = document.querySelector<HTMLCanvasElement>(
      "[data-studio-canvas]"
    );
    if (!canvas) {
      return;
    }

    const outputStream = canvas.captureStream(settings.framerate ?? 30);

    goLive(outputStream, {
      streamKey: settings.streamKey,
      resolution: settings.resolution ?? "1080p",
      framerate: settings.framerate ?? 30,
      bitrate: settings.bitrate ?? 4500,
      profileId: "current",
    });
  };

  return (
    <TooltipProvider delay={300}>
      <div className="flex h-svh w-full flex-col bg-background-2">
        <StudioHeader onGoLive={handleGoLive} onStopStream={stopStream} />

        <ResizablePanelGroup className="flex-1" orientation="horizontal">
          {/* Left: Scene Panel */}
          <ResizablePanel
            defaultSize={SCENE_PANEL_DEFAULT_SIZE}
            maxSize={SCENE_PANEL_MAX_SIZE}
            minSize={SCENE_PANEL_MIN_SIZE}
          >
            <div className="h-full border-border/50 border-r bg-background/60">
              <ScenePanel />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center: Preview + Controls */}
          <ResizablePanel defaultSize={64}>
            <div className="flex h-full flex-col">
              {/* Preview area */}
              <div className="flex flex-1 items-center justify-center p-4">
                <StudioPreview resolution={resolution} />
              </div>

              {/* Controls bar */}
              <div className="flex items-center justify-center gap-6 border-border/50 border-t bg-background/60 px-4 py-3">
                <SourceControls />
                <div className="h-6 w-px bg-border/40" />
                <AudioMixer />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right: Chat Panel */}
          <ResizablePanel
            defaultSize={CHAT_PANEL_DEFAULT_SIZE}
            maxSize={CHAT_PANEL_MAX_SIZE}
            minSize={CHAT_PANEL_MIN_SIZE}
          >
            <div className="h-full border-border/50 border-l bg-background/60">
              <ChatPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
