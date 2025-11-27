import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/(with_navbar)/assets/sub-badges")({
  beforeLoad: ({ context, location }) => {
    const userId = (context as { userId?: string }).userId;
    if (!userId) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">Sub Badges</h1>
        <p className="text-muted-foreground">
          Create unique badges for your subscribers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            This feature is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Stay tuned for updates!</p>
        </CardContent>
      </Card>
    </div>
  );
}
