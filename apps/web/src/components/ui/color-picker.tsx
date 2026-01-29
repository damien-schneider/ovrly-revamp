"use client";

import { Alpha, Colorful, type ColorResult } from "@uiw/react-color";
import { Pipette } from "lucide-react";
import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  size?: "default" | "compact";
};

const HEX_REGEX = /^#[0-9A-Fa-f]{0,8}$/;
const SHORT_HEX_LENGTH = 3;
const HEX_RADIX = 16;
const RGB_MAX = 255;
const HUE_SECTORS = 6;
const HUE_MULTIPLIER = 360;
const SATURATION_MULTIPLIER = 100;
const VALUE_MULTIPLIER = 100;
const HEX_PAIR_LENGTH = 2;
const HEX_PAIR_START_R = 0;
const HEX_PAIR_START_G = 2;
const HEX_PAIR_END_G = 4;
const HEX_PAIR_START_B = 4;
const HEX_PAIR_END_B = 6;
const HEX_PAIR_START_A = 6;
const HEX_PAIR_END_A = 8;
const FULL_HEX_WITH_ALPHA = 8;

// Preset colors matching Figma's palette
const PRESET_COLORS = [
  "#000000",
  "#545454",
  "#737373",
  "#A6A6A6",
  "#D9D9D9",
  "#FFFFFF",
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#00C7BE",
  "#30B0C7",
  "#007AFF",
  "#5856D6",
  "#AF52DE",
  "#FF2D55",
  "#A2845E",
  "#8E8E93",
];

// Helper to normalize hex string
const normalizeHex = (hex: string) => {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === SHORT_HEX_LENGTH) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return cleanHex;
};

// Helper to convert RGB to HSV
const rgbToHsv = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const s = delta === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (r === max) {
      h = ((g - b) / delta + (g < b ? HUE_SECTORS : 0)) / HUE_SECTORS;
    } else if (g === max) {
      h = ((b - r) / delta + HEX_PAIR_LENGTH) / HUE_SECTORS;
    } else {
      h = ((r - g) / delta + HEX_PAIR_END_G) / HUE_SECTORS;
    }
  }

  return {
    h: h * HUE_MULTIPLIER,
    s: s * SATURATION_MULTIPLIER,
    v: v * VALUE_MULTIPLIER,
  };
};

export function ColorPicker({
  value,
  onChange,
  disabled,
  size = "default",
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);

  // Convert RGBA to hex
  const rgbaToHex = useCallback(
    (r: number, g: number, b: number, a: number) => {
      const toHex = (n: number) => {
        const hex = Math.round(n).toString(HEX_RADIX);
        return hex.length === 1 ? `0${hex}` : hex;
      };

      if (a < 1) {
        return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a * RGB_MAX)}`;
      }
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    },
    []
  );

  // Parse hex to HSVA for the color picker
  const parseHexToHsva = useCallback((hex: string) => {
    const cleanHex = normalizeHex(hex);

    const r =
      Number.parseInt(
        cleanHex.substring(HEX_PAIR_START_R, HEX_PAIR_LENGTH),
        HEX_RADIX
      ) / RGB_MAX || 0;
    const g =
      Number.parseInt(
        cleanHex.substring(HEX_PAIR_START_G, HEX_PAIR_END_G),
        HEX_RADIX
      ) / RGB_MAX || 0;
    const b =
      Number.parseInt(
        cleanHex.substring(HEX_PAIR_START_B, HEX_PAIR_END_B),
        HEX_RADIX
      ) / RGB_MAX || 0;
    const a =
      cleanHex.length === FULL_HEX_WITH_ALPHA
        ? Number.parseInt(
            cleanHex.substring(HEX_PAIR_START_A, HEX_PAIR_END_A),
            HEX_RADIX
          ) / RGB_MAX
        : 1;

    const { h, s, v } = rgbToHsv(r, g, b);

    return { h, s, v, a };
  }, []);

  const currentHsva = parseHexToHsva(value);

  const handleColorChange = useCallback(
    (color: ColorResult) => {
      const newColor = rgbaToHex(
        color.rgb.r,
        color.rgb.g,
        color.rgb.b,
        color.hsva?.a ?? 1
      );
      onChange(newColor);
      setHexInput(newColor);
    },
    [onChange, rgbaToHex]
  );

  const handleAlphaChange = useCallback(
    (newAlpha: { a: number }) => {
      // Parse current color to get RGB values
      const cleanHex = value.replace("#", "");
      const r =
        Number.parseInt(
          cleanHex.substring(HEX_PAIR_START_R, HEX_PAIR_LENGTH),
          HEX_RADIX
        ) || 0;
      const g =
        Number.parseInt(
          cleanHex.substring(HEX_PAIR_START_G, HEX_PAIR_END_G),
          HEX_RADIX
        ) || 0;
      const b =
        Number.parseInt(
          cleanHex.substring(HEX_PAIR_START_B, HEX_PAIR_END_B),
          HEX_RADIX
        ) || 0;

      const newColor = rgbaToHex(r, g, b, newAlpha.a);
      onChange(newColor);
      setHexInput(newColor);
    },
    [onChange, rgbaToHex, value]
  );

  const handleHexInput = useCallback(
    (hex: string) => {
      setHexInput(hex);
      // Allow user to type without validation errors
      if (HEX_REGEX.test(hex) && hex.length >= 4) {
        onChange(hex);
      }
    },
    [onChange]
  );

  const handlePresetClick = useCallback(
    (color: string) => {
      onChange(color);
      setHexInput(color);
    },
    [onChange]
  );

  const handleEyeDropper = useCallback(async () => {
    if (!("EyeDropper" in window)) return;

    try {
      // @ts-expect-error - EyeDropper API is not in TypeScript types yet
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      onChange(result.sRGBHex);
      setHexInput(result.sRGBHex);
    } catch {
      // User cancelled or error
    }
  }, [onChange]);

  const buttonSizeClass =
    size === "compact"
      ? "h-6 w-6 min-h-6 min-w-6 rounded-md"
      : "h-8 w-8 rounded-lg";

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger>
        <button
          aria-label="Pick a color"
          className={cn(
            buttonSizeClass,
            "relative cursor-pointer border border-border/60 transition-all",
            "hover:ring-2 hover:ring-primary/20 hover:border-border",
            "focus:outline-none focus:ring-2 focus:ring-primary/30",
            disabled && "pointer-events-none opacity-50"
          )}
          disabled={disabled}
          type="button"
        >
          {/* Checkerboard background for transparency */}
          <div
            className="absolute inset-0 rounded-[inherit]"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
          />
          {/* Color overlay */}
          <div
            className="absolute inset-0 rounded-[inherit]"
            style={{ backgroundColor: value }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[240px] overflow-hidden rounded-xl border-border/60 p-0 shadow-xl"
        sideOffset={8}
      >
        {/* Color picker area */}
        <div className="p-3">
          <Colorful
            className="!w-full"
            color={currentHsva}
            disableAlpha={true}
            onChange={handleColorChange}
            style={{ width: "100%" }}
          />
        </div>

        {/* Alpha slider */}
        <div className="px-3 pb-3">
          <Alpha
            className="!h-3 !rounded-md"
            hsva={currentHsva}
            onChange={handleAlphaChange}
          />
        </div>

        {/* Hex input and eyedropper */}
        <div className="flex items-center gap-2 border-border/50 border-t bg-secondary/30 px-3 py-2">
          <div className="relative flex-1">
            <Input
              className="h-7 bg-background pr-8 font-mono text-xs"
              onChange={(e) => handleHexInput(e.target.value)}
              placeholder="#000000"
              value={hexInput}
            />
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-muted-foreground">
              HEX
            </span>
          </div>
          {"EyeDropper" in window && (
            <button
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={handleEyeDropper}
              title="Pick color from screen"
              type="button"
            >
              <Pipette className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Preset colors */}
        <div className="border-border/50 border-t p-3">
          <div className="grid grid-cols-6 gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                className={cn(
                  "h-6 w-6 rounded-md border transition-all",
                  "hover:scale-110 hover:ring-2 hover:ring-primary/30",
                  value.toLowerCase() === color.toLowerCase()
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border/40"
                )}
                key={color}
                onClick={() => handlePresetClick(color)}
                style={{ backgroundColor: color }}
                title={color}
                type="button"
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
