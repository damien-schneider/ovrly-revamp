import { useAtom, useAtomValue } from "jotai";
import {
  BarChartHorizontal,
  Camera,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  GripHorizontal,
  Image,
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
import { ElementType, type OverlayElement } from "@/features/canvas/types";

interface LayersPanelProps {
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

function getIcon(type: ElementType) {
  switch (type) {
    case ElementType.OVERLAY:
      return <Layout size={14} />;
    case ElementType.TEXT:
      return <Type size={14} />;
    case ElementType.BOX:
      return <Square size={14} />;
    case ElementType.IMAGE:
      return <Image size={14} />;
    case ElementType.CHAT:
      return <MessageSquare size={14} />;
    case ElementType.EMOTE_WALL:
      return <GripHorizontal size={14} />;
    case ElementType.WEBCAM:
      return <Camera size={14} />;
    case ElementType.TIMER:
      return <Clock size={14} />;
    case ElementType.PROGRESS:
      return <BarChartHorizontal size={14} />;
    default:
      return <Square size={14} />;
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
        <button
          className={`group mx-1 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] transition-colors ${isSelected ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
          onClick={(e) => {
            e.stopPropagation();
            handleSelect(element.id, e.shiftKey || e.metaKey);
          }}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          type="button"
        >
          <button
            className="opacity-0 transition-opacity hover:text-blue-600 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(element.id, { visible: !element.visible });
            }}
            type="button"
          >
            {element.visible ? (
              <Eye size={14} />
            ) : (
              <EyeOff className="text-gray-400" size={14} />
            )}
          </button>

          <span className={isSelected ? "text-blue-600" : "text-gray-400"}>
            {getIcon(element.type)}
          </span>
          <span className="flex-1 truncate font-medium">
            {element.name || element.type}
          </span>

          {children.length > 0 && (
            <ChevronDown className="text-gray-300" size={12} />
          )}
        </button>
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
      <div className="fixed top-6 left-6 z-100 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-xl">
        <button
          className="p-2 text-gray-400 transition-colors hover:text-gray-900"
          onClick={() => setIsCollapsed(false)}
          type="button"
        >
          <PanelLeftOpen size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-6 bottom-6 left-6 z-90 flex w-64 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl transition-all duration-300">
      <div className="flex h-16 items-center justify-between border-gray-100 border-b bg-gray-50/50 p-5">
        <h3 className="font-bold text-[11px] text-gray-400 uppercase tracking-widest">
          Layers
        </h3>
        <button
          className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900"
          onClick={() => setIsCollapsed(true)}
          type="button"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto px-2 py-4">
        {rootItems.length === 0 ? (
          <div className="flex h-full flex-col justify-center p-8 text-center font-medium text-gray-400 text-xs">
            <div className="mb-2">No layers yet</div>
            <div className="text-[10px] opacity-60">
              Add elements from the dock
            </div>
          </div>
        ) : (
          rootItems.map((item) => renderItem(item))
        )}
      </div>
    </div>
  );
}
