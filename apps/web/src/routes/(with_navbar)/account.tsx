import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(with_navbar)/account")({
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
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      <div>
        <h1 className="font-bold text-3xl">Account</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
    </div>
  );
}
