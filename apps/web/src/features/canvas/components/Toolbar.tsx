import { useAtom } from "jotai";
import {
  BarChartHorizontal,
  Camera,
  Clock,
  GripHorizontal,
  Hand,
  Image,
  Layout,
  MessageSquare,
  MousePointer2,
  Square,
  Type,
} from "lucide-react";
import { toolModeAtom } from "@/atoms/canvas-atoms";
import { ElementType } from "@/features/canvas/types";

interface ToolbarProps {
  onAddElement: (type: ElementType) => void;
}

export function Toolbar({ onAddElement }: ToolbarProps) {
  const [toolMode, setToolMode] = useAtom(toolModeAtom);

  const isHandTool = toolMode === "hand";

  const tools = [
    { type: ElementType.OVERLAY, icon: Layout, label: "Overlay Container" },
    { type: ElementType.TEXT, icon: Type, label: "Text" },
    { type: ElementType.BOX, icon: Square, label: "Box" },
    { type: ElementType.IMAGE, icon: Image, label: "Image" },
    { type: ElementType.CHAT, icon: MessageSquare, label: "Chat" },
    { type: ElementType.EMOTE_WALL, icon: GripHorizontal, label: "Emote Wall" },
    { type: ElementType.WEBCAM, icon: Camera, label: "Webcam Frame" },
    { type: ElementType.TIMER, icon: Clock, label: "Timer" },
    {
      type: ElementType.PROGRESS,
      icon: BarChartHorizontal,
      label: "Progress Bar",
    },
  ];

  return (
    <div className="fixed top-4 left-1/2 z-100 flex -translate-x-1/2 flex-row items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl">
      <button
        className={`group relative rounded-xl p-2.5 transition-all ${isHandTool ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
        onClick={() => setToolMode("hand")}
        title="Hand Tool (H)"
        type="button"
      >
        <Hand size={18} />
      </button>

      <button
        className={`group relative rounded-xl p-2.5 transition-all ${isHandTool ? "text-gray-500 hover:bg-gray-50 hover:text-gray-900" : "bg-blue-50 text-blue-600 shadow-sm"}`}
        onClick={() => setToolMode("select")}
        title="Select (V)"
        type="button"
      >
        <MousePointer2 size={18} />
      </button>

      <div className="mx-1 h-6 w-px bg-gray-100" />

      {tools.map((tool) => (
        <button
          className="group relative rounded-xl p-2.5 text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-900"
          key={tool.type}
          onClick={() => onAddElement(tool.type)}
          title={tool.label}
          type="button"
        >
          <tool.icon size={18} />
          <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-3 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1.5 font-bold text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {tool.label}
          </span>
        </button>
      ))}
    </div>
  );
}
