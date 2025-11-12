"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function getDefaultValues(
  value: number | number[] | undefined,
  defaultValue: number | number[] | undefined,
  min: number,
  max: number
): number[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (Array.isArray(defaultValue)) {
    return defaultValue;
  }
  return [min, max];
}

type SliderVariant = "default" | "horizontal-thumb";

interface SliderProps extends ComponentProps<typeof SliderPrimitive.Root> {
  variant?: SliderVariant;
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  variant = "horizontal-thumb",
  ...props
}: SliderProps) {
  const _values = getDefaultValues(value, defaultValue, min, max);

  if (variant === "horizontal-thumb") {
    const FULL_PERCENTAGE = 100;
    const GAP_PX = 8; // 8px gap on each side of thumb = 16px total
    const isRange = _values.length > 1;

    // For range: calculate percentages for both thumbs
    const startValue = _values[0] ?? min;
    const endValue = isRange ? (_values[1] ?? max) : startValue;
    const startPercentage =
      ((startValue - min) / (max - min)) * FULL_PERCENTAGE;
    const endPercentage = ((endValue - min) / (max - min)) * FULL_PERCENTAGE;

    return (
      <SliderPrimitive.Root
        className={cn(
          "relative flex h-6 w-full touch-none select-none items-center data-disabled:opacity-50",
          className
        )}
        data-slot="slider"
        defaultValue={defaultValue}
        max={max}
        min={min}
        value={value}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-full w-full cursor-pointer">
          {isRange ? (
            <>
              {/* Left inactive track (before first thumb) */}
              <div
                className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-0 h-1.5 rounded-full bg-accent transition-all duration-150 ease-out"
                style={{
                  width: `calc(${startPercentage}% - ${GAP_PX}px)`,
                }}
              />

              {/* Active range between thumbs */}
              <SliderPrimitive.Range
                className="-translate-y-1/2 pointer-events-none absolute top-1/2 h-1.5 rounded-full bg-muted-foreground transition-all duration-150 ease-out"
                style={{
                  left: `${startPercentage}%`,
                  width: `${endPercentage - startPercentage}%`,
                }}
              />

              {/* Right inactive track (after second thumb) */}
              <div
                className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-0 h-1.5 rounded-full bg-accent transition-all duration-150 ease-out"
                style={{
                  width: `calc(${FULL_PERCENTAGE - endPercentage}% - ${GAP_PX}px)`,
                }}
              />

              {/* First decorative thumb */}
              <div
                className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 z-20 h-6 w-1 scale-100 rounded-full bg-muted-foreground shadow-sm transition-all duration-150 ease-out"
                style={{
                  left: `${startPercentage}%`,
                }}
              />

              {/* Second decorative thumb */}
              <div
                className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 z-20 h-6 w-1 scale-100 rounded-full bg-muted-foreground shadow-sm transition-all duration-150 ease-out"
                style={{
                  left: `${endPercentage}%`,
                }}
              />
            </>
          ) : (
            <>
              {/* Single value: left active track */}
              <SliderPrimitive.Range
                className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-0 h-1.5 rounded-full bg-muted-foreground transition-all duration-150 ease-out"
                style={{
                  width: `calc(${startPercentage}% - ${GAP_PX}px)`,
                }}
              />

              {/* Single value: right inactive track */}
              <div
                className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-0 h-1.5 rounded-full bg-accent transition-all duration-150 ease-out"
                style={{
                  width: `calc(${FULL_PERCENTAGE - startPercentage}% - ${GAP_PX}px)`,
                }}
              />

              {/* Single decorative thumb */}
              <div
                className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 z-20 h-6 w-1 scale-100 rounded-full bg-muted-foreground shadow-sm transition-all duration-150 ease-out"
                style={{
                  left: `${startPercentage}%`,
                }}
              />
            </>
          )}
        </SliderPrimitive.Track>

        {_values.map((_, index) => (
          <SliderPrimitive.Thumb
            className="relative z-10 block h-6 w-5 cursor-pointer opacity-0 transition-transform duration-150 ease-out hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            data-slot="slider-thumb"
            // biome-ignore lint/suspicious/noArrayIndexKey: Index is stable for sliders and represents thumb position
            key={index}
          />
        ))}
      </SliderPrimitive.Root>
    );
  }
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-disabled:opacity-50",
        className
      )}
      data-slot="slider"
      defaultValue={defaultValue}
      max={max}
      min={min}
      value={value}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-1.5"
        )}
        data-slot="slider-track"
      >
        <SliderPrimitive.Range
          className={cn(
            "absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
          data-slot="slider-range"
        />
      </SliderPrimitive.Track>
      {_values.map((_, index) => (
        <SliderPrimitive.Thumb
          className="block size-4 shrink-0 rounded-full border border-primary bg-background shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:outline-hidden focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50"
          data-slot="slider-thumb"
          // biome-ignore lint/suspicious/noArrayIndexKey: Index is stable for sliders and represents thumb position
          key={index}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
