import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(with_navbar)/chat-interactions")({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: "/bot",
      search: location.search,
      replace: true,
    });
  },
  component: () => null,
});
