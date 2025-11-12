import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(with_navbar)/moderation")({
  beforeLoad: ({ context, location }) => {
    // Access userId from parent route context (set in __root.tsx beforeLoad)
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
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      <div>
        <h1 className="font-bold text-3xl">Moderation</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your moderation settings and rules
        </p>
      </div>
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">
          Moderation features coming soon...
        </p>
      </div>
    </div>
  );
}
