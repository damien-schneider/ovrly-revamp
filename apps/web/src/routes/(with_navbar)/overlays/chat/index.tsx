import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(with_navbar)/overlays/chat/")({
  beforeLoad: ({ context, location }) => {
    const userId = (context as { userId?: string }).userId;

    if (!userId) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="grid size-full place-content-center">
      <p className="text-muted-foreground text-sm">
        Select a chat to get start
      </p>
    </div>
  );
}
