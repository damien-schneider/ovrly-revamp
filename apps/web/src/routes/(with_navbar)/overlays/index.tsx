import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import OverlayForm from "@/features/overlay/components/overlay-form";
import OverlayList from "@/features/overlay/components/overlay-list";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/(with_navbar)/overlays/")({
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
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Overlays</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your chat overlays and emoji walls
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Create Overlay</Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <OverlayForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      <OverlayList />
    </div>
  );
}
