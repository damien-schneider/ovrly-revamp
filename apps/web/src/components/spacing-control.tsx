import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";

type SpacingValues = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type SpacingControlProps = {
  label: string;
  max?: number;
  onChange: (values: SpacingValues) => void;
  values: SpacingValues;
};

export function SpacingControl({
  label,
  max = 50,
  onChange,
  values,
}: SpacingControlProps) {
  const [localValues, setLocalValues] = useState({
    top: values.top ?? 0,
    right: values.right ?? 0,
    bottom: values.bottom ?? 0,
    left: values.left ?? 0,
  });

  // Sync local state with external values
  useEffect(() => {
    setLocalValues({
      top: values.top ?? 0,
      right: values.right ?? 0,
      bottom: values.bottom ?? 0,
      left: values.left ?? 0,
    });
  }, [values.top, values.right, values.bottom, values.left]);

  const handleValueChange = (
    side: keyof SpacingValues,
    newValue: number
  ) => {
    const updated = { ...localValues, [side]: newValue };
    setLocalValues(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-muted-foreground text-xs" htmlFor="top">
              Top
            </Label>
            <span className="text-muted-foreground text-sm">
              {localValues.top}px
            </span>
          </div>
          <Slider
            id="top"
            max={max}
            min={0}
            onValueChange={(value) =>
              handleValueChange("top", value[0] ?? 0)
            }
            step={1}
            value={[localValues.top]}
            variant="horizontal-thumb"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-muted-foreground text-xs" htmlFor="right">
              Right
            </Label>
            <span className="text-muted-foreground text-sm">
              {localValues.right}px
            </span>
          </div>
          <Slider
            id="right"
            max={max}
            min={0}
            onValueChange={(value) =>
              handleValueChange("right", value[0] ?? 0)
            }
            step={1}
            value={[localValues.right]}
            variant="horizontal-thumb"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-muted-foreground text-xs" htmlFor="bottom">
              Bottom
            </Label>
            <span className="text-muted-foreground text-sm">
              {localValues.bottom}px
            </span>
          </div>
          <Slider
            id="bottom"
            max={max}
            min={0}
            onValueChange={(value) =>
              handleValueChange("bottom", value[0] ?? 0)
            }
            step={1}
            value={[localValues.bottom]}
            variant="horizontal-thumb"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-muted-foreground text-xs" htmlFor="left">
              Left
            </Label>
            <span className="text-muted-foreground text-sm">
              {localValues.left}px
            </span>
          </div>
          <Slider
            id="left"
            max={max}
            min={0}
            onValueChange={(value) =>
              handleValueChange("left", value[0] ?? 0)
            }
            step={1}
            value={[localValues.left]}
            variant="horizontal-thumb"
          />
        </div>
      </div>
    </div>
  );
}

