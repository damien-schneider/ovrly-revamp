import { Link2, Link2Off, Maximize2 } from "lucide-react";
import { useState } from "react";
import type { OverlayElement, SizeMode } from "@/features/canvas/types";
import { cn } from "@/lib/utils";
import { IconButton, PanelSection, ScrubInput } from "../primitives";

interface LayoutSectionProps {
  element: OverlayElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

function SizeModeToggle({
  mode,
  onChange,
  label,
}: {
  mode: SizeMode;
  onChange: (mode: SizeMode) => void;
  label: string;
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-border/60">
      <button
        className={cn(
          "h-6 px-2 font-medium text-[10px] transition-colors",
          mode === "fixed"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary/50"
        )}
        onClick={() => onChange("fixed")}
        title={`${label} in pixels`}
        type="button"
      >
        px
      </button>
      <button
        className={cn(
          "flex h-6 items-center gap-1 border-border/60 border-l px-2 font-medium text-[10px] transition-colors",
          mode === "fill"
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground hover:bg-secondary/50"
        )}
        onClick={() => onChange("fill")}
        title={`${label} fills parent/viewport`}
        type="button"
      >
        <Maximize2 className="h-2.5 w-2.5" />
        Fill
      </button>
    </div>
  );
}

export function LayoutSection({ element, onUpdate }: LayoutSectionProps) {
  const [aspectLocked, setAspectLocked] = useState(false);
  const aspectRatio = element.width / element.height;

  const widthMode = element.widthMode ?? "fixed";
  const heightMode = element.heightMode ?? "fixed";

  const handleWidthChange = (newWidth: number) => {
    if (aspectLocked) {
      onUpdate(element.id, {
        width: newWidth,
        height: Math.round(newWidth / aspectRatio),
      });
    } else {
      onUpdate(element.id, { width: newWidth });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    if (aspectLocked) {
      onUpdate(element.id, {
        width: Math.round(newHeight * aspectRatio),
        height: newHeight,
      });
    } else {
      onUpdate(element.id, { height: newHeight });
    }
  };

  return (
    <PanelSection title="Layout">
      <div className="space-y-3">
        {/* Width Row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Width</span>
            <SizeModeToggle
              label="Width"
              mode={widthMode}
              onChange={(mode) => onUpdate(element.id, { widthMode: mode })}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <ScrubInput
              className={cn("flex-1", widthMode === "fill" && "opacity-60")}
              disabled={widthMode === "fill"}
              label="W"
              min={1}
              onChange={handleWidthChange}
              value={Math.round(element.width)}
            />
            {widthMode === "fill" && (
              <span className="text-[9px] text-muted-foreground">preview</span>
            )}
          </div>
        </div>

        {/* Height Row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Height</span>
            <SizeModeToggle
              label="Height"
              mode={heightMode}
              onChange={(mode) => onUpdate(element.id, { heightMode: mode })}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <ScrubInput
              className={cn("flex-1", heightMode === "fill" && "opacity-60")}
              disabled={heightMode === "fill"}
              label="H"
              min={1}
              onChange={handleHeightChange}
              value={Math.round(element.height)}
            />
            {heightMode === "fill" && (
              <span className="text-[9px] text-muted-foreground">preview</span>
            )}
          </div>
        </div>

        {/* Aspect Lock */}
        <div className="flex items-center justify-end">
          <IconButton
            active={aspectLocked}
            icon={
              aspectLocked ? (
                <Link2 className="h-3 w-3" />
              ) : (
                <Link2Off className="h-3 w-3 text-muted-foreground" />
              )
            }
            onClick={() => setAspectLocked(!aspectLocked)}
            tooltip={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
          />
        </div>
      </div>
    </PanelSection>
  );
}
