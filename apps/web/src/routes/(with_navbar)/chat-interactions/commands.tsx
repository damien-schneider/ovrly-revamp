import { createFileRoute, redirect } from "@tanstack/react-router";
import { CommandList } from "@/features/chat/command-list";
import { ChatBotStatus } from "@/features/chat/components/chat-bot-status";
import { TwitchRequiredWrapper } from "@/features/chat/components/twitch-required-wrapper";

export const Route = createFileRoute(
  "/(with_navbar)/chat-interactions/commands"
)({
  beforeLoad: ({ context, location }) => {
    // Access userId from parent route context (set in __root.tsx beforeLoad)
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
        <h1 className="font-bold text-3xl">Commands</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your custom chat commands and responses
        </p>
      </div>
      <TwitchRequiredWrapper featureName="chat commands">
        <div className="space-y-6">
          <ChatBotStatus />
          <CommandList />
        </div>
      </TwitchRequiredWrapper>
    </div>
  );
}
