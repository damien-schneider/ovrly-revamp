import {
  type BoxElement,
  type ChatElement,
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
import { BoxWidget } from "./BoxWidget";
import { ChatWidget } from "./ChatWidget";
import { EmoteWallWidget } from "./EmoteWallWidget";
import { ImageWidget } from "./ImageWidget";
import { OverlayWidget } from "./OverlayWidget";
import { ProgressBarWidget } from "./ProgressBarWidget";
import { TextWidget } from "./TextWidget";
import { TimerWidget } from "./TimerWidget";
import { WebcamWidget } from "./WebcamWidget";

interface ElementRendererProps {
  element: OverlayElement;
  isLiveView?: boolean;
  projectId?: string;
}

export function ElementRenderer({
  element,
  isLiveView = false,
  projectId,
}: ElementRendererProps) {
  if (!element.visible) {
    return null;
  }

  switch (element.type) {
    case ElementType.OVERLAY:
      return (
        <OverlayWidget
          element={element as OverlayContainerElement}
          isLiveView={isLiveView}
        />
      );
    case ElementType.BOX:
      return <BoxWidget element={element as BoxElement} />;
    case ElementType.TEXT:
      return <TextWidget element={element as TextElement} />;
    case ElementType.IMAGE:
      return <ImageWidget element={element as ImageElement} />;
    case ElementType.CHAT:
      return (
        <ChatWidget
          element={element as ChatElement}
          isLiveView={isLiveView}
          projectId={projectId}
        />
      );
    case ElementType.EMOTE_WALL:
      return (
        <EmoteWallWidget
          element={element as EmoteWallElement}
          isLiveView={isLiveView}
          projectId={projectId}
        />
      );
    case ElementType.WEBCAM:
      return (
        <WebcamWidget
          element={element as WebcamElement}
          isLiveView={isLiveView}
        />
      );
    case ElementType.TIMER:
      return <TimerWidget element={element as TimerElement} />;
    case ElementType.PROGRESS:
      return <ProgressBarWidget element={element as ProgressBarElement} />;
    default:
      return null;
  }
}
