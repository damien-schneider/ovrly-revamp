import {
  Camera,
  CameraSlash,
  Microphone,
  MicrophoneSlash,
  Monitor,
  MonitorArrowUp,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { useAtomValue } from "jotai";
import {
  cameraEnabledAtom,
  micEnabledAtom,
  screenEnabledAtom,
  systemAudioEnabledAtom,
} from "@/atoms/studio-atoms";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCamera } from "../hooks/use-camera";
import { useScreenShare } from "../hooks/use-screen-share";

export function SourceControls() {
  const { toggle: toggleCamera } = useCamera();
  const { toggle: toggleScreen } = useScreenShare();
  const cameraEnabled = useAtomValue(cameraEnabledAtom);
  const screenEnabled = useAtomValue(screenEnabledAtom);
  const micEnabled = useAtomValue(micEnabledAtom);
  const systemAudioEnabled = useAtomValue(systemAudioEnabledAtom);

  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip>
        <TooltipTrigger>
          <Button
            className={cn(
              "h-10 w-10",
              cameraEnabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground"
            )}
            onClick={toggleCamera}
            size="icon"
            variant={cameraEnabled ? "default" : "ghost"}
          >
            {cameraEnabled ? (
              <Camera className="h-5 w-5" weight="fill" />
            ) : (
              <CameraSlash className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {cameraEnabled ? "Turn off camera" : "Turn on camera"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <Button
            className={cn(
              "h-10 w-10",
              screenEnabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground"
            )}
            onClick={toggleScreen}
            size="icon"
            variant={screenEnabled ? "default" : "ghost"}
          >
            {screenEnabled ? (
              <MonitorArrowUp className="h-5 w-5" weight="fill" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {screenEnabled ? "Stop sharing" : "Share screen"}
        </TooltipContent>
      </Tooltip>

      <div className="mx-1 h-6 w-px bg-border/50" />

      <Tooltip>
        <TooltipTrigger>
          <Button
            className={cn(
              "h-10 w-10",
              micEnabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground"
            )}
            size="icon"
            variant={micEnabled ? "default" : "ghost"}
          >
            {micEnabled ? (
              <Microphone className="h-5 w-5" weight="fill" />
            ) : (
              <MicrophoneSlash className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {micEnabled ? "Mute microphone" : "Unmute microphone"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <Button
            className={cn(
              "h-10 w-10",
              systemAudioEnabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground"
            )}
            size="icon"
            variant={systemAudioEnabled ? "default" : "ghost"}
          >
            {systemAudioEnabled ? (
              <SpeakerHigh className="h-5 w-5" weight="fill" />
            ) : (
              <SpeakerSlash className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {systemAudioEnabled ? "Mute system audio" : "Unmute system audio"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
