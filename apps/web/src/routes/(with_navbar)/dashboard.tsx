import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/user-menu";

export const Route = createFileRoute("/(with_navbar)/dashboard")({
  beforeLoad: ({ context, location }) => {
    // Access userId from parent route context (set in __root.tsx beforeLoad)
    const userId = (context as any).userId;

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
  const privateData = useQuery(api.privateData.get);

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome to your dashboard
          </p>
        </div>
        <UserMenu />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 font-semibold text-lg">Overlays</h2>
          <p className="mb-4 text-muted-foreground text-sm">
            Manage your chat overlays and emoji walls
          </p>
          <Link to="/overlays">
            <Button>Go to Overlays</Button>
          </Link>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 font-semibold text-lg">Private Data</h2>
          <p className="text-muted-foreground text-sm">
            {privateData?.message || "No private data"}
          </p>
        </div>
      </div>
    </div>
  );
}
