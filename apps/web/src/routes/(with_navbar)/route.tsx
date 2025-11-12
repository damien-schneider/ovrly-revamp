import {
  createFileRoute,
  Navigate,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Header from "@/components/header";
import LeftSidemenu from "@/features/left-sidemenu";
import RightSidemenu from "@/features/right-sidemenu";

export const Route = createFileRoute("/(with_navbar)")({
  component: LayoutComponent,
});

function LayoutComponent() {
  const pathname = useRouterState().location.pathname;
  const isLoginRoute = pathname === "/login";

  // Login route handles its own authentication state
  if (isLoginRoute) {
    return <Outlet />;
  }

  // All other routes require authentication
  return (
    <>
      <Authenticated>
        <div className="flex h-svh gap-1 p-1">
          <div className="flex h-full flex-col gap-1">
            <Header />
            <LeftSidemenu />
          </div>
          <div className="flex-1 p-1">
            <div className="h-full w-full">
              <Outlet />
            </div>
          </div>
          <RightSidemenu />
        </div>
      </Authenticated>
      <Unauthenticated>
        <Navigate
          search={{
            redirect: pathname,
          }}
          to="/login"
        />
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-svh items-center justify-center">
          <div>Loading...</div>
        </div>
      </AuthLoading>
    </>
  );
}
