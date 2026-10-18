import { Microphone, SpeakerHigh } from "@phosphor-icons/react";
import { useAtomValue } from "jotai";
import {
  micLevelAtom,
  micVolumeAtom,
  systemAudioVolumeAtom,
  systemLevelAtom,
} from "@/atoms/studio-atoms";
import { Slider } from "@/components/ui/slider";

const LEVEL_THRESHOLDS = { warn: 0.6, danger: 0.85 } as const;

function VuMeter({ level }: { level: number }) {
  const percentage = Math.min(level * 100, 100);
  const getColor = () => {
    if (level > LEVEL_THRESHOLDS.danger) {
      return "bg-red-500";
    }
    if (level > LEVEL_THRESHOLDS.warn) {
      return "bg-yellow-500";
    }
    return "bg-emerald-500";
  };
  const color = getColor();

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-75 ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function AudioMixer() {
  const micLevel = useAtomValue(micLevelAtom);
  const systemLevel = useAtomValue(systemLevelAtom);
  const micVolume = useAtomValue(micVolumeAtom);
  const systemVolume = useAtomValue(systemAudioVolumeAtom);

  return (
    <div className="flex w-full max-w-md items-center gap-4">
      {/* Mic */}
      <div className="flex flex-1 items-center gap-2">
        <Microphone
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          weight="fill"
        />
        <div className="flex flex-1 flex-col gap-1">
          <VuMeter level={micLevel} />
          <Slider
            className="w-full"
            defaultValue={[micVolume * 100]}
            max={100}
            min={0}
            step={1}
          />
        </div>
      </div>

      <div className="h-6 w-px bg-border/50" />

      {/* System */}
      <div className="flex flex-1 items-center gap-2">
        <SpeakerHigh
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          weight="fill"
        />
        <div className="flex flex-1 flex-col gap-1">
          <VuMeter level={systemLevel} />
          <Slider
            className="w-full"
            defaultValue={[systemVolume * 100]}
            max={100}
            min={0}
            step={1}
          />
        </div>
      </div>
    </div>
  );
}
