import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Loader from "@/features/layout/components/loader";

const AUTH_LOADING_TIMEOUT_MS = 8000;

export const Route = createFileRoute("/(with_navbar)/")({
  component: LandingPage,
});

function AuthLoadingWithTimeout() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), AUTH_LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  if (timedOut) {
    return <Navigate search={{ redirect: "/overlays" }} to="/login" />;
  }

  return <Loader />;
}

function LandingPage() {
  return (
    <>
      <AuthLoading>
        <AuthLoadingWithTimeout />
      </AuthLoading>
      <Authenticated>
        <Navigate to="/overlays" />
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-svh bg-background text-foreground">
          <header className="border-border/40 border-b">
            <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
              <span className="font-semibold text-lg tracking-tight">
                Ovrly
              </span>
              <Button asChild size="sm" variant="ghost">
                <Link to="/login">Log in</Link>
              </Button>
            </div>
          </header>
          <main className="container mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <section className="mx-auto max-w-2xl text-center">
              <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
                Stream overlays made simple
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Create chat widgets, emote walls, alerts and more for Twitch.
                Customize in the browser and add your overlay URL to OBS.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link search={{ redirect: "/overlays" }} to="/login">
                    Get started
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">Log in</Link>
                </Button>
              </div>
            </section>
            <section className="mt-24 grid gap-8 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-6">
                <h3 className="font-semibold text-foreground">Chat & emotes</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Show chat, emote walls and sub badges on stream.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-6">
                <h3 className="font-semibold text-foreground">
                  One URL for OBS
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Add your overlay URL as a browser source—no local install.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-6">
                <h3 className="font-semibold text-foreground">
                  Customize live
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Resize, restyle and arrange widgets in the canvas editor.
                </p>
              </div>
            </section>
          </main>
        </div>
      </Unauthenticated>
    </>
  );
}
