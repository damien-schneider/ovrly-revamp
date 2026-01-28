import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import type {
  OverlayElement,
  TimerElement,
  TimerStyle,
} from "@/features/canvas/types";
import {
  ColorSwatch,
  CompactInput,
  getSliderValue,
  PanelSection,
  PropertyRow,
} from "../primitives";

interface TimerSectionProps {
  element: TimerElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function TimerSection({ element, onUpdate }: TimerSectionProps) {
  const updateTimerStyle = (updates: Partial<TimerStyle>) => {
    onUpdate(element.id, {
      style: { ...element.style, ...updates },
    } as Partial<TimerElement>);
  };

  return (
    <>
      <PanelSection title="Timer">
        <div className="space-y-2">
          <PropertyRow label="Mode">
            <Select
              onValueChange={(v) =>
                onUpdate(element.id, { mode: v } as Partial<TimerElement>)
              }
              value={element.mode}
            >
              <SelectTrigger className="h-6 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="countdown">Countdown</SelectItem>
                <SelectItem value="countup">Count Up</SelectItem>
                <SelectItem value="stopwatch">Stopwatch</SelectItem>
              </SelectContent>
            </Select>
          </PropertyRow>
          {element.mode !== "stopwatch" && (
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                Target Date/Time
              </Label>
              <Input
                className="h-7 text-[11px]"
                onChange={(e) =>
                  onUpdate(element.id, {
                    targetDate: new Date(e.target.value).toISOString(),
                  } as Partial<TimerElement>)
                }
                type="datetime-local"
                value={new Date(element.targetDate).toISOString().slice(0, 16)}
              />
            </div>
          )}
          {element.mode === "stopwatch" && (
            <div className="flex gap-1">
              <Button
                className="h-7 flex-1 gap-1 text-[11px]"
                onClick={() =>
                  onUpdate(element.id, {
                    isRunning: !element.isRunning,
                  } as Partial<TimerElement>)
                }
                size="sm"
                variant="outline"
              >
                {element.isRunning ? (
                  <>
                    <Square className="h-2.5 w-2.5" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="h-2.5 w-2.5" /> Start
                  </>
                )}
              </Button>
              <Button
                className="h-7 text-[11px]"
                onClick={() =>
                  onUpdate(element.id, {
                    elapsedMs: 0,
                    isRunning: false,
                  } as Partial<TimerElement>)
                }
                size="sm"
                variant="outline"
              >
                Reset
              </Button>
            </div>
          )}
        </div>
      </PanelSection>

      <PanelSection title="Display">
        <div className="space-y-2">
          <PropertyRow label="Color">
            <ColorSwatch
              color={element.color}
              onChange={(color) =>
                onUpdate(element.id, { color } as Partial<TimerElement>)
              }
            />
          </PropertyRow>
          <PropertyRow label="Font Size">
            <div className="flex-1">
              <Slider
                max={128}
                min={16}
                onValueChange={(v) =>
                  onUpdate(element.id, {
                    fontSize: getSliderValue(v),
                  } as Partial<TimerElement>)
                }
                value={[element.fontSize]}
              />
            </div>
          </PropertyRow>
        </div>
      </PanelSection>

      <PanelSection title="Format">
        <div className="space-y-2">
          <PropertyRow label="Show Days">
            <Switch
              checked={element.style?.showDays ?? false}
              onCheckedChange={(checked) =>
                updateTimerStyle({ showDays: checked })
              }
            />
          </PropertyRow>
          <PropertyRow label="Show Hours">
            <Switch
              checked={element.style?.showHours ?? true}
              onCheckedChange={(checked) =>
                updateTimerStyle({ showHours: checked })
              }
            />
          </PropertyRow>
          <PropertyRow label="Show Min">
            <Switch
              checked={element.style?.showMinutes ?? true}
              onCheckedChange={(checked) =>
                updateTimerStyle({ showMinutes: checked })
              }
            />
          </PropertyRow>
          <PropertyRow label="Show Sec">
            <Switch
              checked={element.style?.showSeconds ?? true}
              onCheckedChange={(checked) =>
                updateTimerStyle({ showSeconds: checked })
              }
            />
          </PropertyRow>
          <PropertyRow label="Separator">
            <CompactInput
              className="w-16"
              onChange={(v) => updateTimerStyle({ separator: v })}
              type="text"
              value={element.style?.separator ?? ":"}
            />
          </PropertyRow>
        </div>
      </PanelSection>
    </>
  );
}
