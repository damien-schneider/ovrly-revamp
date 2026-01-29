import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";

// ========================================
// Constants
// ========================================

const FINE_CONTROL_MULTIPLIER = 0.1;
const COARSE_CONTROL_MULTIPLIER = 10;
const DEFAULT_SENSITIVITY = 1;

// ========================================
// Figma-style Component Primitives
// ========================================

/**
 * ScrubInput - A draggable number input like Figma
 * - Drag horizontally on the label to scrub values
 * - Hold Shift for fine control (0.1x)
 * - Hold Alt/Option for coarse control (10x)
 * - Click to type directly
 */
export function ScrubInput({
  value,
  onChange,
  label,
  icon,
  min,
  max,
  step = 1,
  sensitivity = DEFAULT_SENSITIVITY,
  suffix,
  className,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  icon?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
  sensitivity?: number;
  suffix?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));
  const startXRef = useRef(0);
  const startValueRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const clampValue = useCallback(
    (val: number) => {
      let clamped = val;
      if (min !== undefined) {
        clamped = Math.max(min, clamped);
      }
      if (max !== undefined) {
        clamped = Math.min(max, clamped);
      }
      return Math.round(clamped / step) * step;
    },
    [min, max, step]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) {
        return;
      }
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      startValueRef.current = value;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startXRef.current;
        let multiplier = sensitivity;

        if (moveEvent.shiftKey) {
          multiplier *= FINE_CONTROL_MULTIPLIER;
        } else if (moveEvent.altKey) {
          multiplier *= COARSE_CONTROL_MULTIPLIER;
        }

        const newValue = clampValue(startValueRef.current + delta * multiplier);
        onChange(newValue);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    },
    [disabled, value, sensitivity, clampValue, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    const parsed = Number.parseFloat(inputValue);
    if (!Number.isNaN(parsed)) {
      onChange(clampValue(parsed));
    }
    setInputValue(String(value));
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setInputValue(String(value));
  };

  const getKeyMultiplier = (e: React.KeyboardEvent) => {
    if (e.shiftKey) {
      return FINE_CONTROL_MULTIPLIER;
    }
    if (e.altKey) {
      return COARSE_CONTROL_MULTIPLIER;
    }
    return 1;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setInputValue(String(value));
      inputRef.current?.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange(clampValue(value + step * getKeyMultiplier(e)));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange(clampValue(value - step * getKeyMultiplier(e)));
    }
  };

  // Update input value when external value changes (and not focused)
  const displayValue = isFocused
    ? inputValue
    : String(Math.round(value * 100) / 100);

  return (
    <div
      className={cn(
        "group flex h-7 items-center overflow-hidden rounded-md bg-secondary/50 transition-all",
        "border border-transparent",
        "hover:bg-secondary/80",
        isDragging && "bg-secondary ring-1 ring-primary/30",
        isFocused && "ring-1 ring-primary/50",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {(icon || label) && (
        <button
          aria-label={`Drag to adjust ${label ?? "value"}`}
          className={cn(
            "flex h-full shrink-0 cursor-ew-resize select-none items-center justify-center border-none bg-transparent px-2",
            "text-muted-foreground transition-colors",
            "hover:text-foreground",
            isDragging && "text-primary"
          )}
          onMouseDown={handleMouseDown}
          type="button"
        >
          {icon || (
            <span className="font-medium text-[10px] uppercase">{label}</span>
          )}
        </button>
      )}
      <input
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent px-1.5 text-right font-medium text-[11px] text-foreground outline-none",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        )}
        disabled={disabled}
        onBlur={handleInputBlur}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        type="text"
        value={displayValue}
      />
      {suffix && (
        <span className="pr-2 text-[10px] text-muted-foreground">{suffix}</span>
      )}
    </div>
  );
}

/**
 * CornerRadiusInput - Individual corner radius controls
 * Shows 4 inputs for TL, TR, BL, BR corners with visual layout
 */
export function CornerRadiusInput({
  values,
  onChange,
  linked,
  onLinkChange,
}: {
  values: { tl: number; tr: number; bl: number; br: number };
  onChange: (corner: "tl" | "tr" | "bl" | "br", value: number) => void;
  linked?: boolean;
  onLinkChange?: (linked: boolean) => void;
}) {
  const handleChange = (corner: "tl" | "tr" | "bl" | "br", value: number) => {
    if (linked) {
      // When linked, update all corners
      onChange("tl", value);
      onChange("tr", value);
      onChange("bl", value);
      onChange("br", value);
    } else {
      onChange(corner, value);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        <ScrubInput
          icon={
            <svg
              aria-hidden="true"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 12 12"
            >
              <path d="M2 6V4a2 2 0 012-2h2" />
            </svg>
          }
          label="Top left radius"
          min={0}
          onChange={(v) => handleChange("tl", v)}
          value={values.tl}
        />
        <ScrubInput
          icon={
            <svg
              aria-hidden="true"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 12 12"
            >
              <path d="M6 2h2a2 2 0 012 2v2" />
            </svg>
          }
          label="Top right radius"
          min={0}
          onChange={(v) => handleChange("tr", v)}
          value={values.tr}
        />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <ScrubInput
          icon={
            <svg
              aria-hidden="true"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 12 12"
            >
              <path d="M2 6v2a2 2 0 002 2h2" />
            </svg>
          }
          label="Bottom left radius"
          min={0}
          onChange={(v) => handleChange("bl", v)}
          value={values.bl}
        />
        <ScrubInput
          icon={
            <svg
              aria-hidden="true"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 12 12"
            >
              <path d="M10 6v2a2 2 0 01-2 2H6" />
            </svg>
          }
          label="Bottom right radius"
          min={0}
          onChange={(v) => handleChange("br", v)}
          value={values.br}
        />
      </div>
      {onLinkChange && (
        <button
          className={cn(
            "flex h-6 w-full items-center justify-center gap-1.5 rounded-md text-[10px] transition-colors",
            linked
              ? "bg-primary/10 text-primary"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
          )}
          onClick={() => onLinkChange(!linked)}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 12 12"
          >
            {linked ? (
              <path d="M4 6h4M3 4v4M9 4v4" />
            ) : (
              <path d="M2 6h2M8 6h2M5 6h2" strokeDasharray="1 1" />
            )}
          </svg>
          {linked ? "Linked" : "Independent"}
        </button>
      )}
    </div>
  );
}

/**
 * OptionalPropertySection - For properties that can be null (not set) vs 0
 * Shows "+" to add, and controls once added with option to remove
 */
export function OptionalPropertySection({
  title,
  isSet,
  onAdd,
  onRemove,
  children,
}: {
  title: string;
  isSet: boolean;
  onAdd: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  if (!isSet) {
    return (
      <div className="border-border/50 border-b">
        <button
          className="flex h-9 w-full items-center justify-between px-3 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          onClick={onAdd}
          type="button"
        >
          <span className="font-medium text-[11px]">{title}</span>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-border/50 border-b">
      <div className="flex h-8 w-full items-center justify-between px-3">
        <span className="font-medium text-[11px] text-foreground">{title}</span>
        <button
          aria-label={`Remove ${title}`}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          title="Remove"
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 12 12"
          >
            <path d="M2 6h8" />
          </svg>
        </button>
      </div>
      <div className="px-3 pb-3">{children}</div>
    </div>
  );
}

export function PanelSection({
  title,
  children,
  onAdd,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-border/50 border-b">
      <div className="flex h-8 w-full items-center justify-between px-3">
        <span className="font-medium text-[11px] text-foreground">{title}</span>
        <div className="flex items-center gap-0.5">
          {actions}
          {onAdd && (
            <Button
              className="flex h-5 w-5 items-center justify-center rounded border-none hover:bg-accent"
              onClick={onAdd}
              size="icon-xs"
              variant="ghost"
            >
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
      <div className="px-3 pb-3">{children}</div>
    </div>
  );
}

export function PropertyRow({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[24px] items-center gap-2", className)}>
      {label && (
        <span className="w-16 shrink-0 truncate text-[11px] text-muted-foreground">
          {label}
        </span>
      )}
      <div className="flex flex-1 items-center gap-1">{children}</div>
    </div>
  );
}

export function CompactInput({
  value,
  onChange,
  icon,
  label,
  type = "number",
  className,
  min,
  max,
  step,
}: {
  value: string | number;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  label?: string;
  type?: "text" | "number";
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div
      className={cn(
        "flex h-6 items-center rounded border border-border/60 bg-background transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 hover:border-border",
        className
      )}
    >
      {icon && (
        <div className="flex h-full items-center justify-center border-border/40 border-r px-1.5 text-muted-foreground">
          {icon}
        </div>
      )}
      {label && (
        <span className="border-border/40 border-r px-1.5 font-medium text-[10px] text-muted-foreground">
          {label}
        </span>
      )}
      <input
        className="h-full w-full bg-transparent px-1.5 text-[11px] text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        max={max}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        type={type}
        value={value}
      />
    </div>
  );
}

export function IconButton({
  icon,
  onClick,
  active,
  disabled,
  tooltip,
  variant = "ghost",
  className,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
  variant?: "ghost" | "subtle";
  className?: string;
}) {
  return (
    <Button
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded border-none transition-colors",
        variant === "ghost" && "hover:bg-accent",
        variant === "subtle" && "hover:bg-accent/50",
        active && "bg-accent text-foreground",
        disabled && "pointer-events-none opacity-40",
        className
      )}
      disabled={disabled}
      onClick={onClick}
      size="icon-xs"
      title={tooltip}
      variant="ghost"
    >
      {icon}
    </Button>
  );
}

export function IconLink({
  icon,
  to,
  tooltip,
  className,
}: {
  icon: React.ReactNode;
  to: string;
  tooltip?: string;
  className?: string;
}) {
  return (
    <Link
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded border-none text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className
      )}
      target="_blank"
      title={tooltip}
      to={to}
    >
      {icon}
    </Link>
  );
}

export function ToggleButton({
  icon,
  checked,
  onChange,
  tooltip,
}: {
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tooltip?: string;
}) {
  return (
    <Button
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded border-none transition-colors",
        checked
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-muted-foreground hover:bg-accent"
      )}
      onClick={() => onChange(!checked)}
      size="icon-xs"
      title={tooltip}
      variant="ghost"
    >
      {icon}
    </Button>
  );
}

export function ColorSwatch({
  color,
  onChange,
  className,
}: {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ColorPicker onChange={onChange} value={color} />
    </div>
  );
}

// Utility to safely extract first value from slider change
export const getSliderValue = (value: number | readonly number[]): number =>
  typeof value === "number" ? value : value[0];
