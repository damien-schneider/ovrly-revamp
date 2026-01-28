import { ChevronDown, Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";

// ========================================
// Figma-style Component Primitives
// ========================================

export function PanelSection({
  title,
  children,
  defaultOpen = true,
  onAdd,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onAdd?: () => void;
  actions?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-border/50 border-b">
      <div className="flex h-8 w-full items-center justify-between px-3 transition-colors hover:bg-accent/50">
        <button
          className="flex flex-1 items-center gap-1.5 border-none bg-transparent p-0 text-left outline-none"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <ChevronDown
            className={cn(
              "h-3 w-3 text-muted-foreground transition-transform",
              !isOpen && "-rotate-90"
            )}
          />
          <span className="font-medium text-[11px] text-foreground">
            {title}
          </span>
        </button>
        <div className="flex items-center gap-0.5">
          {actions}
          {onAdd && (
            <Button
              className="flex h-5 w-5 items-center justify-center rounded border-none hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              size="icon-xs"
              variant="ghost"
            >
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
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
  href,
  tooltip,
  className,
}: {
  icon: React.ReactNode;
  href: string;
  tooltip?: string;
  className?: string;
}) {
  return (
    <a
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded border-none text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className
      )}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      title={tooltip}
    >
      {icon}
    </a>
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
