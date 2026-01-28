import { useAtom } from "jotai";
import {
  BarChartHorizontal,
  Camera,
  Clock,
  GripHorizontal,
  Hand,
  Image as ImageIcon,
  Layout,
  MessageSquare,
  MousePointer2,
  Square,
  Type,
} from "lucide-react";
import { toolModeAtom } from "@/atoms/canvas-atoms";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ElementType } from "@/features/canvas/types";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  onAddElement: (type: ElementType) => void;
}

export function Toolbar({ onAddElement }: ToolbarProps) {
  const [toolMode, setToolMode] = useAtom(toolModeAtom);
  const isHandTool = toolMode === "hand";

  const tools = [
    { type: ElementType.OVERLAY, icon: Layout, label: "Overlay" },
    { type: ElementType.TEXT, icon: Type, label: "Text" },
    { type: ElementType.BOX, icon: Square, label: "Box" },
    { type: ElementType.IMAGE, icon: ImageIcon, label: "Image" },
    { type: ElementType.CHAT, icon: MessageSquare, label: "Chat" },
    { type: ElementType.EMOTE_WALL, icon: GripHorizontal, label: "Emote Wall" },
    { type: ElementType.WEBCAM, icon: Camera, label: "Webcam" },
    { type: ElementType.TIMER, icon: Clock, label: "Timer" },
    { type: ElementType.PROGRESS, icon: BarChartHorizontal, label: "Progress" },
  ];

  return (
    <TooltipProvider delay={400}>
      <div className="fixed top-4 left-1/2 z-100 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border/60 bg-background/95 p-1 shadow-xl backdrop-blur-sm">
        <Tooltip>
          <TooltipTrigger>
            <Button
              className={cn(
                "h-8 w-8 border-none transition-colors",
                isHandTool
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              onClick={() => setToolMode("hand")}
              size="icon-xs"
              variant="ghost"
            >
              <Hand className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="px-2 py-1 text-[10px]">
            Hand tool (H)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <Button
              className={cn(
                "h-8 w-8 border-none transition-colors",
                isHandTool
                  ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => setToolMode("select")}
              size="icon-xs"
              variant="ghost"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="px-2 py-1 text-[10px]">
            Select tool (V)
          </TooltipContent>
        </Tooltip>

        <div className="mx-1 h-4 w-px bg-border/50" />

        {tools.map((tool) => (
          <Tooltip key={tool.type}>
            <TooltipTrigger>
              <Button
                className="h-8 w-8 border-none text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => onAddElement(tool.type)}
                size="icon-xs"
                variant="ghost"
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-[10px]">
              Add {tool.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
