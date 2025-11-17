import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import UserMenu from "@/features/auth/components/user-menu";

export const Route = createFileRoute("/(with_navbar)/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const privateData = useQuery(api.privateData.get);
  const allUsers = useQuery(api.profiles.list);

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
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 font-semibold text-lg">All Users</h2>
        {allUsers === undefined && (
          <p className="text-muted-foreground text-sm">Loading users...</p>
        )}
        {allUsers !== undefined && allUsers.length === 0 && (
          <p className="text-muted-foreground text-sm">No users found</p>
        )}
        {allUsers !== undefined && allUsers.length > 0 && (
          <div className="space-y-2">
            {allUsers.map(
              (user: {
                id: string;
                email: string | null;
                name: string | null;
              }) => (
                <div
                  className="flex items-center justify-between rounded border p-3"
                  key={user.id}
                >
                  <div>
                    <p className="font-medium">{user.name || "No name"}</p>
                    <p className="text-muted-foreground text-sm">
                      {user.email || "No email"}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
