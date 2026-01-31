import { Link } from "@tanstack/react-router";
import { useAtom, useAtomValue } from "jotai";
import {
  Download,
  Eye,
  Link2,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  elementsAtom,
  isPropertiesPanelCollapsedAtom,
  selectedIdsAtom,
} from "@/atoms/canvas-atoms";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { IconButton, PanelSection } from "./primitives";
import { AppearanceSection } from "./sections/AppearanceSection";
import { BlendModeSection } from "./sections/BlendModeSection";
import {
  BoxCornerRadiusSection,
  BoxFillSection,
  BoxStrokeSection,
} from "./sections/BoxSection";
import { ChatSection } from "./sections/ChatSection";
import { ClipSection } from "./sections/ClipSection";
import { EmoteWallSection } from "./sections/EmoteWallSection";
import { FiltersSection } from "./sections/FiltersSection";
import { ImageSection } from "./sections/ImageSection";
import { LayoutSection } from "./sections/LayoutSection";
import { OverlaySection } from "./sections/OverlaySection";
import { PositionSection } from "./sections/PositionSection";
import { ProgressBarSection } from "./sections/ProgressBarSection";
import { TextSection } from "./sections/TextSection";
import { TimerSection } from "./sections/TimerSection";
import { WebcamSection } from "./sections/WebcamSection";

interface PropertiesPanelProps {
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
  onDelete: (id: string) => void;
  onExport: (id?: string) => void;
}

export function PropertiesPanel({
  onUpdate,
  onDelete,
  onExport,
}: PropertiesPanelProps) {
  const elements = useAtomValue(elementsAtom);
  const selectedIds = useAtomValue(selectedIdsAtom);
  const [isCollapsed, setIsCollapsed] = useAtom(isPropertiesPanelCollapsedAtom);

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const element = selectedElements[0];

  // Collapsed state - just show toggle button
  if (isCollapsed) {
    return (
      <div className="fixed top-6 right-6 z-100">
        <Button
          className="h-8 w-8 shadow-lg"
          onClick={() => setIsCollapsed(false)}
          size="icon"
          variant="outline"
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Element Selected View
  if (element) {
    return (
      <div className="fixed top-4 right-4 bottom-4 z-90 flex w-[260px] flex-col overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-sm">
        {/* Panel Header */}
        <div className="flex h-10 items-center justify-between border-border/50 border-b px-3">
          <span className="font-semibold text-[11px] text-foreground">
            Properties
          </span>
          <div className="flex items-center gap-1">
            <IconButton
              icon={<Trash2 className="h-3.5 w-3.5 text-destructive" />}
              onClick={() => onDelete(element.id)}
              tooltip="Delete"
            />
            <IconButton
              icon={<PanelRightClose className="h-3.5 w-3.5" />}
              onClick={() => setIsCollapsed(true)}
              tooltip="Close panel"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Element Type Header */}
          <div className="flex items-center justify-between border-border/50 border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[11px] text-foreground capitalize">
                {element.type.toLowerCase().replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Common Sections */}
          <PositionSection element={element} onUpdate={onUpdate} />
          <LayoutSection element={element} onUpdate={onUpdate} />
          <AppearanceSection element={element} onUpdate={onUpdate} />
          <ClipSection element={element} onUpdate={onUpdate} />
          <BlendModeSection element={element} onUpdate={onUpdate} />
          <FiltersSection element={element} onUpdate={onUpdate} />

          {/* Element-specific sections */}
          {element.type === ElementType.OVERLAY && (
            <OverlaySection
              element={element as OverlayContainerElement}
              onUpdate={onUpdate}
            />
          )}

          {element.type === ElementType.TEXT && (
            <TextSection element={element as TextElement} onUpdate={onUpdate} />
          )}

          {element.type === ElementType.BOX && (
            <>
              <BoxFillSection
                element={element as BoxElement}
                onUpdate={onUpdate}
              />
              <BoxStrokeSection
                element={element as BoxElement}
                onUpdate={onUpdate}
              />
              <BoxCornerRadiusSection
                element={element as BoxElement}
                onUpdate={onUpdate}
              />
            </>
          )}

          {element.type === ElementType.IMAGE && (
            <ImageSection
              element={element as ImageElement}
              onUpdate={onUpdate}
            />
          )}

          {element.type === ElementType.CHAT && (
            <ChatSection element={element as ChatElement} onUpdate={onUpdate} />
          )}

          {element.type === ElementType.EMOTE_WALL && (
            <EmoteWallSection
              element={element as EmoteWallElement}
              onUpdate={onUpdate}
            />
          )}

          {element.type === ElementType.TIMER && (
            <TimerSection
              element={element as TimerElement}
              onUpdate={onUpdate}
            />
          )}

          {element.type === ElementType.PROGRESS && (
            <ProgressBarSection
              element={element as ProgressBarElement}
              onUpdate={onUpdate}
            />
          )}

          {element.type === ElementType.WEBCAM && (
            <WebcamSection
              element={element as WebcamElement}
              onUpdate={onUpdate}
            />
          )}

          {/* Actions Section */}
          <PanelSection title="Actions">
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="h-8 gap-1.5 text-[11px]"
                onClick={() => {
                  const elementUrl = `${window.location.origin}/view/overlay/${element.id}`;
                  navigator.clipboard.writeText(elementUrl);
                  toast.success("Element URL copied!");
                }}
                variant="outline"
              >
                <Link2 className="h-3.5 w-3.5" /> Link
              </Button>
              <Button
                className="h-8 gap-1.5 text-[11px]"
                render={(props, ref) => (
                  <Link
                    {...props}
                    ref={ref}
                    target="_blank"
                    to={`/view/overlay/${element.id}`}
                  />
                )}
                variant="outline"
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </Button>
              <Button
                className="h-8 gap-1.5 text-[11px]"
                onClick={() => onExport(element.id)}
                variant="outline"
              >
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </PanelSection>
        </ScrollArea>
      </div>
    );
  }

  // No Selection View (Project Settings)
  return (
    <div className="fixed top-4 right-4 bottom-4 z-90 flex w-[260px] flex-col overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-sm">
      {/* Panel Header */}
      <div className="flex h-10 items-center justify-between border-border/50 border-b px-3">
        <span className="font-bold text-[13px] tracking-tight">Ovrly</span>
        <IconButton
          icon={<PanelRightClose className="h-3.5 w-3.5" />}
          onClick={() => setIsCollapsed(true)}
          tooltip="Close panel"
        />
      </div>

      <ScrollArea className="flex-1">
        {/* Info Section */}
        <div className="border-border/50 border-b px-3 py-4">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Design pixel-perfect stream overlays. Select a layer to customize or
            add one from the toolbar.
          </p>
        </div>

        {/* Shortcuts Section */}
        <PanelSection title="Quick Shortcuts">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Pan Canvas
              </span>
              <kbd className="flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
                H
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Select Tool
              </span>
              <kbd className="flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
                V
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Undo</span>
              <kbd className="flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
                ⌘Z
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Redo</span>
              <kbd className="flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
                ⌘⇧Z
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Delete</span>
              <kbd className="flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
                ⌫
              </kbd>
            </div>
          </div>
        </PanelSection>
      </ScrollArea>

      {/* Export Footer */}
      <div className="border-border/50 border-t p-3">
        <Button
          className="h-8 w-full gap-1.5 text-[11px]"
          onClick={() => onExport()}
          variant="outline"
        >
          <Download className="h-3.5 w-3.5" /> Export Project
        </Button>
      </div>
    </div>
  );
}
