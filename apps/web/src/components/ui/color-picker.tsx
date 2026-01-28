"use client";

import { Alpha, Colorful, type ColorResult } from "@uiw/react-color";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

  // Convert RGBA to hex
  const rgbaToHex = (r: number, g: number, b: number, a: number) => {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(HEX_RADIX);
      return hex.length === 1 ? `0${hex}` : hex;
    };

    if (a < 1) {
      return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a * RGB_MAX)}`;
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Parse hex to HSVA for the color picker
  const parseHexToHsva = (hex: string) => {
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
  };

  const currentHsva = parseHexToHsva(value);

  const handleColorChange = (color: ColorResult) => {
    const newColor = rgbaToHex(
      color.rgb.r,
      color.rgb.g,
      color.rgb.b,
      color.hsva?.a ?? 1
    );
    onChange(newColor);
  };

  const handleAlphaChange = (newAlpha: { a: number }) => {
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
  };

  const handleHexInput = (hex: string) => {
    // Allow user to type without validation errors
    if (HEX_REGEX.test(hex)) {
      onChange(hex);
    }
  };

  const buttonSizeClass =
    size === "compact"
      ? "h-5 w-5 min-h-5 min-w-5 border p-0 rounded"
      : "h-10 w-10 border-2 p-0";

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger>
        <button
          aria-label="Pick a color"
          className={`${buttonSizeClass} cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all`}
          disabled={disabled}
          style={{ backgroundColor: value }}
          type="button"
        >
          <span className="sr-only">Pick color</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-4">
        <div className="space-y-4">
          <Colorful
            color={currentHsva}
            disableAlpha={true}
            onChange={handleColorChange}
          />

          <Alpha hsva={currentHsva} onChange={handleAlphaChange} />

          <div className="space-y-2">
            <Label htmlFor="hex-input">Hex</Label>
            <Input
              id="hex-input"
              onChange={(e) => handleHexInput(e.target.value)}
              placeholder="#000000"
              value={value}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
