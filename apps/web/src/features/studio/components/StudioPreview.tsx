import { useAtomValue } from "jotai";
import { cameraEnabledAtom, screenEnabledAtom } from "@/atoms/studio-atoms";
import { useCompositor } from "../hooks/use-compositor";

interface StudioPreviewProps {
  resolution: "1080p" | "720p";
}

export function StudioPreview({ resolution }: StudioPreviewProps) {
  const { canvasRef } = useCompositor(resolution);
  const cameraEnabled = useAtomValue(cameraEnabledAtom);
  const screenEnabled = useAtomValue(screenEnabledAtom);

  const hasAnySources = cameraEnabled || screenEnabled;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black/40">
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <canvas
          className="h-full w-full rounded-lg"
          data-studio-canvas=""
          ref={canvasRef}
        />

        {!hasAnySources && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <div className="text-sm">No sources active</div>
            <div className="text-xs opacity-60">
              Enable your camera or share your screen to start
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
