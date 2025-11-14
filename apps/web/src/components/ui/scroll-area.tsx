"use client";

import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import {
  Children,
  type ComponentProps,
  cloneElement,
  isValidElement,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type Mask = {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
};

function ScrollArea({
  className,
  children,
  scrollHideDelay = 0,
  maskHeight = 30,
  maskClassName,
  hideMaskTop = false,
  hideMaskBottom = false,
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  /**
   * `maskHeight` is the height of the mask in pixels.
   * pass `0` to disable the mask
   * @default 30
   */
  maskHeight?: number;
  maskClassName?: string;
  /**
   * Hide the top mask gradient
   * @default false
   */
  hideMaskTop?: boolean;
  /**
   * Hide the bottom mask gradient
   * @default false
   */
  hideMaskBottom?: boolean;
}) {
  const [showMask, setShowMask] = useState<Mask>({
    top: false,
    bottom: false,
    left: false,
    right: false,
  });
  const viewportRef = useRef<HTMLDivElement>(null);

  const checkScrollability = useCallback(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    const {
      scrollTop,
      scrollLeft,
      scrollWidth,
      clientWidth,
      scrollHeight,
      clientHeight,
    } = element;
    setShowMask({
      top: scrollTop > 0,
      bottom: scrollTop + clientHeight < scrollHeight - 1,
      left: scrollLeft > 0,
      right: scrollLeft + clientWidth < scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const element = viewportRef.current;
    if (!element) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const resizeObserver = new ResizeObserver(checkScrollability);
    resizeObserver.observe(element);

    element.addEventListener("scroll", checkScrollability, { signal });
    window.addEventListener("resize", checkScrollability, { signal });

    checkScrollability();

    return () => {
      controller.abort();
      resizeObserver.disconnect();
    };
  }, [checkScrollability]);

  const hasViewportChild = Children.toArray(children).some(
    (child) => isValidElement(child) && child.type === ScrollAreaViewport
  );

  return (
    <ScrollAreaPrimitive.Root
      className={cn("relative min-h-0 overflow-hidden", className)}
      data-slot="scroll-area"
      scrollHideDelay={scrollHideDelay}
      {...props}
    >
      {hasViewportChild ? (
        Children.map(children, (child) =>
          isValidElement(child) && child.type === ScrollAreaViewport
            ? cloneElement(
                child as ReactElement<
                  ComponentProps<typeof ScrollAreaViewport>
                >,
                {
                  ref: viewportRef,
                  showMask: maskHeight > 0 ? showMask : undefined,
                  hideMaskTop,
                  hideMaskBottom,
                  maskClassName,
                }
              )
            : child
        )
      ) : (
        <ScrollAreaViewport
          hideMaskBottom={hideMaskBottom}
          hideMaskTop={hideMaskTop}
          maskClassName={maskClassName}
          ref={viewportRef}
          showMask={maskHeight > 0 ? showMask : undefined}
        >
          {children}
        </ScrollAreaViewport>
      )}
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollAreaViewport({
  className,
  children,
  ref,
  showMask,
  hideMaskTop = false,
  hideMaskBottom = false,
  maskClassName,
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaViewport> & {
  ref?: React.Ref<HTMLDivElement>;
  showMask?: Mask;
  hideMaskTop?: boolean;
  hideMaskBottom?: boolean;
  maskClassName?: string;
}) {
  return (
    <ScrollAreaPrimitive.Viewport
      className={cn(
        "size-full rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        showMask?.top && !hideMaskTop && "mask-t-from-[calc(100%-2rem)]",
        showMask?.bottom && !hideMaskBottom && "mask-b-from-[calc(100%-2rem)]",
        showMask?.left && "mask-l-from-[calc(100%-2rem)]",
        showMask?.right && "mask-r-from-[calc(100%-2rem)]",
        maskClassName,
        className
      )}
      data-slot="scroll-area-viewport"
      ref={ref}
      {...props}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      className={cn(
        "data-[state=visible]:fade-in-0 data-[state=hidden]:fade-out-0 z-10 flex touch-none select-none p-px transition-[colors] duration-150 hover:bg-muted data-[state=hidden]:animate-out data-[state=visible]:animate-in dark:hover:bg-muted/50",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent px-1",
        className
      )}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        className={cn(
          "relative flex-1 origin-center rounded-full bg-border transition-[scale]",
          orientation === "vertical" && "my-1 active:scale-y-95",
          orientation === "horizontal" && "active:scale-x-98"
        )}
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar, ScrollAreaViewport };
