import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FireworkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center-center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type FireworkPositionSelectorProps = {
  value: FireworkPosition;
  onChange: (position: FireworkPosition) => void;
};

const positions: { position: FireworkPosition; label: string }[] = [
  { position: "top-left", label: "Top Left" },
  { position: "top-center", label: "Top Center" },
  { position: "top-right", label: "Top Right" },
  { position: "center-left", label: "Center Left" },
  { position: "center-center", label: "Center" },
  { position: "center-right", label: "Center Right" },
  { position: "bottom-left", label: "Bottom Left" },
  { position: "bottom-center", label: "Bottom Center" },
  { position: "bottom-right", label: "Bottom Right" },
];

export function FireworkPositionSelector({
  value,
  onChange,
}: FireworkPositionSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Firework Starting Position</Label>
      <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3">
        {positions.map(({ position, label }) => {
          const isSelected = value === position;
          return (
            <Button
              className={cn(
                "h-12 transition-all",
                isSelected &&
                  "border-primary bg-primary/10 ring-2 ring-primary/50"
              )}
              key={position}
              onClick={() => onChange(position)}
              size="sm"
              type="button"
              variant={isSelected ? "default" : "outline"}
            >
              <span className="sr-only">{label}</span>
              <span
                className={cn(
                  "flex h-2 w-2 rounded-full transition-all",
                  isSelected ? "bg-primary" : "bg-muted-foreground"
                )}
              />
            </Button>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">
        Click a position to set where firework emojis will originate
      </p>
    </div>
  );
}
