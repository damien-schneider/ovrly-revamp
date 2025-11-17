import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useAtomValue } from "jotai";
import { Resizable } from "re-resizable";
import { getChatSettingsAtom } from "@/atoms/chat-settings-atoms";
import ChatOverlay from "@/features/chat/components/chat-overlay";
import { ResizeHandle } from "@/features/overlay/components/resize-handle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(with_navbar)/overlays/chat/$id")({
  beforeLoad: ({ context, location }) => {
    // Access userId from parent route context (set in __root.tsx beforeLoad)
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
  const settingsAtom = getChatSettingsAtom(id as Id<"overlays">);
  const settings = useAtomValue(settingsAtom);

  // Get border radius for the dashed border overlay
  const containerBorderRadius = settings?.containerBorderRadius ?? 0;

  if (!overlay) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative flex size-full flex-col items-center justify-center overflow-hidden p-4">
      <Resizable
        defaultSize={{
          width: 400,
          height: 600,
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
        minHeight={200}
        minWidth={200}
        scale={0.5}
      >
        <div
          className={cn(
            "relative size-full",
            "after:pointer-events-none after:absolute after:inset-[-2px] after:rounded-[calc(var(--border-radius-chat-container)+2px)] after:border after:border-muted-foreground/50 after:border-dashed after:transition-all"
          )}
          style={{
            ["--border-radius-chat-container" as string]: `${containerBorderRadius}px`,
          }}
        >
          <ChatOverlay overlayId={id as Id<"overlays">} useEditMode={true} />
        </div>
      </Resizable>
    </div>
  );
}
