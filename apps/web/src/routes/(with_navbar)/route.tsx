import { createFileRoute, Outlet } from "@tanstack/react-router";
import Header from "@/components/header";
import LeftSidemenu from "@/features/left-sidemenu";
import RightSidemenu from "@/features/right-sidemenu";

export const Route = createFileRoute("/(with_navbar)")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
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
  );
}
