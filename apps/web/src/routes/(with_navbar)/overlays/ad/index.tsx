import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(with_navbar)/overlays/ad/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="grid size-full place-content-center">
      <p className="text-muted-foreground text-sm">
        Select an ad overlay to get started
      </p>
    </div>
  );
}
