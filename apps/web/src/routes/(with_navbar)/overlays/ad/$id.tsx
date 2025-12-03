import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useAtomValue } from "jotai";
import { Resizable } from "re-resizable";
import { useEffect, useRef, useState } from "react";
import { getAdSettingsAtom } from "@/atoms/ad-settings-atoms";
import AdOverlay from "@/features/ad/components/ad-overlay";
import { OverlayNotFound } from "@/features/overlay/components/overlay-not-found";
import { ResizeHandle } from "@/features/overlay/components/resize-handle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(with_navbar)/overlays/ad/$id")({
  beforeLoad: ({ context, location }) => {
    const userId = (context as { userId?: string }).userId;

    if (!userId) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const overlay = useQuery(api.overlays.getById, { id: id as Id<"overlays"> });
  const settingsAtom = getAdSettingsAtom(id as Id<"overlays">);
  const settings = useAtomValue(settingsAtom);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxDimensions, setMaxDimensions] = useState({
    width: 800,
    height: 600,
  });

  const containerBorderRadius = settings?.containerBorderRadius ?? 0;

  useEffect(() => {
    const updateMaxDimensions = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const padding = 32;
        const scale = 0.5;
        setMaxDimensions({
          width: (container.clientWidth - padding) / scale,
          height: (container.clientHeight - padding) / scale,
        });
      }
    };

    updateMaxDimensions();

    const resizeObserver = new ResizeObserver(updateMaxDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // undefined = loading, null = not found
  if (overlay === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (overlay === null) {
    return <OverlayNotFound />;
  }

  return (
    <div className="relative size-full overflow-hidden p-4" ref={containerRef}>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2">
        <Resizable
          defaultSize={{
            width: 600,
            height: 200,
          }}
          enable={{
            top: false,
            right: false,
            bottom: false,
            left: false,
            topRight: false,
            bottomRight: true,
            bottomLeft: false,
            topLeft: false,
          }}
          handleComponent={{
            bottomRight: (
              <div className="-right-2 -bottom-2 absolute flex h-8 w-8 rotate-180 scale-125 items-end justify-end p-1 text-neutral-400">
                <ResizeHandle />
              </div>
            ),
          }}
          maxHeight={maxDimensions.height}
          maxWidth={maxDimensions.width}
          minHeight={100}
          minWidth={200}
          scale={0.5}
        >
          <div
            className={cn(
              "relative size-full",
              "after:pointer-events-none after:absolute after:inset-[-2px] after:rounded-[calc(var(--border-radius-ad-container)+2px)] after:border after:border-muted-foreground/50 after:border-dashed after:transition-all"
            )}
            style={{
              ["--border-radius-ad-container" as string]: `${containerBorderRadius}px`,
            }}
          >
            <AdOverlay overlayId={id as Id<"overlays">} useEditMode={true} />
          </div>
        </Resizable>
      </div>
    </div>
  );
}
