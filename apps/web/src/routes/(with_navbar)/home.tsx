import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(with_navbar)/home")({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: "/overlays",
      search: location.search,
      replace: true,
    });
  },
  component: () => null,
});
