import { useForm } from "@tanstack/react-form";
import { createFileRoute, Navigate, useSearch } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/(with_navbar)/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/overlays",
  }),
  // Don't use beforeLoad for auth checks - let Convex handle auth state reactively
  // This prevents issues with HMR and ensures consistent auth state
  component: LoginComponent,
});

function LoginComponent() {
  const { redirect: redirectPath } = useSearch({ from: Route.id });
  const [isSignUp, setIsSignUp] = useState(false);

  // Use full page reload after auth to ensure session state is properly established
  // This is the recommended approach per Better Auth docs for sign-in/sign-out cycles
  const redirectAfterAuth = (path: string) => {
    window.location.href = path;
  };

  const handleTwitchSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "twitch",
        callbackURL: `${window.location.origin}${redirectPath || "/overlays"}`,
      });
    } catch {
      // Error handling is done by authClient
    }
  };

  const emailForm = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      if (isSignUp) {
        await authClient.signUp.email(
          {
            email: value.email,
            password: value.password,
            name: value.name,
          },
          {
            onSuccess: () => {
              toast.success("Sign up successful");
              redirectAfterAuth(redirectPath || "/overlays");
            },
            onError: (error) => {
              toast.error(error.error.message || error.error.statusText);
            },
          }
        );
      } else {
        await authClient.signIn.email(
          {
            email: value.email,
            password: value.password,
          },
          {
            onSuccess: () => {
              toast.success("Sign in successful");
              redirectAfterAuth(redirectPath || "/overlays");
            },
            onError: (error) => {
              toast.error(error.error.message || error.error.statusText);
            },
          }
        );
      }
    },
    validators: {
      onSubmit: isSignUp
        ? z.object({
            name: z.string().min(2, "Name must be at least 2 characters"),
            email: z.email("Invalid email address"),
            password: z
              .string()
              .min(8, "Password must be at least 8 characters"),
          })
        : z.object({
            name: z.string(),
            email: z.email("Invalid email address"),
            password: z
              .string()
              .min(8, "Password must be at least 8 characters"),
          }),
    },
  });

  return (
    <>
      <Authenticated>
        <Navigate to={redirectPath || "/overlays"} />
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
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={handleTwitchSignIn} size="lg">
                Sign in with Twitch
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  emailForm.handleSubmit();
                }}
              >
                {isSignUp && (
                  <div>
                    <emailForm.Field name="name">
                      {(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>Name</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            value={field.state.value}
                          />
                          {field.state.meta.errors.map((error) => (
                            <p
                              className="text-red-500 text-sm"
                              key={error?.message}
                            >
                              {error?.message}
                            </p>
                          ))}
                        </div>
                      )}
                    </emailForm.Field>
                  </div>
                )}

                <div>
                  <emailForm.Field name="email">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Email</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          type="email"
                          value={field.state.value}
                        />
                        {field.state.meta.errors.map((error) => (
                          <p
                            className="text-red-500 text-sm"
                            key={error?.message}
                          >
                            {error?.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </emailForm.Field>
                </div>

                <div>
                  <emailForm.Field name="password">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Password</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          type="password"
                          value={field.state.value}
                        />
                        {field.state.meta.errors.map((error) => (
                          <p
                            className="text-red-500 text-sm"
                            key={error?.message}
                          >
                            {error?.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </emailForm.Field>
                </div>

                <emailForm.Subscribe>
                  {(state) => {
                    let label = "Sign In";
                    if (state.isSubmitting) {
                      label = "Submitting...";
                    } else if (isSignUp) {
                      label = "Sign Up";
                    }
                    return (
                      <Button
                        className="w-full"
                        disabled={!state.canSubmit || state.isSubmitting}
                        type="submit"
                      >
                        {label}
                      </Button>
                    );
                  }}
                </emailForm.Subscribe>
              </form>

              <div className="text-center">
                <Button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setIsSignUp(!isSignUp)}
                  variant="link"
                >
                  {isSignUp
                    ? "Already have an account? Sign In"
                    : "Need an account? Sign Up"}
                </Button>
              </div>
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
