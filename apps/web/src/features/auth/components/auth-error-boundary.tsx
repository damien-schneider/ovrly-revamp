import type { ReactNode } from "react";
import { Component } from "react";
import { Button } from "@/components/ui/button";
import { forceLogout } from "@/lib/clear-auth-state";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// biome-ignore lint: Error boundaries require class components in React - no function component alternative
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleSignOut = () => {
    forceLogout();
  };

  render() {
    if (this.state.hasError) {
      const isAuthError =
        this.state.error?.message?.includes("auth") ||
        this.state.error?.message?.includes("session") ||
        this.state.error?.message?.includes("token") ||
        this.state.error?.message?.includes("timeout");

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md space-y-4 text-center">
            <h2 className="font-semibold text-xl">
              {isAuthError ? "Authentication Error" : "Something went wrong"}
            </h2>
            <p className="text-muted-foreground">
              {isAuthError
                ? "There was a problem with your session. Please try again or sign in again."
                : "An unexpected error occurred. Please try refreshing the page."}
            </p>
            {this.state.error?.message && (
              <p className="rounded bg-muted p-2 font-mono text-muted-foreground text-xs">
                {this.state.error.message}
              </p>
            )}
            <div className="flex justify-center gap-2">
              <Button onClick={this.handleRetry} variant="outline">
                Retry
              </Button>
              {isAuthError && (
                <Button onClick={this.handleSignOut}>Sign Out & Login</Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
