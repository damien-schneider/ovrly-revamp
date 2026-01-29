import { useAtom, useAtomValue } from "jotai";
import {
  BarChartHorizontal,
  Camera,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  GripHorizontal,
  Image as ImageIcon,
  Layers,
  Layout,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Square,
  Type,
} from "lucide-react";
import {
  elementsAtom,
  isLayersPanelCollapsedAtom,
  selectedIdsAtom,
} from "@/atoms/canvas-atoms";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ElementType, type OverlayElement } from "@/features/canvas/types";
import { cn } from "@/lib/utils";

interface LayersPanelProps {
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

function getIcon(type: ElementType) {
  const iconClass = "h-3.5 w-3.5";
  switch (type) {
    case ElementType.OVERLAY:
      return <Layout className={iconClass} />;
    case ElementType.TEXT:
      return <Type className={iconClass} />;
    case ElementType.BOX:
      return <Square className={iconClass} />;
    case ElementType.IMAGE:
      return <ImageIcon className={iconClass} />;
    case ElementType.CHAT:
      return <MessageSquare className={iconClass} />;
    case ElementType.EMOTE_WALL:
      return <GripHorizontal className={iconClass} />;
    case ElementType.WEBCAM:
      return <Camera className={iconClass} />;
    case ElementType.TIMER:
      return <Clock className={iconClass} />;
    case ElementType.PROGRESS:
      return <BarChartHorizontal className={iconClass} />;
    default:
      return <Square className={iconClass} />;
  }
}

export function LayersPanel({ onUpdate }: LayersPanelProps) {
  const elements = useAtomValue(elementsAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedIdsAtom);
  const [isCollapsed, setIsCollapsed] = useAtom(isLayersPanelCollapsedAtom);

  const rootItems = elements
    .filter((el) => !el.parentId)
    .sort((a, b) => b.zIndex - a.zIndex);

  const handleSelect = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const renderItem = (element: OverlayElement, depth = 0) => {
    const isSelected = selectedIds.includes(element.id);
    const children = elements
      .filter((el) => el.parentId === element.id)
      .sort((a, b) => b.zIndex - a.zIndex);

    return (
      <div className="flex flex-col" key={element.id}>
        <div
          className={cn(
            "group flex h-7 w-full select-none items-center gap-2 px-2 transition-colors",
            isSelected
              ? "bg-secondary text-secondary-foreground"
              : "text-foreground hover:bg-accent"
          )}
        >
          <div
            className="flex min-w-0 flex-1 items-center gap-2"
            style={{ paddingLeft: `${depth * 10}px` }}
          >
            <button
              className={cn(
                "shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100",
                !element.visible && "opacity-60",
                isSelected
                  ? "text-secondary-foreground hover:bg-accent"
                  : "text-muted-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(element.id, { visible: !element.visible });
              }}
              title={element.visible ? "Hide layer" : "Show layer"}
              type="button"
            >
              {element.visible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </button>

            <button
              className="flex min-w-0 flex-1 items-center gap-2 border-none bg-transparent p-0 text-left outline-none"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(element.id, e.shiftKey || e.metaKey);
              }}
              type="button"
            >
              <span
                className={cn(
                  "shrink-0",
                  isSelected
                    ? "text-secondary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {getIcon(element.type)}
              </span>
              <span className="truncate font-medium text-[11px] leading-none">
                {element.name || element.type}
              </span>
            </button>
          </div>

          {children.length > 0 && (
            <ChevronDown
              className={cn(
                "h-3 w-3 shrink-0 opacity-60",
                isSelected
                  ? "text-secondary-foreground"
                  : "text-muted-foreground"
              )}
            />
          )}
        </div>
        {children.length > 0 && (
          <div className="flex flex-col">
            {children.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="fixed top-[60px] left-4 z-100 flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/95 shadow-lg backdrop-blur-sm">
        <Button
          className="h-8 w-8 border-none text-foreground transition-colors hover:bg-accent"
          onClick={() => setIsCollapsed(false)}
          size="icon-xs"
          variant="ghost"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-[60px] bottom-4 left-4 z-90 flex w-[240px] flex-col overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-sm transition-all duration-300">
      <div className="flex h-10 items-center justify-between border-border/50 border-b px-3">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-bold text-[11px] text-foreground tracking-tight">
            Layers
          </span>
        </div>
        <Button
          className="h-6 w-6 rounded border-none hover:bg-accent"
          onClick={() => setIsCollapsed(true)}
          size="icon-xs"
          variant="ghost"
        >
          <PanelLeftClose className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-2">
          {rootItems.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center p-6 text-center">
              <span className="font-medium text-[11px] text-muted-foreground">
                No layers yet
              </span>
              <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed opacity-60">
                Add elements from the toolbar to start designing.
              </p>
            </div>
          ) : (
            rootItems.map((item) => renderItem(item))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
