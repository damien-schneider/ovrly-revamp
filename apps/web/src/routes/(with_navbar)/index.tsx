import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { useEffect, useState } from "react";
import Loader from "@/features/layout/components/loader";

const AUTH_LOADING_TIMEOUT_MS = 8000;

export const Route = createFileRoute("/(with_navbar)/")({
  component: HomeComponent,
});

function AuthLoadingWithTimeout() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, AUTH_LOADING_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  if (timedOut) {
    return <Navigate search={{ redirect: "/overlays" }} to="/login" />;
  }

  return <Loader />;
}

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

function HomeComponent() {
  const healthCheck = useQuery(api.healthCheck.get, {});
  const isLoading = healthCheck === undefined;

  const statusColor = (() => {
    if (isLoading) {
      return "bg-orange-400";
    }
    if (healthCheck === "OK") {
      return "bg-green-500";
    }
    return "bg-red-500";
  })();

  const statusText = (() => {
    if (isLoading) {
      return "Checking...";
    }
    if (healthCheck === "OK") {
      return "Connected";
    }
    return "Error";
  })();

  return (
    <>
      <AuthLoading>
        <AuthLoadingWithTimeout />
      </AuthLoading>
      <Authenticated>
        <Navigate to="/overlays" />
      </Authenticated>
      <Unauthenticated>
        <div className="container mx-auto max-w-3xl px-4 py-2">
          <pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
          <div className="grid gap-6">
            <section className="rounded-lg border p-4">
              <h2 className="mb-2 font-medium">API Status</h2>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${statusColor}`} />
                <span className="text-muted-foreground text-sm">
                  {statusText}
                </span>
              </div>
            </section>
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}
