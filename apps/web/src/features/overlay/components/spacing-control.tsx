"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Link, LinkBreak } from "@phosphor-icons/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

const DRAG_THRESHOLD_PX = 3;

type SpacingControlProps = {
  label?: string;
  values: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  onChange: (values: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  }) => void;
  min?: number;
  max?: number;
};

type DraggableInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  position: "top" | "right" | "bottom" | "left";
};

function _DraggableInput({
  value,
  onChange: onInputChange,
  min = 0,
  max = 100,
  position,
}: DraggableInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const startYRef = useRef(0);
  const startValueRef = useRef(0);
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    hasDraggedRef.current = false;
    startYRef.current = e.clientY;
    startValueRef.current = value;
  };

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      const deltaY = Math.abs(startYRef.current - e.clientY);

      // Mark as dragged if moved more than threshold pixels
      if (deltaY > DRAG_THRESHOLD_PX) {
        hasDraggedRef.current = true;
      }

      if (hasDraggedRef.current) {
        const signedDeltaY = startYRef.current - e.clientY; // Inverted so dragging up increases
        const newValue = Math.max(
          min,
          Math.min(max, startValueRef.current + Math.round(signedDeltaY / 2))
        );
        onInputChange(newValue);
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);

      // Only open popover if we didn't drag
      if (!hasDraggedRef.current) {
        setIsPopoverOpen(true);
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, min, max, onInputChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const numValue = Number.parseInt(inputValue, 10);
    if (Number.isNaN(numValue)) {
      setInputValue(value.toString());
    } else {
      onInputChange(Math.max(min, Math.min(max, numValue)));
      setIsPopoverOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  const positionStyles = {
    top: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
    right: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
    bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
    left: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  return (
    <Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
      <TooltipProvider>
        <Tooltip>
          <PopoverTrigger asChild={true}>
            <TooltipTrigger asChild={true}>
              <div
                className={cn(
                  "absolute z-10 flex items-center gap-1",
                  positionStyles[position]
                )}
              >
                <Button
                  className={cn(
                    "h-7 w-12 cursor-ns-resize select-none border font-medium text-xs hover:bg-background",
                    isDragging && "border-accent bg-background"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={handleMouseDown}
                  size="sm"
                  variant="secondary"
                >
                  {value}
                </Button>
              </div>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent>
            <p className="text-xs">Drag to change or click to type</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent align="center" className="w-auto p-3">
        <div className="space-y-2">
          <Label className="text-xs" htmlFor={`spacing-input-${position}`}>
            {position.charAt(0).toUpperCase() + position.slice(1)} (px)
          </Label>
          <Input
            autoFocus={true}
            className="h-8 w-20"
            id={`spacing-input-${position}`}
            max={max}
            min={min}
            onBlur={handleInputBlur}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            type="number"
            value={inputValue}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function getDisplayValue(
  isLinked: boolean,
  values: SpacingControlProps["values"]
) {
  return isLinked
    ? (values.top ?? 0)
    : `${values.top ?? 0} ${values.right ?? 0} ${values.bottom ?? 0} ${values.left ?? 0}`;
}

export function SpacingControl({
  label = "Spacing",
  values,
  onChange,
  min = 0,
  max = 100,
}: SpacingControlProps) {
  const [isLinked, setIsLinked] = useState(true);

  const handleChange = (
    side: "top" | "right" | "bottom" | "left",
    value: number
  ) => {
    if (isLinked) {
      onChange({
        top: value,
        right: value,
        bottom: value,
        left: value,
      });
    } else {
      onChange({
        ...values,
        [side]: value,
      });
    }
  };

  const handleLinkToggle = () => {
    if (!isLinked) {
      // When linking, set all values to top value
      const uniformValue = values.top ?? 0;
      onChange({
        top: uniformValue,
        right: uniformValue,
        bottom: uniformValue,
        left: uniformValue,
      });
    }
    setIsLinked(!isLinked);
  };

  const displayValue = getDisplayValue(isLinked, values);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {typeof displayValue === "number"
              ? `${displayValue}px`
              : displayValue}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild={true}>
                <Button
                  className="h-7 w-7"
                  onClick={handleLinkToggle}
                  size="icon"
                  variant="ghost"
                >
                  {isLinked ? (
                    <Link className="h-3.5 w-3.5" weight="regular" />
                  ) : (
                    <LinkBreak className="h-3.5 w-3.5" weight="regular" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {isLinked ? "Unlink sides" : "Link sides"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Visual Spacing Editor */}
      <div className="relative flex aspect-[3/2] w-full items-center justify-center rounded-2xl border-2 border-muted-foreground/20 border-dashed bg-muted/30">
        {/* Inner box representing content */}
        <div className="flex h-1/2 w-1/2 items-center justify-center rounded-xl border bg-primary/10">
          <div className="font-medium text-[10px] text-muted-foreground">
            Content
          </div>
        </div>

        {/* Top */}
        <_DraggableInput
          max={max}
          min={min}
          onChange={(v) => handleChange("top", v)}
          position="top"
          value={values.top ?? 0}
        />

        {/* Right */}
        {!isLinked && (
          <_DraggableInput
            max={max}
            min={min}
            onChange={(v) => handleChange("right", v)}
            position="right"
            value={values.right ?? 0}
          />
        )}

        {/* Bottom */}
        {!isLinked && (
          <_DraggableInput
            max={max}
            min={min}
            onChange={(v) => handleChange("bottom", v)}
            position="bottom"
            value={values.bottom ?? 0}
          />
        )}

        {/* Left */}
        {!isLinked && (
          <_DraggableInput
            max={max}
            min={min}
            onChange={(v) => handleChange("left", v)}
            position="left"
            value={values.left ?? 0}
          />
        )}
      </div>
    </div>
  );
}
