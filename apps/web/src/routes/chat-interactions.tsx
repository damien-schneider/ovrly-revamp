import { createFileRoute } from "@tanstack/react-router";
import { Command, Gift, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationSidebar } from "@/features/canvas/components/NavigationSidebar";

function ChatInteractionsPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] font-sans text-gray-900">
      <NavigationSidebar />

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-gray-200 border-b bg-white px-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <h1 className="font-semibold text-lg">Chat Interactions</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl">
            <section className="mb-8">
              <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                Chat Commands
              </h2>
              <p className="mb-6 text-gray-600">
                Create custom chat commands that trigger actions, display
                information, or interact with your overlays.
              </p>

              <div className="rounded-xl border border-gray-300 border-dashed bg-white p-8 text-center">
                <Command className="mx-auto mb-4 h-12 w-12 text-blue-400" />
                <h3 className="mb-2 font-medium text-gray-900">
                  Custom Commands
                </h3>
                <p className="mb-4 text-gray-500 text-sm">
                  Coming soon - Create commands like !socials, !schedule, and
                  more
                </p>
                <Button disabled variant="outline">
                  <Zap className="mr-2 h-4 w-4" />
                  Create Command
                </Button>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                Channel Point Rewards
              </h2>
              <p className="mb-6 text-gray-600">
                Connect channel point redemptions to overlay actions and
                effects.
              </p>

              <div className="rounded-xl border border-gray-300 border-dashed bg-white p-8 text-center">
                <Gift className="mx-auto mb-4 h-12 w-12 text-purple-400" />
                <h3 className="mb-2 font-medium text-gray-900">
                  Point Rewards
                </h3>
                <p className="mb-4 text-gray-500 text-sm">
                  Coming soon - Link Twitch channel points to overlay triggers
                </p>
                <Button disabled variant="outline">
                  <Gift className="mr-2 h-4 w-4" />
                  Setup Rewards
                </Button>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                Alerts & Notifications
              </h2>
              <p className="mb-6 text-gray-600">
                Configure alerts for follows, subscriptions, raids, and other
                events.
              </p>

              <div className="rounded-xl border border-gray-300 border-dashed bg-white p-8 text-center">
                <Zap className="mx-auto mb-4 h-12 w-12 text-yellow-400" />
                <h3 className="mb-2 font-medium text-gray-900">
                  Stream Alerts
                </h3>
                <p className="mb-4 text-gray-500 text-sm">
                  Coming soon - Customize alerts for stream events
                </p>
                <Button disabled variant="outline">
                  <Zap className="mr-2 h-4 w-4" />
                  Configure Alerts
                </Button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/chat-interactions")({
  component: ChatInteractionsPage,
});
