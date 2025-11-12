import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(with_navbar)/overlays/wall-emote/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="grid size-full place-content-center">
      <p className="text-muted-foreground text-sm">
        Select a wall emote to get start
      </p>
    </div>
  );
}
