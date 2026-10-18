import { useAtom } from "jotai";
import { activeSceneAtom } from "@/atoms/studio-atoms";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SCENE_LAYOUTS } from "../lib/scene-layouts";

export function ScenePanel() {
  const [activeScene, setActiveScene] = useAtom(activeSceneAtom);

  return (
    <div className="flex h-full flex-col">
      <div className="border-border/50 border-b px-3 py-2">
        <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Scenes
        </h3>
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {SCENE_LAYOUTS.map((scene) => {
          const isActive = activeScene === scene.id;
          const Icon = scene.icon;

          return (
            <Tooltip key={scene.id}>
              <TooltipTrigger>
                <button
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setActiveScene(scene.id)}
                  type="button"
                >
                  <div
                    className={cn(
                      "flex h-8 w-12 items-center justify-center rounded-md border",
                      isActive
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50 bg-background"
                    )}
                  >
                    <Icon
                      className="h-4 w-4"
                      weight={isActive ? "fill" : "regular"}
                    />
                  </div>
                  <span className="font-medium text-xs">{scene.name}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{scene.name} layout</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
