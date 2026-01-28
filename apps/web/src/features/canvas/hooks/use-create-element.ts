import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { useAtomValue } from "jotai";
import { elementsAtom, viewportAtom } from "@/atoms/canvas-atoms";
import { findNewParent } from "@/features/canvas/lib/element-utils";
import { elementToOverlayCreate } from "@/features/canvas/lib/overlay-conversion";
import {
  type BoxElement,
  type ChatElement,
  defaultChatStyle,
  defaultEmoteWallStyle,
  defaultTimerStyle,
  ElementType,
  type EmoteWallElement,
  type ImageElement,
  type OverlayContainerElement,
  type OverlayElement,
  type ProgressBarElement,
  type TextElement,
  type TimerElement,
  type WebcamElement,
} from "@/features/canvas/types";

export function useCreateElement(
  updateElements: (elements: OverlayElement[]) => void,
  setSelectedIds: (ids: string[]) => void,
  setToolMode: (mode: "select" | "hand") => void
) {
  const elements = useAtomValue(elementsAtom);
  const viewport = useAtomValue(viewportAtom);
  const createOverlay = useMutation(api.overlays.create);

  const addElement = async (type: ElementType) => {
    const id = crypto.randomUUID();
    const { scale, position } = viewport;

    // Spawn in center of view
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const worldX = (viewportCenterX - position.x) / scale;
    const worldY = (viewportCenterY - position.y) / scale;

    const maxZ = Math.max(0, ...elements.map((e) => e.zIndex));

    const base = {
      id,
      name: `${type.charAt(0) + type.slice(1).toLowerCase()} ${elements.filter((e) => e.type === type).length + 1}`,
      x: worldX - 100,
      y: worldY - 100,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + 1,
      locked: false,
      visible: true,
    };

    let newElement: OverlayElement | null = null;

    switch (type) {
      case ElementType.OVERLAY:
        newElement = {
          ...base,
          type: ElementType.OVERLAY,
          width: 1280,
          height: 720,
          x: worldX - 640,
          y: worldY - 360,
          backgroundColor: "rgba(255,255,255,0.1)",
          name: `Overlay ${elements.filter((e) => e.type === ElementType.OVERLAY).length + 1}`,
        } as OverlayContainerElement;
        break;
      case ElementType.TEXT:
        newElement = {
          ...base,
          type: ElementType.TEXT,
          width: 300,
          height: 80,
          x: worldX - 150,
          y: worldY - 40,
          content: "New Text Layer",
          fontFamily: "Inter",
          fontSize: 48,
          color: "#111827",
          fontWeight: "bold",
          textAlign: "left",
        } as TextElement;
        break;
      case ElementType.BOX:
        newElement = {
          ...base,
          type: ElementType.BOX,
          backgroundColor: "#3b82f6",
          borderColor: "#1d4ed8",
          borderWidth: 0,
          borderRadius: 16,
        } as BoxElement;
        break;
      case ElementType.IMAGE:
        newElement = {
          ...base,
          type: ElementType.IMAGE,
          src: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=400",
          objectFit: "cover",
        } as ImageElement;
        break;
      case ElementType.CHAT:
        newElement = {
          ...base,
          type: ElementType.CHAT,
          width: 400,
          height: 500,
          x: worldX - 200,
          y: worldY - 250,
          style: { ...defaultChatStyle },
          mockMessages: [
            {
              user: "StreamFan",
              text: "This looks amazing!",
              color: "#ff5555",
              badges: ["subscriber"],
            },
            {
              user: "ModBot",
              text: "Enjoy the stream.",
              color: "#55ff55",
              badges: ["moderator"],
            },
          ],
          previewEnabled: false,
        } as ChatElement;
        break;
      case ElementType.EMOTE_WALL:
        newElement = {
          ...base,
          type: ElementType.EMOTE_WALL,
          density: 5,
          speed: 1,
          direction: "up",
          width: 400,
          height: 400,
          x: worldX - 200,
          y: worldY - 200,
          style: { ...defaultEmoteWallStyle },
          previewEnabled: false,
        } as EmoteWallElement;
        break;
      case ElementType.WEBCAM:
        newElement = {
          ...base,
          type: ElementType.WEBCAM,
          width: 480,
          height: 270,
          x: worldX - 240,
          y: worldY - 135,
          borderColor: "#ffffff",
          borderWidth: 4,
          borderRadius: 12,
          shape: "rectangle",
          shadowColor: "rgba(0,0,0,0.5)",
          shadowBlur: 20,
        } as WebcamElement;
        break;
      case ElementType.TIMER:
        newElement = {
          ...base,
          type: ElementType.TIMER,
          width: 240,
          height: 80,
          x: worldX - 120,
          y: worldY - 40,
          mode: "countdown",
          targetDate: new Date(Date.now() + 600_000).toISOString(),
          fontFamily: "Inter",
          fontSize: 64,
          color: "#111827",
          style: { ...defaultTimerStyle },
          isRunning: false,
          elapsedMs: 0,
        } as TimerElement;
        break;
      case ElementType.PROGRESS:
        newElement = {
          ...base,
          type: ElementType.PROGRESS,
          width: 400,
          height: 32,
          x: worldX - 200,
          y: worldY - 16,
          progress: 75,
          barColor: "#3b82f6",
          backgroundColor: "#e2e8f0",
          borderRadius: 16,
          showLabel: false,
          labelColor: "#ffffff",
          labelPosition: "inside",
          animated: false,
          stripes: false,
        } as ProgressBarElement;
        break;
      default:
        break;
    }

    if (newElement) {
      try {
        // Calculate parentId based on element position (skip for OVERLAY containers)
        const centerX = newElement.x + newElement.width / 2;
        const centerY = newElement.y + newElement.height / 2;
        const parentId =
          newElement.type === ElementType.OVERLAY
            ? null
            : findNewParent(elements, centerX, centerY, id);

        const elementWithParent = {
          ...newElement,
          parentId,
        };

        // Convert element to backend format and create
        const createArgs = elementToOverlayCreate(elementWithParent);
        const backendId = await createOverlay(createArgs);

        // Update element with backend ID
        const elementWithBackendId = {
          ...elementWithParent,
          id: backendId,
        };

        // Add to local state
        updateElements([...elements, elementWithBackendId]);
        setSelectedIds([backendId]);
        setToolMode("select");
      } catch (error) {
        throw new Error(
          `Failed to create element: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  };

  return addElement;
}
