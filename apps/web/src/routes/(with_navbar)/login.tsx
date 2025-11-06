import { createFileRoute, Navigate, useSearch } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/(with_navbar)/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/dashboard",
  }),
  component: LoginComponent,
});

function LoginComponent() {
  const { redirect } = useSearch({ from: Route.id });

  const handleTwitchSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "twitch",
        callbackURL: redirect || "/dashboard",
      });
    } catch {
      // Error handling is done by authClient
    }
  };

  return (
    <>
      <Authenticated>
        <Navigate to={redirect || "/dashboard"} />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                Sign in with your Twitch account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleTwitchSignIn} size="lg">
                Sign in with Twitch
              </Button>
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center">
          <div>Loading...</div>
        </div>
      </AuthLoading>
    </>
  );
}
